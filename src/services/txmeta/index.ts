import { IAccountContext } from '@interfaces/IAccountContext';
import { Service, Inject } from 'typedi';
import { QueryOrderType } from '../../interfaces/IQueryOrder';
import { ITransactionMeta, TransactionStatusType } from '../../interfaces/ITransactionData';

@Service('txmetaService')
export default class TxmetaService {
  constructor(@Inject('txmetaModel') private txmetaModel, @Inject('logger') private logger) {}

  public isTxMetaExist(accountContext: IAccountContext, txid: string, channel: string): Promise<boolean> {
    return this.txmetaModel.isTxMetaExist(accountContext, txid, channel);
  }

  public async getTxmeta(accountContext: IAccountContext, txid: string, channel?: string) {
    let tx = await this.txmetaModel.getTxmeta(accountContext, txid, channel);
    return tx;
  }

  public async getTxsByChannel(accountContext: IAccountContext, channel: string, afterId: number, limit: number, status: TransactionStatusType, order: QueryOrderType, addresses: string[], scripthashes: string[], txids: string[], from?: number, to?: number, rawtx?: boolean) {
    return this.txmetaModel.getTxsByChannel(accountContext, channel, afterId, limit, status, order, addresses, scripthashes, txids, from, to, rawtx);
  }

  public async saveTxmeta(accountContext: IAccountContext, txid: string, channel: string | undefined | null, txmeta: ITransactionMeta, tags: any, extracted: any) {
    await this.txmetaModel.saveTxmeta(accountContext,
      txid, channel, txmeta, tags, extracted
    );
  }
}
