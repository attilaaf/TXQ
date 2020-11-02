import { IAccountContext } from '@interfaces/IAccountContext';
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';

@Service('getTxsPending')
export default class GetTxsPending extends UseCase {

  constructor(
    @Inject('txsyncService') private txsyncService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params: { offset?: any, limit?: any, accountContext?: IAccountContext}): Promise<UseCaseOutcome> {
    let txs = await this.txsyncService.getTxsPending(params.accountContext, params.offset ? params.offset : 0, params.limit ? params.limit : 10000);
    return {
      success: true,
      result: txs
    };
  }
}
