import { Service, Inject } from 'typedi';
import { DateUtil } from '../../services/helpers/DateUtil';
import { ITransactionMeta } from '../../interfaces/ITransactionData';
import { IAccountContext } from '@interfaces/IAccountContext';
import { PoolFactory } from '../../bootstrap/middleware/di/diDatabase';

@Service('txmetaModel')
class TxmetaModel {
  constructor(@Inject('db') private db: PoolFactory) {}

  public async isTxMetaExist(accountContext: IAccountContext, txid: string, channel: string): Promise<boolean> {
    let channelStr = channel ? channel : '';
    let result: any = await this.db.getClient(accountContext).query(`SELECT txid FROM txmeta WHERE channel = $1 AND txid = $2`, [ channelStr, txid ]);
    return !!result.rows[0];
  }

  public async getTxmeta(accountContext: IAccountContext, txid: string, channel?: string): Promise<string> {
    let channelStr = channel ? channel : '';
    let result: any = await this.db.getClient(accountContext).query(`SELECT * FROM txmeta WHERE channel = $1 AND txid = $2`, [channelStr, txid]);
    return result.rows[0];
  }

  public async getTxsByChannel(accountContext: IAccountContext, channel: string | null | undefined, afterId: number, limit: number, rawtx?: boolean): Promise<string[]> {
    let result: any;
    let channelStr = channel ? channel : '';
    result = await this.db.getClient(accountContext).query(`
    SELECT txmeta.id, ${rawtx ? 'tx.rawtx,' : '' } tx.txid, i, h, tx.send, status, completed, tx.updated_at, tx.created_at,
    channel, metadata, tags, extracted FROM tx, txmeta
    WHERE id >= $1 AND channel = $2 AND tx.txid = txmeta.txid
    ORDER BY txmeta.created_at DESC
    LIMIT $3`, [
      afterId, channelStr,limit
    ]);
    return result.rows;
  }

  public async saveTxmeta(accountContext: IAccountContext, txid: string, channel: string | undefined | null, txmeta: ITransactionMeta, tags: any, extracted: any): Promise<string> {
    const txmetainsert = JSON.stringify(txmeta || {});
    const tagsinsert = JSON.stringify(tags || {});
    const datainsert = JSON.stringify(extracted || {});
    const now = DateUtil.now();
    let channelStr = channel ? channel : '';
    let result: any = await this.db.getClient(accountContext).query(`
    INSERT INTO txmeta(txid, channel, metadata, updated_at, created_at, tags, extracted)
    VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT(txid, channel) DO UPDATE
    SET updated_at = EXCLUDED.updated_at, metadata = EXCLUDED.metadata, tags = EXCLUDED.tags, extracted = EXCLUDED.extracted`,[
      txid,channelStr, txmetainsert,now, now, tagsinsert,datainsert
    ]);
    return result;
  }
}

export default TxmetaModel;
