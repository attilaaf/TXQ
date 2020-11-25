import { IAccountContext } from '@interfaces/IAccountContext';
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';

@Service('deleteTxFilter')
export default class DeleteTxFilter extends UseCase {

  constructor(
    @Inject('txfilterService') private txfilterService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params?: { accountContext?: IAccountContext, 
    name: string
  }): Promise<UseCaseOutcome> {
    let result = await this.txfilterService.delete(params.accountContext, params);
    return {
      success: true,
      result: result
    };
  }
}
