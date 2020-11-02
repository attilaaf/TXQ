import { Service, Inject } from 'typedi';
import { IRetryableTask } from '../../interfaces/IRetryableTask';
import * as cq from 'concurrent-queue';
import * as backoff from 'exponential-backoff';
import Config from '../../cfg';
import TransactionStillProcessing from '../../services/error/TransactionStillProcessing';

@Service('queueService')
export default class QueueService {
  tasks: any = {};
  cqueue: any = {};
  initialized: any = {};
  constructor(
    @Inject('updateTxDlq') private updateTxDlq,
    @Inject('incrementTxRetries') private incrementTxRetries,
    @Inject('syncTxStatus') private syncTxStatus,
    @Inject('logger') private logger) {
  }

  public stats() {
    return {
      queue: {
        merchantapiRequestConcurrency: Config.queue.merchantapiRequestConcurrency,
        abandonedSyncTaskRescanSeconds: Config.queue.abandonedSyncTaskRescanSeconds,
        syncBackoff: {
          maxDelay: Config.queue.syncBackoff.maxDelay,
          numOfAttempts: Config.queue.syncBackoff.numOfAttempts,
          startingDelay: Config.queue.syncBackoff.startingDelay,
          jitter: Config.queue.syncBackoff.jitter,
          timeMultiple: Config.queue.syncBackoff.timeMultiple,
        }
      }
    };
  }

  public async initialize(queueId: string | undefined, concurrency: number = 3) {
    if (this.initialized.queueId) {
      return;
    }
    const cfgConcurrency = Config.queue.merchantapiRequestConcurrency || 3;
    this.tasks[queueId] = new Map();
    this.cqueue[queueId] = cq().limit({ concurrency: cfgConcurrency }).process((task) => {
      return new Promise(async (resolve) => {
          try {
            await task.invoke();
            return resolve({
              success: true,
              task: task,
            });
          } catch (err) {
            if (err instanceof TransactionStillProcessing) {
              // always resolve because we are done processing on cqueue successful
              return resolve({
                success: false,
                task: task,
              });
            }

            this.logger.info('cqueue_task_error', {
              err: err.toString(),
              stack: err.stack,
            });
            // always resolve because we are done processing on cqueue successful
            return resolve({
              success: false,
              task: task,
              err: err.stack,
              stack: err.toString()
            });
          }
      });
    });
    this.initialized[queueId] = true;
  }

  /**
   *
   * @param task Task to be retried
   */
  public async enqTxStatus(queueId: string, txid: string) {
    return this.enq(queueId, {
      id: txid,
      invoke: async () => {
        await this.syncTxStatus.run({txid});
      }
    });
  }

  /**
   *
   * @param task Task to be retried
   */
  public async enq(queueId: string, task: IRetryableTask) {
    this.initialize(queueId);
    const existingTask = this.tasks[queueId].get(task.id);
    if (existingTask) {
      return;
    }
    /**
     * Logic for processing a task
     * @param resolve
     * @param reject
     */
    const taskFunc = (resolve, reject) => {
      this.cqueue[queueId](task).then(function (self) {
        if (self.success) {
          return resolve(self);
        } else {
          return reject(self);
        }
      }).catch((err) => {
        // queue should never fail, but you never know
        reject(err);
      });
    }
    /**
     * Generate a new task promise
     */
    const taskFuncWrapper = function () {
      return new Promise(taskFunc);
    }

    this.tasks[queueId].set(task.id, true);

    // Attempt initially the first time
    try {
      taskFuncWrapper().catch((err) => {});
    } catch (err) {
    }
    // startingDelay will be the first time it is retried.
    try {
      // Todo: Not used for now, but perhaps we can cancel it later in future
      const backoffResponse = await backoff.backOff(
        async () => taskFuncWrapper(),
        {
          maxDelay: Config.queue.syncBackoff.maxDelay, // 1000 * 60 * 60 * 16, // 16 hour max
          numOfAttempts: Config.queue.syncBackoff.numOfAttempts,
          delayFirstAttempt: true,
          startingDelay: Config.queue.syncBackoff.startingDelay,
          jitter: Config.queue.syncBackoff.jitter,
          timeMultiple: Config.queue.syncBackoff.timeMultiple,
          retry: (lastError: any, attemptNumber: number) => {
            this.logger.info('sync_retry', {
              txid: task.id,
              attemptNumber: attemptNumber,
              lastError: lastError
            });
            this.incrementTxRetries.run({txid: task.id});
            return true;
          }
        }
      );
      this.logger.info('sync_complete', backoffResponse);
      this.tasks[queueId].delete(task.id);
    } catch (e) {
      this.logger.error('sync_expired', {
        txid: task.id,
        lasterror: e
      });
      this.updateTxDlq.run({txid: task.id, dlq: 'dead'});
      this.tasks[queueId].delete(task.id);
    }
  }

}
