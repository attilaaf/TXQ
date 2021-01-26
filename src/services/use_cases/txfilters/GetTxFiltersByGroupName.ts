import { IAccountContext } from '@interfaces/IAccountContext';
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';

@Service('getTxFiltersByGroupName')
export default class GetTxFiltersByGroupName extends UseCase {

  constructor(
    @Inject('txfilterService') private txfilterService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params?: {accountContext?: IAccountContext, groupname?: string}): Promise<UseCaseOutcome> {
    let result = await this.txfilterService.getByGroupName(params.accountContext, params.groupname);
    return {
      success: true,
      result: result
    };
  }
}
