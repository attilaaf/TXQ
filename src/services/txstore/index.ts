import { Service, Inject } from 'typedi';
import { IAccountContext } from '@interfaces/IAccountContext';

@Service('txStoreService')
export default class TxStoreService {
  constructor(@Inject('txStoreModel') private txStoreModel, @Inject('logger') private logger) {}

  public async saveTxStore(accountContext: IAccountContext, id: string, category: string, data: any) {
    return this.txStoreModel.saveTxStore(accountContext, id, category, data);
  }

  public async getTxStore(accountContext: IAccountContext, id: string, category: string, revision?: number) {
    return this.txStoreModel.getTxStore(accountContext, id, category, revision);
  }

  public async getTxStoreRevisions(accountContext: IAccountContext, id: string, category: string) {
    return this.txStoreModel.getTxStoreRevisions(accountContext, id, category);
  }
}
