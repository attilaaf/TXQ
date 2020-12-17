import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import { IAccountContext } from '@interfaces/IAccountContext';
@Service('getUtxoCountByGroup')
export default class GetUtxoCountByGroup extends UseCase {

  constructor(
    @Inject('txoutService') private txoutService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params: { groupname: string, accountContext?: IAccountContext}): Promise<UseCaseOutcome> {
    let counter = await this.txoutService.getTxoutCountByGroup(params.accountContext, { ...params, unspent: true});
    return {
      success: true,
      result: {
        count: Number(counter)
      }
    };
  }
}
