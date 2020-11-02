import { Service, Inject } from 'typedi';
import { DateUtil } from '../../services/helpers/DateUtil';
import { Pool } from 'pg';

export enum sync_state {
  sync_fail = -1,
  sync_none = 0,
  sync_pending = 1,
  sync_success = 2,
}

@Service('txsyncModel')
class TxsyncModel {

  constructor(@Inject('db') private db: Pool) {}

  public async getTxsync(txid: string): Promise<string> {
    let result: any = await this.db.query(`SELECT * FROM txsync WHERE txid = $1`, [  txid ]);
    return result.rows[0];
  }

  public async getTxsForSync(): Promise<string[]> {
    let result: any = await this.db.query(`SELECT txid FROM txsync WHERE sync = 1`);
    const txids = [];
    for (const item of result.rows) {
      txids.push(item.txid);
    }
    return txids;
  }

  public async getTxsDlq(dlq?: string): Promise<string[]> {
    let result: any;

    // tslint:disable-next-line: prefer-conditional-expression
    if (dlq) {
      result = await this.db.query(`SELECT txid FROM txsync WHERE dlq = $1`, [ dlq ]);
    } else {
      result = await this.db.query(`SELECT txid FROM txsync WHERE dlq IS NOT NULL`);
    }

    const txids = [];
    for (const item of result.rows) {
      txids.push(item.txid);
    }
    return txids;
  }

  public async getTxsPending(offset: number, limit = 10000): Promise<string[]> {
    let result: any;
    result = await this.db.query(`
    SELECT tx.txid FROM tx, txsync
    WHERE txsync.sync = 1 AND txsync.txid = tx.txid AND tx.completed = false
    OFFSET $1 LIMIT $2`, [ offset, limit]);
    const txids = [];
    for (const item of result.rows) {
      txids.push(item.txid);
    }
    return txids;
  }

  public async getTxsBySyncState(offset: number, limit: number, syncState: sync_state): Promise<string[]> {
    let result: any;
    result = await this.db.query(`
    SELECT tx.txid FROM tx, txsync
    WHERE txsync.sync = $1
    AND txsync.txid = tx.txid
    OFFSET $2 LIMIT $3`,[ syncState, offset, limit]);
    const txids = [];
    for (const item of result.rows) {
      txids.push(item.txid);
    }
    return txids;
  }

  public async incrementRetries(txid: string): Promise<string> {
    const now = DateUtil.now();
    let result: any = await this.db.query(`
    UPDATE txsync
    SET status_retries = status_retries + 1, updated_at = $1
    WHERE txid = $2`, [ now,txid ]);
    return result;
  }

  public async updateDlq(txid: string, dlq: string): Promise<string> {
    const now = DateUtil.now();
    let result: any = await this.db.query(`
    UPDATE txsync
    SET dlq = $1, updated_at = $2, sync = -1
    WHERE txid = $3`, [ dlq, now, txid ]);
    return result;
  }

  public async insertTxsync(txid: string, nosync?: boolean): Promise<string> {
    const now = DateUtil.now();
    let syncInitial =  nosync ? 0 : 1; // Otherwise 'pending'
    let result: any = await this.db.query(`
    INSERT INTO txsync(txid, updated_at, created_at, sync, status_retries)
    VALUES ($1, $2, $3, $4, 0)
    ON CONFLICT(txid) DO UPDATE
    SET sync=$5`, [
      txid, now, now, syncInitial, syncInitial
    ]);
    return result;
  }

  public async setResync(txid: string): Promise<string> {
    const now = DateUtil.now();
    let result: any = await this.db.query(`
    UPDATE txsync SET sync = 1, dlq = null, updated_at = $1
    WHERE txid = $2`, [
      now, txid
    ]);
    return result;
  }

  public async updateTxsync(txid: string, sync: sync_state): Promise<string> {
    const now = DateUtil.now();
    let result: any = await this.db.query(`
    UPDATE txsync
    SET sync = $1, updated_at = $2
    WHERE txid = $3`, [
      sync, now, txid
    ]);
    return result;
  }

  public async updateTxsyncAndClearDlq(txid: string, sync: sync_state): Promise<string> {
    const now = DateUtil.now();
    let result: any = await this.db.query(`
    UPDATE txsync
    SET sync = $1, updated_at = $2, dlq = null
    WHERE txid = $3`, [
      sync, now, txid
    ]);
    return result;
  }
}

export default TxsyncModel;
