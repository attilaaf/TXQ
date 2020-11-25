import { Service, Inject } from 'typedi';
import { ITxOutpoint } from '@interfaces/ITxOutpoint';
import { Pool } from 'pg';
import { ITXOutput } from '@interfaces/ITxOutput';
import { ITXSpendInfo } from '@interfaces/ISpendInfo';
import InvalidParamError from '../../services/error/InvalidParamError';
import { ContextFactory } from '../../bootstrap/middleware/di/diContextFactory';
import { IAccountContext } from '@interfaces/IAccountContext';
import * as bsv from 'bsv';

@Service('txassetModel')
class TxassetModel {

  constructor(@Inject('db') private db: ContextFactory) {}

  public async isTxExist(accountContext: IAccountContext, assetid: string): Promise<boolean> {
    const client = await this.db.getAssetDbClient(accountContext);
    let result: any = await client.query(`SELECT assetid FROM txasset WHERE assetid = decode(${assetid}, 'hex') AND blockhash IS NOT NULL`);
    return !!result.rows[0];
  }

  public async getTxParts(accountContext: IAccountContext, txid: string): Promise<any> {
    const client = await this.db.getAssetDbClient(accountContext);
    const  c = `SELECT * FROM tx WHERE txid = decode('${txid}', 'hex') ORDER BY n ASC`;
    let result: any = await client.query(c);
    return result.rows;
  }

  public async getTxPartsMany(accountContext: IAccountContext, txids: [string]): Promise<any> {
    const client = await this.db.getAssetDbClient(accountContext);
    const frag = this.getTxidFragments(txids);
    const c = `SELECT * FROM tx WHERE txid IN (${frag}) ORDER BY txid, n ASC`;
    let result: any = await client.query(c);
    return result.rows;
  }

  public async getSpendInfos(accountContext: IAccountContext, txOutpoints: ITxOutpoint[]): Promise<{[k: string]: ITXSpendInfo}> {
    const client = await this.db.getAssetDbClient(accountContext);
    if (!txOutpoints || !txOutpoints.length) {
      return {};
    }
    let frag = this.getOutputFragments(txOutpoints);
    const q = `
    SELECT encode(txid, 'hex') as txiddecode, n, prevn, height, encode(prevtxid, 'hex') as prevtxiddecode FROM tx
    WHERE (prevtxid, prevn) IN (` + frag + ')';
    let result = await client.query(q);

    const txOutMap = {};
    const baseTxOutMapNulls = {};
    for (const txout of txOutpoints) {
      baseTxOutMapNulls[txout.txid + `_o${txout.index}`] = null;
    }

    for (const row of result.rows) {
      txOutMap[row.prevtxiddecode + `_o${row.prevn}`] = {
        spend_txid:  row.txiddecode,
        spend_index: row.n,
        spend_height: row.height
      }
    }
    return { ...baseTxOutMapNulls, ...txOutMap };
  }

  public async getUtxosByScriptHash(accountContext: IAccountContext, scripthashes: string [], params): Promise<any[]> {
    const client = await this.db.getAssetDbClient(accountContext);
    if (!scripthashes || !scripthashes.length) {
      return [];
    }
    let frag = this.getScriptHashFragments(scripthashes);
    let order = 'desc';
    if (params.order === 'asc') {
      order = 'asc';
    }
    let limit = 1000;
    if (params.limit) {
      limit = parseInt(params.limit, 10);
    }

    if (limit > 1000) {
      throw new InvalidParamError();
    }

    if (limit < 100) {
      limit = 100;
    }

    if (isNaN(limit)) {
      throw new InvalidParamError();
    }
    let offset = 0;
    if (params.offset) {
      offset = parseInt(params.offset, 10);
    }
    if (offset < 0 || isNaN(offset)) {
      offset = 0;
    }

    const q = `
    SELECT
    utxo.satoshis,
    encode( utxo.scripthash, 'hex') as scripthashdecode,
    encode( utxo.txid, 'hex') as txiddecode,
    utxo.n, utxo.prevn, utxo.height,
    encode( utxo.lockscript, 'hex') as scriptdecode,
    encode( utxo.prevtxid, 'hex') as prevtxiddecode

    FROM
    tx utxo
    LEFT OUTER JOIN tx spender ON (utxo.txid = spender.prevtxid AND utxo.n = spender.prevn)

    WHERE
    (utxo.scripthash) IN (` + frag + `)
    AND
    spender.prevtxid IS NULL
    ORDER BY utxo.id ${order}
    OFFSET ${offset}
    LIMIT ${limit}
    `;
    console.log('q', q);

    let result = await client.query(q);


    let reformatted = [];
    for (const row of result.rows) {

      reformatted.push({
        txid: row.txiddecode,
        index: Number(row.n),
        satoshis: Number(row.satoshis),
        script: row.scriptdecode,
        scripthash: row.scripthashdecode,
        height: row.height
      })
    }
    return reformatted;
  }

  public async getBalanceByScriptHash(accountContext: IAccountContext, scripthashes: string[]): Promise<any> {
    const client = await this.db.getAssetDbClient(accountContext);
    let frag = this.getScriptHashFragments(scripthashes);

    const q = `
    SELECT
    sum(utxo.satoshis),
    encode( utxo.scripthash, 'hex') as scripthash
    FROM tx utxo
    LEFT OUTER JOIN tx spender
    ON (utxo.txid = spender.prevtxid AND utxo.n = spender.prevn)
    WHERE
    utxo.scripthash IN (` + frag + `)
    AND
    spender.prevtxid IS NULL

    GROUP BY utxo.scripthash
    `;

    let result = await client.query(q);
    let formatted = [];
    for (const item of result.rows) {
      formatted.push({
        satoshis: Number(item.sum),
        scripthash: item.scripthash
      });
    }
    return formatted;
  }

  public async getTxoutsByScriptHash(accountContext: IAccountContext, scripthashes: string [], params): Promise<any[]> {
    const client = await this.db.getAssetDbClient(accountContext);
    if (!scripthashes || !scripthashes.length) {
      return [];
    }
    let frag = this.getScriptHashFragments(scripthashes);
    let order = 'desc';
    if (params.order === 'asc') {
      order = 'asc';
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

    const q = `
    SELECT
    satoshis,
    encode(scripthash, 'hex') as scripthashdecode,
    encode(txid, 'hex') as txiddecode,
    n, prevn, height,
    encode(lockscript, 'hex') as scriptdecode,
    encode(prevtxid, 'hex') as prevtxiddecode
    FROM tx
    WHERE (scripthash) IN (` + frag + `)
    ORDER BY height ${order}, txid, n DESC
    OFFSET ${offset}
    LIMIT ${limit}
    `;
    let result = await client.query(q);

    let reformatted = [];
    for (const row of result.rows) {
      reformatted.push({
        txid: row.txiddecode,
        index: Number(row.n),
        satoshis: Number(row.satoshis),
        script: row.scriptdecode,
        scripthash: row.scripthashdecode,
        height: row.height
      })
    }
    return reformatted;
  }

  public async getTxHistoryByScriptHash(accountContext: IAccountContext, scripthashes: string [], params: any): Promise<any[]> {
    const client = await this.db.getAssetDbClient(accountContext);
    if (!scripthashes || !scripthashes.length) {
      return [];
    }
    let frag = this.getScriptHashFragments(scripthashes);
    let order = 'desc';
    let orderSign = '<';
    if (params.order === 'asc') {
      order = 'asc';
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
      SELECT
      txid, tx.id, tx.height, tx.satoshis, tx.n, block_header.hash,
      encode(txid, 'hex') as txiddecode,
      encode(scripthash, 'hex') as scripthashdecode
      FROM tx, block_header
      WHERE (scripthash) IN (` + frag + `)
      AND
      tx.height ${orderSign} ${fromblockheight} AND
      tx.height = block_header.height
      ORDER BY id ${order}
      OFFSET ${offset}
      LIMIT ${limit}
      `;
      result = await client.query(q);
    } else {
      const q = `
      SELECT
      txid, tx.id, tx.height, tx.satoshis, tx.n, block_header.hash,
      encode(txid, 'hex') as txiddecode,
      encode(scripthash, 'hex') as scripthashdecode
      FROM tx, block_header
      WHERE (scripthash) IN (` + frag + `)
      AND
      tx.height = block_header.height
      ORDER BY id ${order}
      OFFSET ${offset}
      LIMIT ${limit}
      `;
      result = await client.query(q);
    }

    let reformatted = [];
    for (const row of result.rows) {
      reformatted.push({
        id: Number(row.id),
        txid: row.txiddecode,
        blockhash: row.hash,
        index: row.n,
        satoshis: Number(row.satoshis),
        scripthash: row.scripthashdecode,
        height: row.height
      })
    }
    return reformatted;
  }

  public async getTxouts(accountContext: IAccountContext, txOutpoints: ITxOutpoint[]): Promise<{ [k: string]: ITXOutput} > {
    const client = await this.db.getAssetDbClient(accountContext);
    if (!txOutpoints || !txOutpoints.length) {
      return {};
    }
    let frag = this.getOutputFragments(txOutpoints);
    const q = `
    SELECT
    satoshis,
    encode(scripthash, 'hex') as scripthashdecode,
    encode(txid, 'hex') as txiddecode,
    n, prevn, height,
    encode(lockscript, 'hex') as scriptdecode,
    encode(prevtxid, 'hex') as prevtxiddecode
    FROM tx
    WHERE (txid, n) IN (` + frag + ')';
    let result = await client.query(q);

    // 2. Map each found output
    const txOutMaplist = []
    for (const row of result.rows) {
      txOutMaplist.push({
        txid: row.txiddecode,
        index: Number(row.n)
      });
    }
    // 3. Reformat
    const txOutMap = {}
    for (const row of result.rows) {
      txOutMap[row.txiddecode + '_o' + row.n] = {
        txid: row.txiddecode,
        index: Number(row.n),
        satoshis: Number(row.satoshis),
        script: row.scriptdecode,
        scripthash: row.scripthashdecode,
        height: row.height
      }
    }
    return txOutMap;
  }

  public async getTxoutsScripts(accountContext: IAccountContext, txOutpoints: ITxOutpoint[]): Promise<{ [k: string]: ITXOutput} > {
    const client = await this.db.getAssetDbClient(accountContext);
    if (!txOutpoints || !txOutpoints.length) {
      return {};
    }
    let frag = this.getOutputFragments(txOutpoints);
    const q = `
    SELECT
    satoshis,
    encode(txid, 'hex') as txiddecode,
    n,
    encode(lockscript, 'hex') as scriptdecode
    FROM tx
    WHERE (txid, n) IN (` + frag + ')';
    let result = await client.query(q);

    // 2. Map each found output
    const txOutMaplist = []
    for (const row of result.rows) {
      txOutMaplist.push({
        txid: row.txiddecode,
        index: Number(row.n)
      });
    }
    // 3. Reformat
    const txOutMap = {}
    for (const row of result.rows) {
      txOutMap[row.txiddecode + '_o' + row.n] = {
        txid: row.txiddecode,
        index: Number(row.n),
        script: row.scriptdecode
      }
    }
    return txOutMap;
  }

  public async getTxBlockInfo(accountContext: IAccountContext, txids: string[]): Promise<any[]> {
    const client = await this.db.getAssetDbClient(accountContext);
    if (!txids || !txids.length) {
      return [];
    }
    let frag = this.getTxidFragments(txids);

    const q = `
    SELECT
    time,
    a.height,
    encode(a.blockhash, 'hex') as blockhashdecode,
    encode(a.txid, 'hex') as txiddecode, txindex
    FROM tx a, block_header b
    WHERE
    a.txid IN (${frag}) AND n = 0 AND
    b.hashbytes = a.blockhash`
    let result = await client.query(q);
    let reformatted = [];
    for (const row of result.rows) {
      reformatted.push({
        txid: row.txiddecode,
        blockhash: row.blockhashdecode,
        height: row.height,
        time: row.time,
        txindex: row.txindex
      })
    }
    return reformatted;
  }



  public async deleteBlockDataNewerThan(accountContext: IAccountContext, height: number): Promise<any> {
    const client = await this.db.getAssetDbClient(accountContext);
    await client.query(`
      DELETE
      FROM
        block_header
      WHERE height > $1
      `, [ height ]);

    await client.query(`
      DELETE
      FROM
        txasset
      WHERE height > $1
      `, [ height ]);

    return true;
  }

  public async getBlockHeaders(accountContext: IAccountContext, limit: number = 20): Promise<string> {
    const client = await this.db.getAssetDbClient(accountContext);
    let result: any = await client.query(`
      SELECT
        *
      FROM
        block_header
      ORDER BY height DESC
      LIMIT ${limit}
      `);

    return result.rows;
  }
/*
  height: 12315,
  hash: '0000000003a03700d37276c1c6b5a7614c0f09e50b1dfdbba7127ab41883964d',
  size: 216,
  version: 1,
  merkleroot: '9d7244532e4a510463990c818443fee680350283296c2b22dd311735b5e9fe57',
  time: 1240762207,
  nonce: 2426087729,
  bits: '1d00ffff',
  difficulty: '1',
  previousblockhash: '00000000d2e6b2ee55a459873f27c936e7f0339866fbf5f44bd1d6b448830f70',
  nextblockhash: '0000000013cb9b4fe3f2e979e7250182952077c93de709eec90026a215d74b4b',
  coinbaseinfo: '04ffff001d020906',
  coinbasetxid: '9d7244532e4a510463990c818443fee680350283296c2b22dd311735b5e9fe57',
  chainwork: '0000000000000000000000000000000000000000000000000000301c301c301c'
*/
  public async saveBlockData(accountContext: IAccountContext, height: number, block: bsv.Block): Promise<string> {
    const client = await this.db.getAssetDbClient(accountContext);
    const q = `
    INSERT INTO block_header(height, hash, hashbytes, size, version, merkleroot, time, nonce, bits, difficulty, previousblockhash)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;
    console.log('q', q, block.header, block.hash);
    let result: any = await client.query(q, [
        height,
        block.hash,
        block.hash, // Buffer.from(block.hash, 'hex'),
        block.header.size,
        block.header.version,
        block.header.merkleRoot.toString('hex'),
        block.header.time,
        block.header.nonce,
        block.header.bits,
        block.header.getTargetDifficulty(),
        block.header.prevHash.toString('hex')
      ]);

    return result.rows;
  }

  private getOutputFragments(txOutpoints: any[]) {
    return txOutpoints.map(t => `(decode('${t.txid}', 'hex'), ${t.index})`).join(',');
  }

  private getTxidFragments(txids: string[]) {
    return txids.map(t => `decode('${t}', 'hex')`).join(',');
 }

  private getScriptHashFragments(scripthashes: string[]) {
    return this.getTxidFragments(scripthashes);
 }

}


export default TxassetModel;
