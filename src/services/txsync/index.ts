import { Service, Inject } from 'typedi';
import InvalidParamError from '../error/InvalidParamError';
import { sync_state } from '../../core/txsync';
import ResourceNotFoundError from '../../services/error/ResourceNotFoundError';
import { IAccountContext } from '@interfaces/IAccountContext';

@Service('txsyncService')
export default class TxsyncService {
  constructor(@Inject('txsyncModel') private txsyncModel, @Inject('txModel') private txModel, @Inject('logger') private logger) {}

  public async getTxsync(accountContext: IAccountContext, txid: string) {
    let entity = await this.txsyncModel.getTxsync(accountContext, txid);
    if (!entity) {
      throw new ResourceNotFoundError();
    }
    return entity;
  }

  public async insertTxsync(accountContext: IAccountContext, txid: string, nosync?: boolean) {
    await this.txsyncModel.insertTxsync(accountContext, txid, nosync);
  }

  public async getTxsForSync(accountContext: IAccountContext) {
    return this.txsyncModel.getTxsForSync(accountContext);
  }

  public async getTxsDlq(accountContext: IAccountContext, dlq?: string) {
    return this.txsyncModel.getTxsDlq(accountContext, dlq);
  }

  public async getTxsPending(accountContext: IAccountContext, offset: number, limit: number) {
    return this.txsyncModel.getTxsPending(accountContext, offset, limit);
  }

  public async getTxsBySyncState(accountContext: IAccountContext, offset: number, limit: number, syncState: sync_state) {
    return this.txsyncModel.getTxsBySyncState(accountContext, offset, limit, syncState);
  }

  public async incrementRetries(accountContext: IAccountContext, txid: string) {
    if (!txid) {
      throw new InvalidParamError();
    }

    await this.txsyncModel.incrementRetries(
      accountContext,
      txid
    );
  }

  public async updateDlq(accountContext: IAccountContext, txid: string, dlq: string) {
    if (!txid) {
      throw new InvalidParamError();
    }

    await this.txsyncModel.updateDlq(
      accountContext,
      txid,
      dlq
    );
  }

  public async setResync(accountContext: IAccountContext, txid: string) {
    await this.txModel.updateCompleted(
      accountContext,
      txid,
      false
    );
    await this.txsyncModel.setResync(
      accountContext,
      txid
    );
  }

  public async updateTxsync(accountContext: IAccountContext, txid: string, sync: sync_state) {
    await this.txsyncModel.updateTxsync(
      accountContext,
      txid,
      sync
    );
  }

  public async updateTxsyncAndClearDlq(accountContext: IAccountContext, txid: string, sync: sync_state) {
    await this.txsyncModel.updateTxsyncAndClearDlq(
      accountContext,
      txid,
      sync
    );
  }
}
