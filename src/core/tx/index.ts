import { Service, Inject } from 'typedi';
import { DateUtil } from '../../services/helpers/DateUtil';
import { ITransactionData, ITransactionStatus } from '../../interfaces/ITransactionData';
import { IAccountContext } from '@interfaces/IAccountContext';
import contextFactory, { ContextFactory } from '../../bootstrap/middleware/di/diContextFactory';
import InvalidParamError from '../../services/error/InvalidParamError';
import TxhashMismatchError from '../../services/error/TxhashMismatchError';
import * as bsv from 'bsv';
import { BitcoinRegex } from '../../services/helpers/BitcoinRegex';
import { txDataExtractor } from '../../util/txdataextractor';
import { ITxoutNotificationEntity } from '@interfaces/INotificationEvent';
import { ITXOutput } from '@interfaces/ITxOutput';
import InputsAlreadySpentError from '../../services/error/InputsAlreadySpentError';

@Service('txModel')
class TxModel {

  constructor(
    @Inject('db') private db: ContextFactory,
    @Inject('logger') private logger) {}


  public async getUnconfirmedTxids(accountContext: IAccountContext): Promise<string[]> {
    const client = await this.db.getClient(accountContext);
    let result: any = await client.query(`
    SELECT tx.txid 
    FROM 
      tx, txsync
    WHERE 
      i IS NULL AND
      orphaned IS NOT TRUE AND
      tx.txid = txsync.txid AND
      txsync.sync != 0 AND txsync.sync != -1`
    );
    return result.rows.map((i) => { return i.txid });
  }
  
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
        ,tx.orphaned
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

  public async updateCompleted(accountContext: IAccountContext, txid: string, completed?: boolean, orphaned?: boolean): Promise<string> {
    const client = await this.db.getClient(accountContext);
    const now = DateUtil.now();
    let result: any = await client.query(`UPDATE tx SET updated_at = $1, completed = $2, orphaned = $3 WHERE txid = $4`, [ now, !!completed, orphaned, txid]);
    return result;
  }

  public async saveTxs(accountContext: IAccountContext, params?: { 
      channel?: string,
      set: {
        [key: string]: ITransactionData
      },
      hideRawtx?: boolean
    }): Promise<{
      txEvents : any[],
      savedTxs : string[],
      txoutEvents: ITXOutput[]
    }> {
 
    const pool = await this.db.getClient(accountContext);
    const client = await pool.connect();
    const now = DateUtil.now();
    const queueSettings = contextFactory.getQueueSettings(accountContext);
    const network = contextFactory.getNetwork(accountContext);
    const savedTxs = [];
    const txoutEvents: ITXOutput[] = [];
    const channelStr = params.channel ? params.channel : '';
    // note: we don't try/catch this because if connecting throws an exception
    // we don't need to dispose of the client (it will be undefined)
    try {
      await client.query('BEGIN');
      // Perform updates for each transaction in turn
      for (const txid in params.set) {
        if (!params.set.hasOwnProperty(txid)) {
          continue;
        }
        const nosync = queueSettings.nosync || !!params.set[txid].nosync;
        const rawtx = params.set[txid].rawtx;
        const metadata = params.set[txid].metadata;
        const tags = params.set[txid].tags;
        const sendStatus = params.set[txid].send;

        let expectedTxid = txid;
        if (!txid || !rawtx) {
          throw new InvalidParamError();
        }
        if (!BitcoinRegex.TXID_REGEX.test(expectedTxid)) {
          throw new InvalidParamError();
        }
        let parsedTx;
        parsedTx = new bsv.Transaction(rawtx)
        if (expectedTxid) {
          if (parsedTx.hash != expectedTxid) {
            throw new TxhashMismatchError();
          }
        } else {
          expectedTxid = parsedTx.txhash
        }
        const locktime = parsedTx.nLockTime;
        savedTxs.push(txid);
 
        let insertTxResult: any = await client.query(`
        INSERT INTO tx(txid, rawtx, updated_at, created_at, completed, size, locktime, txsource, send)
        VALUES ($1, $2, $3, $4, FALSE, $5, $6, $7, $8)
        ON CONFLICT(txid) 
        DO UPDATE
        SET 
          rawtx = EXCLUDED.rawtx, 
          updated_at = EXCLUDED.updated_at
          RETURNING txid`, [
          txid, rawtx, now, now, parsedTx.toBuffer().length, locktime, 0, sendStatus
        ]);

        let syncInitial = nosync ? 0 : 1; // Otherwise 'pending'
        let insertSyncResult: any = await client.query(`
        INSERT INTO txsync(txid, updated_at, created_at, sync, status_retries)
        VALUES ($1, $2, $3, $4, 0)
        ON CONFLICT(txid) 
        DO UPDATE
          SET sync = $5`, [
          txid, now, now, syncInitial, syncInitial
        ]);
      
        // Insert channel metadata
        const txmetainsert = JSON.stringify(metadata || {});
        const tagsinsert = JSON.stringify(tags || {});
        const datainsert = JSON.stringify(txDataExtractor(parsedTx) || {});
        let insertMetaResult: any = await client.query(`
        INSERT INTO txmeta(txid, channel, metadata, updated_at, created_at, tags, extracted)
        VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT(txid, channel) 
        DO UPDATE
        SET 
          updated_at = EXCLUDED.updated_at, 
          metadata = EXCLUDED.metadata, 
          tags = EXCLUDED.tags, 
          extracted = EXCLUDED.extracted`, [
          txid, channelStr, txmetainsert,now, now, tagsinsert, datainsert
        ]);
  
        // For each input, insert the txin
        let i = 0;
        for (const input of parsedTx.inputs) {
          if (input.isNull()) {
            //Skip coinbase
            continue;
          }
          const prevTxId = input.prevTxId.toString('hex');
          const outputIndex = input.outputIndex;
          const seq = input.sequenceNumber;
          const unlockScript = input.script.toBuffer().toString('hex');
          let checkExistsTxin: any = await client.query(`
          SELECT txid, index 
          FROM
            txin
          WHERE 
            (txid = $1 AND index = $2)
          `, [
            txid, i
          ]);
          // Exists, just ignore it then
          if (checkExistsTxin.rows.length) {
            continue;
          }
          // But first ensure this is not a double spend attempt
          const dspendQuery = `
          SELECT txid, index 
          FROM
            txin
          WHERE 
            (prevtxid = $1 AND previndex = $2)
          `;
          let checkExistsSpendTxin: any = await client.query(dspendQuery, [
            prevTxId, outputIndex
          ]);
          if (!checkExistsSpendTxin.rows.length) {
            let insertTxinResult: any = await client.query(`
            INSERT INTO txin(txid, index, prevtxid, previndex, unlockscript, seq)
            VALUES ($1, $2, $3, $4, $5, $6)
            `, [
              txid, i, prevTxId, outputIndex, unlockScript, seq
            ]);
          } else {
            // It exists, which means this is a double-spend, throw an exception
            this.logger.error("InputsAlreadySpentError", { txid: parsedTx.txid });
            throw new InputsAlreadySpentError();
          }
          i++;
        }

        i = 0;
        for (let i = 0; i < parsedTx.outputs.length; i++) {
          const buffer = Buffer.from(parsedTx.outputs[i].script.toHex(), 'hex');
          const scripthash = bsv.crypto.Hash.sha256(buffer).reverse().toString('hex');
          let address = '';
          try {
            address = bsv.Address.fromScript(parsedTx.outputs[i].script, network).toString();
          } catch (err) {
            // Do nothing
          }
          
          let insertTxoutResult: any = await client.query(
            `INSERT INTO txout(txid, index, address, scripthash, script, satoshis)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT DO NOTHING`, [
              txid, i, address, scripthash, parsedTx.outputs[i].script.toHex(), parsedTx.outputs[i].satoshis
            ]);
        
          txoutEvents.push({
            address,
            scripthash,
            txid: expectedTxid,
            index: i,
            script: parsedTx.outputs[i].script.toHex(),
            satoshis: parsedTx.outputs[i].satoshis,
          });
        }
      }
 
      await client.query('COMMIT');
 
      let resultGetTxs: any = await client.query(`
      SELECT 
        txmeta.*,
        tx.txid
        ,${!params.hideRawtx ? 'tx.rawtx,' : '' } tx.h
        ,tx.i
        ,tx.send
        ,tx.status
        ,tx.completed
        ,tx.updated_at
        ,tx.created_at
      FROM 
        tx 
      INNER JOIN 
        txmeta ON (tx.txid = txmeta.txid) 
      WHERE 
        tx.txid = ANY($1::varchar[])
      AND
        txmeta.channel = $2
      `, [ savedTxs, channelStr]);

      return {
        txEvents : resultGetTxs.rows,
        savedTxs,
        txoutEvents
      }
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  public async saveTxsForBlock(accountContext: IAccountContext, params?: { 
    channel?: string,
    set: {
      [key: string]: ITransactionData
    },
    block: bsv.Block,
    height: number,
  }): Promise<{
    txEvents : any[],
    savedTxs : string[],
    txoutEvents: ITXOutput[]
  }> {

  const pool = await this.db.getClient(accountContext);
  const client = await pool.connect();
  const now = DateUtil.now();
  const queueSettings = contextFactory.getQueueSettings(accountContext);
  const network = contextFactory.getNetwork(accountContext);
  const savedTxs = [];
  const txoutEvents: ITXOutput[] = [];
  const channelStr = params.channel ? params.channel : '';
  // note: we don't try/catch this because if connecting throws an exception
  // we don't need to dispose of the client (it will be undefined)
  try {
    const startTime = (new Date()).getTime();
    console.log('Start Timer', startTime);
    await client.query('BEGIN');
    // Perform updates for each transaction in turn
    for (const txid in params.set) {
      if (!params.set.hasOwnProperty(txid)) {
        continue;
      }
      const nosync = queueSettings.nosync || !!params.set[txid].nosync;
      const rawtx = params.set[txid].rawtx;
      const metadata = params.set[txid].metadata;
      const tags = params.set[txid].tags;
      let expectedTxid = txid;
      if (!txid || !rawtx) {
        throw new InvalidParamError();
      }
      if (!BitcoinRegex.TXID_REGEX.test(expectedTxid)) {
        throw new InvalidParamError();
      }
      let parsedTx;
      parsedTx = new bsv.Transaction(rawtx)
      if (expectedTxid) {
        if (parsedTx.hash != expectedTxid) {
          throw new TxhashMismatchError();
        }
      } else {
        expectedTxid = parsedTx.txhash
      }
      const locktime = parsedTx.nLockTime;
      savedTxs.push(txid);
      let insertTxResult: any = await client.query(`
      INSERT INTO tx(txid, rawtx, updated_at, created_at, completed, i, h, orphaned, size, locktime, txsource)
      VALUES ($1, $2, $3, $4, TRUE, $5, $6, NULL, $7, $8, $9)
      ON CONFLICT(txid) 
      DO UPDATE
      SET 
      rawtx = EXCLUDED.rawtx, 
      i = EXCLUDED.i, 
      h = EXCLUDED.h, 
      updated_at = EXCLUDED.updated_at, 
      completed = TRUE
      RETURNING txid`, [
        txid, rawtx, now, now, params.height, params.block.hash, parsedTx.toBuffer().length, locktime, 1
      ]);
      // Set to automatically already synced
      let insertSyncResult: any = await client.query(`
      INSERT INTO txsync(txid, updated_at, created_at, sync, status_retries)
      VALUES ($1, $2, $3, $4, 0)
      ON CONFLICT(txid) 
      DO UPDATE
      SET sync = 2`, [
        txid, now, now, 2
      ]);
     
       // Insert channel metadata
       const txmetainsert = JSON.stringify(metadata || {});
       const tagsinsert = JSON.stringify(tags || {});
       const datainsert = JSON.stringify(txDataExtractor(parsedTx) || {});
       let insertMetaResult: any = await client.query(`
       INSERT INTO txmeta(txid, channel, metadata, updated_at, created_at, tags, extracted)
       VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT
       DO NOTHING
      `, [
         txid, channelStr, txmetainsert,now, now, tagsinsert, datainsert
       ]);

      // For each input, insert the txin
      let i = 0;
      for (const input of parsedTx.inputs) {
        if (input.isNull()) {
          //Skip coinbase
          continue;
        }
        const prevTxId = input.prevTxId.toString('hex');
        const outputIndex = input.outputIndex;
        const unlockScript = input.script.toBuffer().toString('hex');
       
        // Force updating the txin for the new transaction (Effectively deleting the doublespent tx's txin records)
        let insertTxinResult: any = await client.query(`
        INSERT INTO txin(txid, index, prevtxid, previndex, unlockscript)
        VALUES ($1, $2, $3, $4, $5) 
        ON CONFLICT(prevtxid, previndex) DO UPDATE
          SET
          txid = EXCLUDED.txid,
          index = EXCLUDED.index,
          unlockscript = EXCLUDED.unlockscript
        `, [
          txid, i, prevTxId, outputIndex, unlockScript
        ]);
        i++;
      }

      i = 0;
      for (let i = 0; i < parsedTx.outputs.length; i++) {
        const buffer = Buffer.from(parsedTx.outputs[i].script.toHex(), 'hex');
        const scripthash = bsv.crypto.Hash.sha256(buffer).reverse().toString('hex');
        let address = '';
        try {
          address = bsv.Address.fromScript(parsedTx.outputs[i].script, network).toString();
        } catch (err) {
          // Do nothing
        }
        
        let insertTxoutResult: any = await client.query(
          `INSERT INTO txout(txid, index, address, scripthash, script, satoshis)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT DO NOTHING`, [
            txid, i, address, scripthash, parsedTx.outputs[i].script.toHex(), parsedTx.outputs[i].satoshis
          ]);
      
        txoutEvents.push({
          address,
          scripthash,
          txid: expectedTxid,
          index: i,
          script: parsedTx.outputs[i].script.toHex(),
          satoshis: parsedTx.outputs[i].satoshis,
        });
      }
    }
    let updateOrphans: any = await client.query(`
    WITH RECURSIVE d AS (
      SELECT tx.txid 
        from tx LEFT OUTER JOIN txin ON (tx.txid = txin.txid)
        WHERE txin.txid is null AND orphaned IS NOT TRUE
      UNION ALL
      SELECT txin.txid
      FROM d
      JOIN txin ON (txin.prevtxid = d.txid)
    )
    UPDATE tx
    SET
      i = NULL,
      h = NULL,
      orphaned = TRUE,
      completed = FALSE
      FROM d
      WHERE d.txid = tx.txid;
    `);
 
    await client.query('COMMIT');
    const endtime = (new Date()).getTime();
    console.log('End Timer Commit', (endtime - startTime) / 1000, savedTxs.length);

    let resultGetTxs: any = await client.query(`
    SELECT 
      txmeta.*,
      tx.txid,
      tx.rawtx
      ,tx.h
      ,tx.i
      ,tx.send
      ,tx.status
      ,tx.completed
      ,tx.updated_at
      ,tx.created_at
    FROM 
      tx 
    INNER JOIN 
      txmeta ON (tx.txid = txmeta.txid) 
    WHERE 
      tx.txid = ANY($1::varchar[])
    AND
      txmeta.channel = $2
    `, [ savedTxs, channelStr]);

    return {
      txEvents : resultGetTxs.rows,
      savedTxs,
      txoutEvents
    }
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
}

export default TxModel;
