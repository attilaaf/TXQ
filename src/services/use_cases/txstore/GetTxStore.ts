import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import { IAccountContext } from '@interfaces/IAccountContext';
import contextFactory from '../../../bootstrap/middleware/di/diContextFactory';

@Service('getTxStore')
export default class GetTxStore extends UseCase {
  constructor(
    @Inject('logger') private logger,
    @Inject('txStoreService') private txStoreService,
  ) {
    super();
  }

  public async run(params: {
    id: string,
    category: string,
    revision: any,
    accountContext?: IAccountContext
  }): Promise<UseCaseOutcome> {
    const txStore = await this.txStoreService.getTxStore(params.accountContext, params.id, params.category, params.revision);
    return {
      success: true,
      result: txStore
    };
  }
}
