import { Service, Inject } from 'typedi';
import { ITxOutpoint } from '@interfaces/ITxOutpoint';
import { ITXOutput } from '@interfaces/ITxOutput';
import { ITXSpendInfo } from '@interfaces/ISpendInfo';
import InvalidParamError from '../../services/error/InvalidParamError';
import { ContextFactory } from '../../bootstrap/middleware/di/diContextFactory';
import { IAccountContext } from '@interfaces/IAccountContext';
import * as bsv from 'bsv';
import { Readable } from 'stream';
import { from } from 'pg-copy-streams';
import { ITxOutRecord } from '@interfaces/ITxOutRecord';
import cfg from './../../cfg';
import { AssetFactory } from '../../services/helpers/AssetFactory';
import { IAssetData } from '@interfaces/IAssetData';

@Service('txassetModel')
class TxassetModel {

  static assetData = cfg.assets;
  constructor(@Inject('db') private db: ContextFactory, @Inject('logger') private logger) {}

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
      };
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

  public async isValidSpendingAssetOutpoint(kvstore: any, asset: IAssetData, prevTxid, outputIndex) {
    if (!asset) {
      return false;
    }
    const value = await kvstore.get(prevTxid + outputIndex);
    return value === asset.assetid;
  }

  public async validAssetTransition(assetInputMap, asset) {

    return false;
  }

  public async getBlockTxRecords(kvstore: any, db: any, height: number, block: bsv.Block): Promise<ITxOutRecord[]> {
    // Get all transactions that have at least one input that matches
    let txIndex = -1;
    let txMatchCount = 0;
    let txTotalCount = 0;
    const txidset = [];
    const blockRecords = [];
    const assetFactory = new AssetFactory();
    const allNewOutpoints: Array<{ assetid: any, txid: any, index: any }> = [];

    for (const tx of block.transactions) {
      
      txIndex++;
      if (txIndex === 0) {
        continue;
      }
      const txsize = tx.toString().length / 2;
      const txhash = tx.hash;
      txidset.push(txhash);
      const maxN = Math.max(tx.inputs.length, tx.outputs.length);
      let shouldIndex = false;
      let assetInputMap = [];
      for (const input of tx.inputs) {
        const unlockscript = input.script.toBuffer();
        const asset: IAssetData = assetFactory.getAssetData(unlockscript);
        if (await this.isValidSpendingAssetOutpoint(kvstore, asset, input.prevTxId, input.outputIndex)) {
          shouldIndex = true;
          assetInputMap.push(asset);
        }
      }

      for (const output of tx.outputs) {
        if (assetFactory.matchesCoinbaseType(tx, output)) {
          shouldIndex = true;
          break;
        }
      }
      if (!shouldIndex) {
        continue;
      }
      // We have at least a valid spending asset input or a valid coinbase output
      // Index the entire transaction and set the color by matching up color
      for (let i = 0; i < maxN; i++) {
        const blockRecord: any= {
          txid: Buffer.from(tx.hash, 'hex'),
          height,
          n: i,
          size: txsize,
          version: tx.version,
          assettypeid: 0,
          assetid: null,
          issuer: null,
          owner: null,
          ins: tx.inputs.length,
          outs: tx.outputs.length,
          prevn: null,
          prevtxid: null,
          seq: null,
          unlockscript: null,
          satoshis: null,
          lockscript: null,
          scripthash: null,
          locktime: null,
          txindex: null,
          data: null,
          blockhash: Buffer.from(block.header.hash, 'hex')
        };

        // Build input fields
        if (i < tx.inputs.length) {
          if (txIndex > 0) {
            blockRecord.prevn = tx.inputs[i].outputIndex;
            blockRecord.prevtxid = tx.inputs[i].prevTxId;
            blockRecord.seq = tx.inputs[i].sequenceNumber;
            blockRecord.unlockscript = tx.inputs[i].script.toBuffer();
            // Check if utxo found here
					} else if (txIndex === 0) {
						; // Do nothing for coinbase
					}
        }
        // Build output fields
        if (i < tx.outputs.length) {
          blockRecord.satoshis = tx.outputs[i].satoshis;
          blockRecord.lockscript = tx.outputs[i].script.toBuffer();
          const sh = bsv.crypto.Hash.sha256(blockRecord.lockscript);
          sh.reverse();
          blockRecord.scripthash = sh;
          // Thisi must be a new asset mint event
          if (assetFactory.matchesCoinbaseType(tx, tx.outputs[i])) {
            const asset: IAssetData = assetFactory.fromCoinbaseTxout(tx.outputs[i].script.toBuffer());
            if (asset) {
              blockRecord.assetid = asset.assetid;
              blockRecord.assettypeid = asset.assettypeid;
              blockRecord.issuer = asset.issuer;
              blockRecord.owner = asset.owner;
              blockRecord.data = asset.data;
              allNewOutpoints.push({
                assetid: blockRecord.assetid,
                txid: tx.hash,
                index: i,
              });
            }
          // Otherwise it must be a transition of an existing asset
          } else if (assetFactory.matchesPrefixCode(tx, tx.outputs[i])) {
            const asset: IAssetData = assetFactory.fromNonCoinbaseTxout(tx.outputs[i].script.toBuffer());
            // If this output asset is part of the input being spent and it is valid, then extract the fields
            // It's important to check again so we validate the asset is infact being spent correctly.
            if (asset && this.validAssetTransition(assetInputMap, asset)) {
              // Note that melted or invalid assets will be stripped of their identity because they are not valid in the utxo set
              blockRecord.assetid = asset.assetid;
              blockRecord.assettypeid = asset.assettypeid;
              blockRecord.issuer = asset.issuer;
              blockRecord.owner = asset.owner;
              blockRecord.data = asset.data;
              allNewOutpoints.push({
                assetid: blockRecord.assetid,
                txid: tx.hash,
                index: i,
              });
            }
          }
        }

        blockRecord.locktime = tx.nLockTime;
        blockRecord.ins = tx.inputs.length;
        blockRecord.outs = tx.outputs.length;
        blockRecord.blockhash = Buffer.from(block.header.hash, 'hex');
        blockRecord.txindex = txIndex;
        blockRecord.txsize = txsize;

        if (shouldIndex === true) {
          blockRecords.push(blockRecord);
        }
      }
      txTotalCount++;
    }
    const ops = [];
    for (const newOut of allNewOutpoints) {
      ops.push({
        type: 'put', key: newOut.txid + newOut.index, value: newOut.assetid
      });
    }
    // Commit the new outpoiints
    await kvstore.batch(ops);
    return blockRecords;
  }

  public async generateCopyInCommands(client: any, height: number, blockTxRecords: any[]): Promise<any> {
    if (!blockTxRecords.length) {
      throw new Error('Illegal argument blockTxRecords');
    }
    function enc(buf: Buffer | any) {
      if (buf === null || buf === undefined) {
        return 'null';
      }
      if (!isNaN(buf)) {
        return buf;
      }

      if (buf instanceof Buffer) {
         return `\\\\x` + buf.toString('hex');
      }
      if (!buf) {
        return "null";
      }

      return buf;
    }
    return new Promise((resolve, reject) => {
      const stream = client.query(from(`COPY txasset (version, assetid, assettypeid, issuer, owner, size, height, txid, blockhash, locktime, ins, outs, txindex, n, prevtxid, prevn, seq, lockscript, unlockscript, scripthash) FROM STDIN WITH NULL as \'null\'`));
      var rs = new Readable;
      let currentIndex = 0;
      const delim = '\t';
      rs._read = () => {
        if (currentIndex === blockTxRecords.length) {
          rs.push(null);
        } else {
          let txo = blockTxRecords[currentIndex];
          const copyDataRow = enc(txo.version) + delim + enc(txo.assetid) + delim + enc(txo.assettypeid) + delim + enc(txo.issuer) + delim +
            enc(txo.owner) + delim + enc(txo.size) + delim + enc(txo.height) + delim + enc(txo.txid) + delim + enc(txo.blockhash) + delim +
            enc(txo.locktime) + delim + enc(txo.ins) + delim + enc(txo.outs) + delim + enc(txo.txindex) + delim + enc(txo.n) + delim +
            enc(txo.prevtxid) + delim + enc(txo.prevn) + delim + enc(txo.seq) + delim + enc(txo.lockscript) + delim + enc(txo.unlockscript) + delim + enc(txo.scripthash) + '\n';
          rs.push(copyDataRow);
          currentIndex = currentIndex+1;
        }
      };
      let onError = strErr => {
        this.logger.error("CopyAssetError", { error: strErr, stack: strErr.stack })
        reject(strErr);
        return;
      };
      rs.on('error', onError);
      stream.on('error', onError);
      stream.on('finish', (e) => {
        this.logger.error("CopyAssetFinished", { height, blockTxRecords: blockTxRecords.length })
        resolve();
      });
      rs.pipe(stream);
    });
  }

  public async saveBlockData(kvstore: any, db: any, accountContext: IAccountContext, height: number, block: bsv.Block): Promise<any> {
    const blockTxRecords: ITxOutRecord[] = await this.getBlockTxRecords(kvstore, db, height, block);

    const pool = await this.db.getAssetDbClient(accountContext);
    await (async () => {
      // note: we don't try/catch this because if connecting throws an exception
      // we don't need to dispose of the client (it will be undefined)
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        if (blockTxRecords.length) {
          await this.generateCopyInCommands(client, height, blockTxRecords);
        } else {
          this.logger.debug("emptyBlock", { height , blockhash: block.hash});
        }
        const q = `
        INSERT INTO block_header(height, hash, hashbytes, size, version, merkleroot, time, nonce, bits, difficulty, previousblockhash)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `;
        await client.query(q, [
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
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    })().catch((e) => {
      this.logger.error(e.stack);
    });
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
