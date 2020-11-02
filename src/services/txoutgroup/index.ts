import { Service, Inject } from 'typedi';
import { IOutputGroupEntry } from '@interfaces/IOutputGroupEntry';
import { IAccountContext } from '@interfaces/IAccountContext';

@Service('txoutgroupService')
export default class TxoutgroupService {
  constructor(@Inject('txoutgroupModel') private txoutgroupModel, @Inject('logger') private logger) {}

  public async getTxoutgroupByName(accountContext: IAccountContext, groupname: string, offset: number, limit: number) {
    return this.txoutgroupModel.getTxoutgroupByName(accountContext, groupname, offset, limit);
  }

  public async getTxoutgroupNamesByScriptId(accountContext: IAccountContext, scriptId: string) {
    return this.txoutgroupModel.getTxoutgroupNamesByScriptId(accountContext, scriptId);
  }

  public async getTxoutgroupNamesByScriptIds(accountContext: IAccountContext, scriptIds: string[]) {
    return this.txoutgroupModel.getTxoutgroupNamesByScriptIds(accountContext, scriptIds);
  }

  public async saveTxoutgroups(accountContext: IAccountContext, groupname: string, items: IOutputGroupEntry[]) {
    return this.txoutgroupModel.saveTxoutgroups(accountContext, groupname, items);
  }

  public async deleteTxoutgroups(accountContext: IAccountContext, groupname: string, scriptids: string[]) {
    return this.txoutgroupModel.deleteTxoutgroupByGroupAndScriptids(accountContext, groupname, scriptids);
  }
}



