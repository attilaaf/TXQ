import { Service, Inject } from 'typedi';
import { DateUtil } from '../../services/helpers/DateUtil';
import { ITransactionMeta, TransactionStatusType } from '../../interfaces/ITransactionData';
import { IAccountContext } from '@interfaces/IAccountContext';
import { ContextFactory } from '../../bootstrap/middleware/di/diContextFactory';

@Service('txmetaModel')
class TxmetaModel {
  constructor(@Inject('db') private db: ContextFactory) {}

  public async isTxMetaExist(accountContext: IAccountContext, txid: string, channel: string): Promise<boolean> {
    const client = await this.db.getClient(accountContext);
    let channelStr = channel ? channel : '';
    let result: any = await client.query(`SELECT txid FROM txmeta WHERE channel = $1 AND txid = $2`, [ channelStr, txid ]);
    return !!result.rows[0];
  }

  public async getTxmeta(accountContext: IAccountContext, txid: string, channel?: string): Promise<string> {
    const client = await this.db.getClient(accountContext);
    let channelStr = channel ? channel : '';
    let result: any = await client.query(`SELECT * FROM txmeta WHERE channel = $1 AND txid = $2`, [channelStr, txid]);
    return result.rows[0];
  }

  public async getTxsByChannel(accountContext: IAccountContext, channel: string | null | undefined, afterId: number, limit: number, status: TransactionStatusType, rawtx?: boolean): Promise<string[]> {
    const client = await this.db.getClient(accountContext);
    let result: any;
    let channelStr = channel ? channel : '';

    let statusCondition = '';
    switch (status) {
      case 'confirmed':
        statusCondition = ` 
          AND txsync.dlq IS NULL 
          AND tx.completed = TRUE 
          AND tx.i IS NOT NULL 
        `;
        break;

      case 'unconfirmed':
        statusCondition = ` 
          AND txsync.dlq IS NULL 
          AND (
            tx.completed = FALSE 
            OR tx.i IS NULL
          ) 
        `;
        break;

      case 'dead':
        statusCondition = ` 
          AND txsync.dlq IS NOT NULL 
        `;
        break;

      case 'all':
      default:
        break;
    }

    result = await client.query(
      `SELECT 
        txmeta.id
        ,${rawtx ? 'tx.rawtx,' : '' } tx.txid
        ,i
        ,h
        ,tx.send
        ,status
        ,completed
        ,tx.updated_at
        ,tx.created_at
        ,channel
        ,metadata
        ,tags
        ,extracted 
        ,txsync.dlq
      FROM 
        tx 
      INNER JOIN 
        txmeta ON (tx.txid = txmeta.txid) 
      INNER JOIN 
        txsync ON (txmeta.txid = txsync.txid) 
      WHERE 
        ${
          afterId 
          ? `id < $1 AND channel = $2 ` 
          : `channel = $1 `
        } 
        AND tx.txid = txmeta.txid 
        ${statusCondition}
      ORDER BY txmeta.created_at DESC 
      ${
        afterId 
        ? `LIMIT $3` 
        : `LIMIT $2` 
      }`, 
      afterId 
      ? [ afterId, channelStr, limit ] 
      : [ channelStr, limit ]
    );

    return result.rows;
  }

  public async saveTxmeta(accountContext: IAccountContext, txid: string, channel: string | undefined | null, txmeta: ITransactionMeta, tags: any, extracted: any): Promise<string> {
    const client = await this.db.getClient(accountContext);
    const txmetainsert = JSON.stringify(txmeta || {});
    const tagsinsert = JSON.stringify(tags || {});
    const datainsert = JSON.stringify(extracted || {});
    const now = DateUtil.now();
    let channelStr = channel ? channel : '';
    let result: any = await client.query(`
    INSERT INTO txmeta(txid, channel, metadata, updated_at, created_at, tags, extracted)
    VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT(txid, channel) DO UPDATE
    SET updated_at = EXCLUDED.updated_at, metadata = EXCLUDED.metadata, tags = EXCLUDED.tags, extracted = EXCLUDED.extracted`,[
      txid,channelStr, txmetainsert,now, now, tagsinsert,datainsert
    ]);
    return result;
  }
}

export default TxmetaModel;
