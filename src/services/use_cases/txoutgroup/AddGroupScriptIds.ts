import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import { IOutputGroupEntry } from '@interfaces/IOutputGroupEntry';
import { IAccountContext } from '@interfaces/IAccountContext';

@Service('addGroupScriptIds')
export default class AddGroupScriptIds extends UseCase {

  constructor(
    @Inject('txoutgroupService') private txoutgroupService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params: { groupname: string, items: IOutputGroupEntry[], accountContext?: IAccountContext}): Promise<UseCaseOutcome> {
    await this.txoutgroupService.saveTxoutgroups(params.accountContext, params.groupname, params.items);
    return {
      success: true,
      result: {}
    };
  }
}
