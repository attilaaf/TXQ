import { Service, Inject } from 'typedi';
import { IAccountContext } from '@interfaces/IAccountContext';
import { ContextFactory } from '../../bootstrap/middleware/di/diContextFactory';
import InvalidParamError from '../../services/error/InvalidParamError';
import { DBUtils } from '../../services/helpers/DBUtils';
import ResourceNotFoundError from '../../services/error/ResourceNotFoundError';
 
@Service('txoutModel')
class TxoutModel {
  constructor(@Inject('db') private db: ContextFactory) {}

  public async getUnspentTxidsByScriptHash(accountContext: IAccountContext, scripthash: string[]): Promise<string> {
    const client = await this.db.getClient(accountContext);
    let result: any;
 
    let q = `
    SELECT txout.txid, txout.index
    FROM 
      txout 
    JOIN 
      tx ON (txout.txid = tx.txid)
    LEFT OUTER JOIN 
      txin ON (txout.txid = txin.prevtxid AND txout.index = txin.previndex)
    WHERE
    scripthash = ANY($1::varchar[]) AND
    tx.orphaned IS NOT TRUE 
    AND txin.prevtxid IS NULL`;
    result = await client.query(q, [ scripthash ]);
    return result.rows;
  }

  public async getTxoutByScriptHash(accountContext: IAccountContext, scripthash: string, offset: number, limit: number, script?: boolean, unspent?: boolean): Promise<string> {
    const client = await this.db.getClient(accountContext);
    let result: any;
    let split = scripthash.split(',');

    let q = `
    SELECT txout.txid, txout.index, txout.address, txout.scripthash, txout.satoshis, tx.i, tx.h,
    encode(txout.script, 'hex') as script, txin.txid as spend_txid, txin.index as spend_index
    FROM 
      txout 
    JOIN 
      tx ON (txout.txid = tx.txid)
    LEFT OUTER JOIN 
      txin ON (txout.txid = txin.prevtxid AND txout.index = txin.previndex)
    WHERE
    scripthash = ANY($1::varchar[]) AND
    tx.orphaned IS NOT TRUE 
    ${unspent ? 'AND txin.prevtxid IS NULL' : ''}
    OFFSET $2
    LIMIT $3`;
    result = await client.query(q, [ split, offset, limit ]);
    return result.rows;
  }

  public async getTxoutCountByScriptHashOrAddress(accountContext: IAccountContext, split: string[], unspent?: boolean): Promise<string> {
    const client = await this.db.getClient(accountContext);
    let result: any;
    let q = `
    SELECT count(*) as utxos
    FROM 
      txout 
    JOIN 
      tx ON (txout.txid = tx.txid)
    LEFT OUTER JOIN 
      txin ON (txout.txid = txin.prevtxid AND txout.index = txin.previndex)
    WHERE
    scripthash = ANY($1::varchar[]) AND
    tx.orphaned IS NOT TRUE 
    ${unspent ? 'AND txin.prevtxid IS NULL' : ''}
    `;
    result = await client.query(q, [ split ]);
    return result.rows[0].utxos;
  }

  public async getTxoutByAddress(accountContext: IAccountContext, address: string, offset: number, limit: number, script?: boolean, unspent?: boolean): Promise<string> {
    const client = await this.db.getClient(accountContext);
    let result: any;
    let split = address.split(',');
    let q = `
    SELECT txout.txid, txout.index, txout.address, txout.scripthash, txout.satoshis,  tx.i, tx.h,
    encode(txout.script, 'hex') as script, txin.txid as spend_txid, txin.index as spend_index
    FROM 
      txout 
    JOIN 
      tx ON (txout.txid = tx.txid)
    LEFT OUTER JOIN 
      txin ON (txout.txid = txin.prevtxid AND txout.index = txin.previndex)
    WHERE
    address = ANY($1::varchar[]) AND
    tx.orphaned IS NOT TRUE 
    ${unspent ? 'AND txin.prevtxid IS NULL' : ''}
    OFFSET $2
    LIMIT $3`;
    result = await client.query(q, [ split, offset, limit ]);
    return result.rows;
  }

  public async getTxoutCountByGroup(accountContext: IAccountContext, params: { groupname: string, unspent?: boolean}): Promise<any> {
    const client = await this.db.getClient(accountContext);
    let result: any;

    let q1 = `
    SELECT groupname
    FROM 
      txoutgroup
    WHERE
      txoutgroup.groupname = $1
    `;
 
    let foundGroup = await client.query(q1, [ params.groupname ]);
    if (!foundGroup.rows.length) {
      throw new ResourceNotFoundError();
    }
 
    let q = `
    SELECT count(*) as counter
    FROM 
      txoutgroup
    JOIN
      txout ON (txoutgroup.scriptid = txout.address OR txoutgroup.scriptid = txout.scripthash)
    JOIN 
      tx ON (txout.txid = tx.txid)
    LEFT OUTER JOIN 
      txin ON (txout.txid = txin.prevtxid AND txout.index = txin.previndex)
    WHERE
    txoutgroup.groupname = $1
    ${params.unspent ? 'AND txin.prevtxid IS NULL' : ''}
    AND tx.orphaned IS NOT TRUE`;
    result = await client.query(q, [ params.groupname ]);
    return result.rows[0] ? result.rows[0].counter : 0;
  }

  public async getTxoutsByGroup(accountContext: IAccountContext, params: { groupname: string, script?: boolean, limit: any, offset: any, unspent?: boolean}): Promise<any> {
    const client = await this.db.getClient(accountContext);
    let result: any;
    let q = `
    SELECT txout.txid, txout.index, txout.address, txout.scripthash, txout.satoshis,  tx.i, tx.h,
    encode(txout.script, 'hex') as script, txin.txid as spend_txid, txin.index as spend_index, txoutgroup.groupname
    FROM 
      txoutgroup
    JOIN
      txout ON (txoutgroup.scriptid = txout.address OR txoutgroup.scriptid = txout.scripthash)
    JOIN 
      tx ON (txout.txid = tx.txid)
    LEFT OUTER JOIN 
      txin ON (txout.txid = txin.prevtxid AND txout.index = txin.previndex)
    WHERE
    txoutgroup.groupname = $1 AND
    ${params.unspent ? 'AND txin.prevtxid IS NULL' : ''}
    AND tx.orphaned IS NOT TRUE
    OFFSET $2
    LIMIT $3`;

    result = await client.query(q, [ params.groupname, params.offset, params.limit ]);
    return result.rows;
  }

  public async getUtxoBalanceByScriptHashes(accountContext: IAccountContext, scripthashes: string[]): Promise<any> {
    const client = await this.db.getClient(accountContext);
    let result: any;
 
    const str = `
      SELECT txout.scripthash, sum(satoshis) as balance, tx.completed
        FROM 
          txout 
        JOIN 
          tx ON (txout.txid = tx.txid)
        LEFT OUTER JOIN 
          txin ON (txout.txid = txin.prevtxid AND txout.index = txin.previndex)
        WHERE
        txout.scripthash = ANY($1::varchar[]) AND
        txin.prevtxid IS NULL AND
        tx.orphaned IS NOT TRUE
        group by txout.scripthash, tx.completed
    `;
    result = await client.query(str, [scripthashes]);

    let byScriptHashBalances = {};
    for (const item of result.rows) {
      byScriptHashBalances[item.scripthash] = byScriptHashBalances[item.scripthash] || {
        scripthash: item.scripthash,
        confirmed: 0,
        unconfirmed: 0,
      }
      if (item.completed) {
        byScriptHashBalances[item.scripthash].confirmed = Number(item.balance);
      } else {
        byScriptHashBalances[item.scripthash].unconfirmed = Number(item.balance);
      }

    }
    let formattedArray = [];
    for (const prop in byScriptHashBalances) {
      if (!byScriptHashBalances.hasOwnProperty(prop)) {
        continue;
      }

      formattedArray.push({
        ...byScriptHashBalances[prop]
      });
    }
    return formattedArray;
  }
 
  /**
   * Todo: Refactor to not repeat queries
   */
  public async getUtxoBalanceByGroup(accountContext: IAccountContext, groupname: string): Promise<any> {
    const client = await this.db.getClient(accountContext);
    let result: any;
    const str = `
     SELECT * FROM
      (
        SELECT sum(satoshis) as balance
        FROM 
          txoutgroup
        JOIN
          txout ON (txoutgroup.scriptid = txout.address OR txoutgroup.scriptid = txout.scripthash)
        JOIN 
          tx ON (txout.txid = tx.txid)
        LEFT OUTER JOIN 
          txin ON (txout.txid = txin.prevtxid AND txout.index = txin.previndex)
        WHERE
        txoutgroup.groupname = $1 AND
        txin.prevtxid IS NULL AND
        tx.completed IS TRUE AND
        tx.orphaned IS NOT TRUE

        UNION

        SELECT sum(satoshis) as balance
        FROM 
          txoutgroup
        JOIN
          txout ON (txoutgroup.scriptid = txout.address OR txoutgroup.scriptid = txout.scripthash)
        JOIN 
          tx ON (txout.txid = tx.txid)
        LEFT OUTER JOIN 
          txin ON (txout.txid = txin.prevtxid AND txout.index = txin.previndex)
        WHERE
        txoutgroup.groupname = $1 AND
        txin.prevtxid IS NULL AND
        tx.completed IS FALSE AND
        tx.orphaned IS NOT TRUE
      ) AS q1
    `;
    result = await client.query(str, [ groupname, groupname ]);
    let balance = {
      confirmed: result.rows[0].balance ? Number(result.rows[0].balance) : 0,
      unconfirmed: result.rows[1] && result.rows[1].balance ? Number(result.rows[1].balance) : 0,
    }
    return balance;
  }

  public async getTxout(accountContext: IAccountContext, txid: string, index: number, script?: boolean): Promise<string> {
    const client = await this.db.getClient(accountContext);
    let result: any = await client.query(`
    SELECT txout.txid, txout.index, txout.address, txout.scripthash, txout.satoshis, tx.i, tx.h,
    encode(txout.script, 'hex') as script, txin.txid as spend_txid, txin.index as spend_index
    FROM 
      txout 
    JOIN 
      tx ON (txout.txid = tx.txid)
    LEFT OUTER JOIN 
      txin ON (txout.txid = txin.prevtxid AND txout.index = txin.previndex)
    WHERE
    txout.txid = $1 AND
    txout.index = $2 AND
    tx.orphaned IS NOT TRUE `, [
      txid, index
    ]);
    return result.rows[0];
  }

  public async getTxoutsByOutpointArray(accountContext: IAccountContext, txOutpoints: Array<{ txid: string, index: string }>, script?: boolean): Promise<any[]> {
    const client = await this.db.getClient(accountContext);
    const txidToIndexMap = {};
    const txidsOnly = [];
    // tslint:disable-next-line: prefer-for-of
    for (let index = 0; index < txOutpoints.length; index++) {
      txidToIndexMap[txOutpoints[index].txid] = txidToIndexMap[txOutpoints[index].txid] || {};
      txidToIndexMap[txOutpoints[index].txid][txOutpoints[index].index] = true;
      txidsOnly.push(txOutpoints[index].txid);
    }
    let result = await client.query(`
    SELECT txout.txid, txout.index, txout.address, txout.scripthash, txout.satoshis, tx.i, tx.h,
    encode(txout.script, 'hex') as script, txin.txid as spend_txid, txin.index as spend_index
    FROM 
      txout 
    JOIN 
      tx ON (txout.txid = tx.txid)
    LEFT OUTER JOIN 
      txin ON (txout.txid = txin.prevtxid AND txout.index = txin.previndex)
    WHERE
      txout.txid = ANY($1::varchar[]) AND
      tx.txid = txout.txid AND
      tx.orphaned IS NOT TRUE 
   `, [ txidsOnly ]);
    const results = [];
    // Walk the results and only keep the txouts that match txid+index
    for (const row of result.rows) {
      if (txidToIndexMap[row.txid]) {
        if (txidToIndexMap[row.txid][row.index]) {
          results.push(row);
        }
      }
    }
    return results;
  }

  public async saveTxout(accountContext: IAccountContext, txid: string, index: number, address: string | null | undefined, scripthash: string, script: string, satoshis: number): Promise<string> {
    const client = await this.db.getClient(accountContext);
    let result: any = await client.query(
      `INSERT INTO txout(txid, index, address, scripthash, script, satoshis)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING`, [
        txid, index, address, scripthash, DBUtils.encodeBufferToPG(script), satoshis
      ]);
    return result;
  }
 
  public async getTxHistoryByScriptHash(accountContext: IAccountContext, scripthashes: string [], params?: { order?: any, limit?: any, offset?: any, fromblockheight?: any}): Promise<any[]> {
    const client = await this.db.getClient(accountContext);
    if (!scripthashes || !scripthashes.length) {
      return [];
    }
    params = params || {};
    let order = 'desc NULLS FIRST';
    let orderSign = '<';
    if (params.order === 'asc') {
      order = 'asc NULLS LAST';
      orderSign = '>';
    }
    let limit = 1000;
    if (params.limit) {
      limit = parseInt(params.limit, 10);
    }

    if (isNaN(limit)) {
      throw new InvalidParamError();
    }
    if (limit > 1000) {
      throw new InvalidParamError();
    }

    if (limit < 100) {
      limit = 100;
    }

    let offset = 0;
    if (params.offset) {
      offset = parseInt(params.offset, 10);
    }
    if (offset < 0 || isNaN(offset)) {
      offset = 0;
    }
    let result = null;

    let fromblockheight = null;
    if (params.fromblockheight) {
      fromblockheight = parseInt(params.fromblockheight, 10);
    }

    if (fromblockheight) {
      const q = `
      SELECT tx.txid, encode(tx.rawtx, 'hex') as rawtx, h, i, completed, 
      txout.index, encode(txout.script, 'hex') as script, txout.address, txout.scripthash, 
      txout.satoshis 
      FROM tx, txout
      WHERE 
      tx.txid = txout.txid AND
      scripthash = ANY($1::varchar[]) AND
      tx.orphaned IS NOT TRUE AND
      tx.i ${orderSign} ${fromblockheight}
      ORDER BY tx.i ${order}
      OFFSET $2
      LIMIT $3
      `;
 
      result = await client.query(q, [scripthashes, offset, limit]);
    } else {
      const q = `
      SELECT tx.txid, encode(tx.rawtx, 'hex') as rawtx, h, i, completed, 
      txout.index, encode(txout.script, 'hex') as script, txout.address, txout.scripthash, 
      txout.satoshis 
      FROM tx, txout
      WHERE 
      tx.txid = txout.txid AND
      scripthash = ANY($1::varchar[]) AND
      tx.orphaned IS NOT TRUE
      ORDER BY tx.i ${order}
      OFFSET $2
      LIMIT $3
      `;
 
      result = await client.query(q, [scripthashes, offset, limit]);
 
    }
 
    return result.rows;
  }
}

export default TxoutModel;
