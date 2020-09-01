import { Service, Inject } from 'typedi';
import { IOutputGroupEntry } from '@interfaces/IOutputGroupEntry';

@Service('txoutgroupService')
export default class TxoutgroupService {
  constructor(@Inject('txoutgroupModel') private txoutgroupModel, @Inject('logger') private logger) {}

  public async getTxoutgroupByName(groupname: string, offset: number, limit: number) {
    return await this.txoutgroupModel.getTxoutgroupByName(groupname, offset, limit);
  }

  public async getTxoutgroupNamesByScriptId(scriptId: string) {
    return await this.txoutgroupModel.getTxoutgroupNamesByScriptId(scriptId);
  }

  public async getTxoutgroupNamesByScriptIds(scriptIds: string[]) {
    return await this.txoutgroupModel.getTxoutgroupNamesByScriptIds(scriptIds);
  }

  public async saveTxoutgroups(groupname: string, items: IOutputGroupEntry[]) {
    return await this.txoutgroupModel.saveTxoutgroups(groupname, items);
  }

  public async deleteTxoutgroups(groupname: string, scriptids: string[]) {
    return await this.txoutgroupModel.deleteTxoutgroupByGroupAndScriptids(groupname, scriptids);
  }
}



