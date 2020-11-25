import { IAccountContext } from '@interfaces/IAccountContext';
import { ContextFactory } from '../../bootstrap/middleware/di/diContextFactory';
import { Service, Inject } from 'typedi';
import { ITxFilterRequest, ITxFilterResultSet } from '@interfaces/ITxFilterSet';
import * as bsv from 'bsv';
import contextFactory from '../../bootstrap/middleware/di/diContextFactory';

@Service('txfiltermanagerService')
export default class TxfiltermanagerService {
  constructor(
  @Inject('saveTxsFromBlock') private saveTxsFromBlock, 
  @Inject('txfilterModel') private txfilterModel, 
  @Inject('txService') private txService, 
  @Inject('db') private db: ContextFactory) {}

  public async getAllFilters(): Promise<ITxFilterRequest> {
    const txResultRequest: ITxFilterRequest = {
      outputFilters: {
      },
      txidFilters: {
      },
      ctxs: {}
    };
    const contexts = contextFactory.getContextsConfig();
    for (const projectId in contexts) {

      if (!contexts.hasOwnProperty(projectId)) {
        continue;
      }
      if (!contexts[projectId].enabled) {
        continue;
      }
      if (!contexts[projectId].hosts) {
        continue;
      }
      if (!contexts[projectId].enabledFilters) {
        continue;
      }

      const ctx = {
        projectId,
        apiKey: contexts[projectId].apiKeys ? contexts[projectId].apiKeys[0] : [],
        serviceKey: contexts[projectId].serviceKeys ? contexts[projectId].serviceKeys[0] : [],
        host: contexts[projectId].hosts[0]
      };
      const filters = await this.txfilterModel.getAll(ctx);
      txResultRequest.outputFilters[projectId] = txResultRequest.outputFilters[projectId] || [];
      for (const item of filters) {
        txResultRequest.outputFilters[projectId].push({
          payload: item.payload,
          actions: []
        });
      }
      // Get all unconfirmed, not-orphaned, and not nosync=1 txids 
      const txidFilters = await this.txService.getUnconfirmedTxids(ctx);
      txResultRequest.txidFilters[projectId] = txResultRequest.txidFilters[projectId] || [];
      for (const item of txidFilters) {
        txResultRequest.txidFilters[projectId].push({
          txid: item,
          actions: []
        });
      }
      
      txResultRequest.ctxs[projectId] = ctx;
    }
    return txResultRequest;
  }

  public async filterBlock(req: ITxFilterRequest, height: number, block: bsv.Block) : Promise<ITxFilterResultSet> {
    const results: ITxFilterResultSet = {};
    const txidset = [];
    let txIndex = -1;
    let txTotalCount = 0;
    for (const tx of block.transactions) {
      txIndex++;
      // filter output pattern match
      for (const output of tx.outputs) {
        for (const projectId in req.outputFilters) {
          if (!req.outputFilters.hasOwnProperty(projectId)) {
            continue;
          }
          for (const filterRule of req.outputFilters[projectId]) {
            if (output.script.toHex().indexOf(filterRule.payload) !== -1) {
              results[projectId] = results[projectId] || {
                ctx: req.ctxs[projectId],
                items: []
              }
              results[projectId].items.push({
                txid: tx.hash,
                rawtx: tx.toString(), 
                payload: filterRule.payload,
                actions: filterRule.actions
              });
            }
          }
        }
      }
      // Filter txid (used for not confirmed txs)
      for (const projectId in req.txidFilters) {
        if (!req.txidFilters.hasOwnProperty(projectId)) {
          continue;
        }
        for (const filterRule of req.txidFilters[projectId]) {
          if (tx.hash === filterRule.txid) {
            results[projectId] = results[projectId] || {
              ctx: req.ctxs[projectId],
              items: []
            }
            results[projectId].items.push({
              txid: tx.hash,
              rawtx: tx.toString(), 
              actions: filterRule.actions
            });
          }
        }
      }
      txTotalCount++;
    }
    return results;
  }

  public async performTxInsertOrUpdates(block: bsv.Block, height: number, filterRules: ITxFilterResultSet): Promise<any> {
    for (const projectId in filterRules) {
      if (!filterRules.hasOwnProperty(projectId)) {
        continue;
      }
      const txsToSave = {};
      for (const match of filterRules[projectId].items) {
        txsToSave[match.txid] = {
          rawtx: match.rawtx
        };
      }
      const uc = await this.saveTxsFromBlock.run({
        set: txsToSave, 
        accountContext: filterRules[projectId].ctx,
        block,
        height
      });
    }
    return true;
  }

  public async processUpdatesForFilteredBlock(filterRules: ITxFilterResultSet, params: any): Promise<any> {
    const block = params.block;
    await (async () => {
      const client = await params.db.connect();
      try {
        await client.query('BEGIN');
        await this.performTxInsertOrUpdates(block, params.height, filterRules);
        const q = `
        INSERT INTO block_header(height, hash, size, version, merkleroot, time, nonce, bits, difficulty, previousblockhash)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;
        await client.query(q, [
          params.height,
          block.hash,
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
      console.error(e.stack);
    })

    /*this.blockfiltermanagerService.filterBlock(txFilterSet, params.height, params.block);

    const pool = await this.db(accountContext);
    await (async () => {
 
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        if (blockTxRecords.length) {
          await this.generateCopyInCommands(client, height, blockTxRecords);
        } else {
          console.log('Empty block');
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
      console.error(e.stack);
    });*/
    // console.log('processUpdatesForFilteredBlock Onblock', res); 
    return true;
  }
}
 