import { IAccountContext } from '@interfaces/IAccountContext';
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';

@Service('getTxFilters')
export default class GetTxFilters extends UseCase {

  constructor(
    @Inject('txfilterService') private txfilterService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params?: {accountContext?: IAccountContext}): Promise<UseCaseOutcome> {
    let result = await this.txfilterService.getAll(params.accountContext);
    return {
      success: true,
      result: result
    };
  }
}
