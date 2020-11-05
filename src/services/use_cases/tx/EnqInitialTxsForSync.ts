import { IAccountContext } from '@interfaces/IAccountContext';
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import contextFactory from '../../../bootstrap/middleware/di/diContextFactory';

@Service('enqInitialTxsForSync')
export default class EnqInitialTxsForSync extends UseCase {

  constructor(
    @Inject('txsyncService') private txsyncService,
    @Inject('queueService') private queueService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params?: {accountContext?: IAccountContext}): Promise<UseCaseOutcome> {
    let txs = await this.txsyncService.getTxsForSync(params.accountContext);

    this.logger.info('sync_txs', {
      count: txs.length
    });
    for (const tx of txs) {
      this.queueService.enqTxStatus(params.accountContext, tx);
    }
    return {
      success: true,
      result: txs
    };
  }
}
