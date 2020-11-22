import { Service, Inject } from 'typedi';
import { DateUtil } from '../../services/helpers/DateUtil';
import { ITransactionStatus } from '../../interfaces/ITransactionData';
import { IAccountContext } from '@interfaces/IAccountContext';
import { ContextFactory } from '../../bootstrap/middleware/di/diContextFactory';

@Service('txModel')
class TxModel {

  constructor(@Inject('db') private db: ContextFactory) {}

  public async isTxExist(accountContext: IAccountContext, txid: string): Promise<boolean> {
    const client = await this.db.getClient(accountContext);
    let result: any = await client.query(`SELECT txid FROM tx WHERE txid = $1`, [ txid ]);
    return !!result.rows[0];
  }

  public async getTx(accountContext: IAccountContext, txid: string, rawtx?: boolean): Promise<string> {
    const client = await this.db.getClient(accountContext);
    let result: any = await client.query(`
      SELECT 
        tx.txid
        ,${rawtx ? 'tx.rawtx,' : '' } tx.h
        ,tx.i
        ,tx.send
        ,tx.status
        ,tx.completed
        ,tx.updated_at
        ,tx.created_at
        ,txsync.dlq 
      FROM 
        tx 
      INNER JOIN 
        txsync ON (tx.txid = txsync.txid) 
      WHERE 
        tx.txid = $1 `, [ txid ]);
    return result.rows[0];
  }

  public async saveTxid(accountContext: IAccountContext, txid: string): Promise<string> {
    const client = await this.db.getClient(accountContext);
    const now = DateUtil.now();
    let result: any = await client.query(`
    INSERT INTO tx(txid, updated_at, created_at, completed)
    VALUES ($1, $2, $3, false)
    ON CONFLICT DO NOTHING
    RETURNING txid`, [
      txid, now, now
    ]);
    return result;
  }

  public async saveTx(accountContext: IAccountContext, txid: string, rawtx?: string): Promise<string> {
    const client = await this.db.getClient(accountContext);
    const now = DateUtil.now();
    let result: any = await client.query(`
    INSERT INTO tx(txid, rawtx, updated_at, created_at, completed)
    VALUES ($1, $2, $3, $4, false)
    ON CONFLICT(txid) DO UPDATE SET rawtx = EXCLUDED.rawtx, updated_at=EXCLUDED.updated_at
    RETURNING txid`, [
      txid, rawtx, now, now
    ]);
    return result;
  }

  public async saveTxStatus(accountContext: IAccountContext, txid: string, txStatus: ITransactionStatus, blockhash: string | null, blockheight: number | null): Promise<string> {
    const client = await this.db.getClient(accountContext);
    const now = DateUtil.now();
    if (blockhash && blockheight) {
      let result: any = await client.query(`
      UPDATE tx SET status = $1, h = $2, i = $3, updated_at = $4, completed = true
      WHERE txid = $5`, [
        JSON.stringify(txStatus),
        blockhash,
        blockheight,
        now,
        txid
      ]);
      return result;
    }
    let result: any = await client.query(`UPDATE tx SET status = $1, updated_at = $2 WHERE txid = $3`, [ JSON.stringify(txStatus), now, txid ]);
    return result;
  }

  public async saveTxSend(accountContext: IAccountContext, txid: string, send: any): Promise<string> {
    const client = await this.db.getClient(accountContext);
    const now = DateUtil.now();
    let result: any = await client.query(`UPDATE tx SET send = $1, updated_at = $2 WHERE txid = $3`, [ JSON.stringify(send), now, txid ]);
    return result;
  }

  public async updateCompleted(accountContext: IAccountContext, txid: string, completed?: boolean): Promise<string> {
    const client = await this.db.getClient(accountContext);
    const now = DateUtil.now();
    let result: any = await client.query(`UPDATE tx SET updated_at = $1, completed = $2 WHERE txid = $3`, [ now, !!completed, txid ]);
    return result;
  }
}

export default TxModel;
