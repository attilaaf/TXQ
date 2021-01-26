import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import ResourceNotFoundError from '../../error/ResourceNotFoundError';
import Config from './../../../cfg';
import TransactionStillProcessing from '../../error/TransactionStillProcessing';
import TransactionDataMissingError from '../../error/TransactionDataMissingError';
import { sync_state } from '../../../core/txsync';
import { MerchantRequestor } from '../../helpers/MerchantRequestor';
import { IAccountContext } from '@interfaces/IAccountContext';
import contextFactory from '../../../bootstrap/middleware/di/diContextFactory';
@Service('syncTxStatus')
export default class SyncTxStatus extends UseCase {
  constructor(
    @Inject('merchantapilogService') private merchantapilogService,
    @Inject('txService') private txService,
    @Inject('txsyncService') private txsyncService,
    @Inject('logger') private logger
  ) {
    super();
  }

 /**
  * Whether this is a valid synced statuts
  * @param status
  */
  public isStatusSuccess(status: any): boolean {

    if (!status) {
      return false;
    }

    let parsedStatus = status.payload;
    if (typeof status.payload === 'string') {
      parsedStatus = JSON.parse(status.payload);
    }

    if (parsedStatus && (parsedStatus.blockHash && parsedStatus.blockHash.trim() !== '') &&
      (parsedStatus.blockHeight) && parsedStatus.returnResult === 'success') {
      return true;
    }
    return false;
  }

  /**
   * Save the latest tx status and update blockhash if needed
   *
   * @param txid txid to save status
   * @param status Merchant api status returned
   */
  public async saveTxStatus(accountContext: IAccountContext, txid: string, status: any): Promise<any> {
    let blockhash = null;
    let blockheight = null;

    let parsedStatus = status.payload;
    if (typeof status.payload === 'string') {
      parsedStatus = JSON.parse(status.payload);
    }

    if (parsedStatus && parsedStatus.blockHash && parsedStatus.blockHeight && parsedStatus.returnResult === 'success') {
      blockhash = parsedStatus.blockHash;
      blockheight = parsedStatus.blockHeight;
      await this.txService.saveTxStatus(accountContext, txid, status, blockhash, blockheight);
      await this.txService.setTxCompleted(accountContext, txid);
    } else {
      await this.txService.saveTxStatus(accountContext, txid, status, blockhash, blockheight);
    }
  }

  public async run(params: {
    txid: string,
    forceRefresh?: boolean,
    accountContext?: IAccountContext
  }): Promise<UseCaseOutcome> {
    this.logger.debug('sync', {
      txid: params.txid,
      trace: 1,
      projectId: params.accountContext.projectId
    });
    let txsync = await this.txsyncService.getTxsync(params.accountContext, params.txid);
    let tx = await this.txService.getTx(params.accountContext, params.txid, false);

    this.logger.debug('sync', {
      txid: params.txid,
      txsync: txsync.sync,
      trace: 2,
      projectId: params.accountContext.projectId
    });
    if (!tx || !txsync) {
      this.logger.error('sync', {
        txid: params.txid,
        txsync: txsync.sync,
        info: 'ResourceNotFoundError',
        projectId: params.accountContext.projectId
      });
      throw new ResourceNotFoundError();
    }
    // If the status is acceptable, then just return it
    if (!params.forceRefresh && tx.status && tx.status.valid &&
        tx.status.payload.blockHash && tx.status.payload.blockHeight && tx.status.payload.returnResult === 'success') {

      this.logger.debug('sync', {
        txid: params.txid,
        txsync: txsync.sync,
        info: 'already_completed',
        projectId: params.accountContext.projectId
      });
      // It should be a 2 for sync_success
      if (txsync.sync !== 2) {
        await this.txService.setTxCompleted(params.accountContext, tx.txid);
      }
      return {
        success: true,
        result: tx.status
      };
    }

    const saveResponseTask = async (miner: string, eventType: string, response: any, txid: string) => {
      await this.merchantapilogService.saveNoError(params.accountContext, miner, eventType, response, txid);
      return true;
    };

    const merchantRequestor = new MerchantRequestor(
      contextFactory.getNetwork(params.accountContext),
      contextFactory.getMapiEndpoints(params.accountContext),
      this.logger,
      saveResponseTask
    );

    let status = await merchantRequestor.statusTx(params.txid);
    await this.saveTxStatus(params.accountContext, params.txid, status);
    if (this.isStatusSuccess(status)) {
      this.logger.debug('sync', {
        txid: params.txid,
        info: 'status_success',
        txsync: txsync.sync,
        projectId: params.accountContext.projectId
      });
      if (txsync.sync !== 2) {
        await this.txService.setTxCompleted(params.accountContext, tx.txid);
      }
      return {
        success: true,
        result: status
      };
    }
    this.logger.debug('sync', {
      txid: params.txid,
      trace: 3,
      txsync: txsync.sync,
    });
    // Check various error conditions and check whether we need to resend or halt
    if (status && status.payload && status.payload.returnResult === 'failure' &&
      status.payload.resultDescription === 'ERROR: No such mempool or blockchain transaction. Use gettransaction for wallet transactions.') {
        this.logger.debug('sync', {
          txid: params.txid,
          trace: 4,
          txsync: txsync.sync,
        });
      // Now load rawtx
      tx = await this.txService.getTx(params.accountContext, params.txid, true);
      if (tx.rawtx) {
        this.logger.debug('send', {
          txid: tx.txid,
          txsync: txsync.sync,
        });
        let response;
        this.logger.debug('sync', {
          txid: params.txid,
          trace: 5,
          txsync: txsync.sync,
        });
        try {
          const b = Buffer.from(tx.rawtx, 'hex');
          response = await merchantRequestor.pushTx(b, 'application/octet-stream');
          this.logger.info('sync', {
            txid: params.txid,
            trace: 6,
            txsync: txsync.sync,
            response
          });
        } catch (err) {
          this.logger.error('push_error', {
            err: JSON.stringify(err),
            stack: err.stack,
            txid: params.txid,
            txsync: txsync.sync,
          });
          throw err;
        }
        this.logger.debug('send_result', {
          response
        });
        await this.txService.saveTxSend(params.accountContext, params.txid, response);

        if (response.payload.returnResult === 'failure') {
          if (response.payload.resultDescription !== 'ERROR: No such mempool or blockchain transaction. Use gettransaction for wallet transactions.') {
            this.logger.error('send_error', {
              txid: tx.txid,
              sendPayload: response.payload,
              txsync: txsync.sync,
            });
   
            this.logger.error('Updating_tx_sync_fail', {
              txid: params.txid,
              txsync: txsync.sync,
              response
            });
            // Something bad, cannot recover
            await this.txsyncService.updateTxsync(params.accountContext, params.txid, sync_state.sync_fail);

            return {
              success: true,
              result: status
            };
          } else {
            this.logger.debug('Updating_race_condition_recovered', {
              txid: params.txid,
              txsync: txsync.sync,
              response
            });
          }
        }
        // Try to update status again since we just broadcasted
        // Update in the background
        setTimeout(async () => {
          let retryStatus = await merchantRequestor.statusTx(params.txid);
          await this.saveTxStatus(params.accountContext, params.txid, retryStatus);
        }, 1000);
      } else {
        // Note: Let this error out
        // We might want to throw an exception so we can allow user to keep retrying tx's
        this.logger.debug('sync', {
          txid: params.txid,
          txsync: txsync.sync,
          info: 'TransactionDataMissingError',
        });
        throw new TransactionDataMissingError();
      }
    }
    this.logger.debug('sync', {
      txid: params.txid,
      status: status,
      txsync: txsync.sync,
      info: 'TransactionStillProcessing',
    });

    // Transaction has not setled
    throw new TransactionStillProcessing();
  }
}
