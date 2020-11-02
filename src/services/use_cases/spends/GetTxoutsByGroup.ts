import { IAccountContext } from '@interfaces/IAccountContext';
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
@Service('getTxoutsByGroup')
export default class GetTxoutsByGroup extends UseCase {

  constructor(
    @Inject('txoutService') private txoutService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params: {
      groupname: string, script?: boolean, offset: any, limit: any, unspent?: boolean, accountContext?: IAccountContext
    }): Promise<UseCaseOutcome> {
    let entities = await this.txoutService.getTxoutsByGroup(params.accountContext, params);
    return {
      success: true,
      result: entities
    };
  }
}
