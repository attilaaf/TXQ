import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import { IAccountContext } from '@interfaces/IAccountContext';
import contextFactory from '../../../bootstrap/middleware/di/diContextFactory';

@Service('saveTxStore')
export default class SaveTxStore extends UseCase {
  constructor(
    @Inject('logger') private logger,
    @Inject('txStoreService') private txStoreService,
  ) {
    super();
  }

  public async run(params: {
    id: string,
    category: string,
    data: any,
    accountContext?: IAccountContext
  }): Promise<UseCaseOutcome> {

    const res = await this.txStoreService.saveTxStore(params.accountContext, params.id, params.category, params.data);
    return {
      success: true,
      result: res
    };
  }
}
