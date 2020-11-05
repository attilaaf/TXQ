import { IAccountContext } from '@interfaces/IAccountContext';
import contextFactory from '../../../bootstrap/middleware/di/diContextFactory';
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';

@Service('requeueTxsDlq')
export default class RequeueTxsDlq extends UseCase {

  constructor(
    @Inject('txsyncService') private txsyncService,
    @Inject('queueService') private queueService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params: { dlq?: string, limit: number, accountContext?: IAccountContext}): Promise<UseCaseOutcome> {
    let txs = await this.txsyncService.getTxsDlq(params.accountContext, params.dlq);
    const queueSettings = contextFactory.getQueueSettings(params.accountContext);
    let counter = 0;
    let requeued = [];
    for (const tx of txs) {
      this.txsyncService.setResync(params.accountContext, tx);
      this.queueService.enqTxStatus(params.accountContext, tx);
      requeued.push(tx);
      if (counter >= params.limit) {
        break;
      }
      counter++;
    }
    return {
      success: true,
      result: requeued
    };
  }
}
