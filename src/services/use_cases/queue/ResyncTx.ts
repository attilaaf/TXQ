import { IAccountContext } from '@interfaces/IAccountContext';
import contextFactory from '../../../bootstrap/middleware/di/diContextFactory';
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';

@Service('resyncTx')
export default class ResyncTx extends UseCase {

  constructor(
    @Inject('txsyncService') private txsyncService,
    @Inject('queueService') private queueService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params: { txid: string, accountContext?: IAccountContext}): Promise<UseCaseOutcome> {
    const data = this.txsyncService.setResync(params.accountContext, params.txid);
    const queueSettings = contextFactory.getQueueSettings(params.accountContext);
    this.queueService.enqTxStatus(params.accountContext, params.txid);

    return {
      success: true,
      result: data
    };
  }
}
