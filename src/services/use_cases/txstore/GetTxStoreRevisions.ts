import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import { IAccountContext } from '@interfaces/IAccountContext';
import contextFactory from '../../../bootstrap/middleware/di/diContextFactory';

@Service('getTxStoreRevisions')
export default class GetTxStoreRevisions extends UseCase {
  constructor(
    @Inject('logger') private logger,
    @Inject('txStoreService') private txStoreService,
  ) {
    super();
  }

  public async run(params: {
    id: string,
    category: string,
    accountContext?: IAccountContext
  }): Promise<UseCaseOutcome> {
   
  const revs = await this.txStoreService.getTxStoreRevisions(params.accountContext, params.id, params.category);
    return {
      success: true,
      result: revs
    };
  }
}
