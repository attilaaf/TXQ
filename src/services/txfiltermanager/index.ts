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
    @Inject('saveTxsFromMempool') private saveTxsFromMempool, 
    @Inject('txfilterModel') private txfilterModel, 
    @Inject('outpointmonitorService') private outpointmonitorService, 
    @Inject('txService') private txService,
    @Inject('logger') private logger, 
    @Inject('db') private db: ContextFactory) {}

  /**
   * Get all the projects known by this agent
   * Construct an IAccountContext to simulate requests
   */
  public async getAllProjects(): Promise<any> {
    const txResultRequest: any = {
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
      txResultRequest.ctxs[projectId] = ctx;
    }
    return txResultRequest;
  }

  /**
   * Get all the filters known for all projects
   */
  public async getAllFilters(): Promise<ITxFilterRequest> {
    const txResultRequest: ITxFilterRequest = {
      outputFilters: {
      },
      txidFilters: {
      },
      monitoredOutpointFilters: {

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
      // Build the filters
      const filters = await this.txfilterModel.getAllEnabled(ctx);
      txResultRequest.outputFilters[projectId] = txResultRequest.outputFilters[projectId] || [];
      for (const item of filters) {
        txResultRequest.outputFilters[projectId].push({
          payload: item.payload,
          trackSpends: true, // Note: By default we assume we wish to track spends of everything that matched a prefix
        });
      }
      // Get all unconfirmed, not-orphaned, and not nosync=1 txids 
      const txidFilters = await this.txService.getUnconfirmedTxids(ctx);
      txResultRequest.txidFilters[projectId] = txResultRequest.txidFilters[projectId] || [];
      for (const item of txidFilters) {
        txResultRequest.txidFilters[projectId].push({
          txid: item,
        });
      }
      // Get all monitored outpoints
      const monitoredOutpointFilters = await this.outpointmonitorService.getAll(ctx);
      txResultRequest.monitoredOutpointFilters[projectId] = txResultRequest.monitoredOutpointFilters[projectId] || {};
      for (const item of monitoredOutpointFilters) {
        txResultRequest.monitoredOutpointFilters[projectId][`${item.txid}${item.index}`] = {
          txid: item.txid,
          index: item.index,
        };
      }
 
      txResultRequest.ctxs[projectId] = ctx;
    }

    return txResultRequest;
  }
 
  /**
   * Filter txs for all projects and their filters
   * 
   * @param req Filter request for all projects
   * @param txs txs to filter
   */
  public async filterTx(req: ITxFilterRequest, txs: bsv.Transaction[]) : Promise<ITxFilterResultSet> {
     
    const results: ITxFilterResultSet = {
    };
    // Create txid map
    // Filter by txids (ie: check unconfirmed txs)
    let txMap = {};

    for (const projectId in req.ctxs) {
      if (!req.ctxs.hasOwnProperty(projectId)) {
        continue;
      }
      results[projectId] = results[projectId] || {
        ctx: req.ctxs[projectId],
        matchedMonitoredOutpointFilters: [],
        matchedTxidFilters: [],
        matchedOutputFilters: [],
        newOutpointMonitorRecords: {}
      }
    }

    for (const projectId in req.txidFilters) {
      if (!req.txidFilters.hasOwnProperty(projectId)) {
        continue;
      }
      
      for (const filterRule of req.txidFilters[projectId]) {
        txMap[filterRule.txid] = txMap[filterRule.txid] || {
          projectIds: [],
          filterRules: []
        }
        txMap[filterRule.txid].projectIds.push(projectId);
        txMap[filterRule.txid].filterRules.push(filterRule);
      }
    }

    for (const tx of txs) {

      if (txMap[tx.hash]) {
        for (let i = 0; i < txMap[tx.hash].projectIds.length; i++) {
          const projectId = txMap[tx.hash].projectIds[i];
          const filterRule = txMap[tx.hash].filterRules[i];
          
          results[projectId].matchedTxidFilters.push({
            txid: tx.hash,
            rawtx: tx.toString(), 
          });
        }
      }
      
      // filter output pattern match, make sure to track spends in THIS block by updating the outpoint filter if trackSpends=true
      let o = 0;

      for (const output of tx.outputs) {
        for (const projectId in req.outputFilters) {
          if (!req.outputFilters.hasOwnProperty(projectId)) {
            continue;
          }
          for (const filterRule of req.outputFilters[projectId]) {
            if (output.script.toHex().indexOf(filterRule.payload) !== -1) {
              results[projectId].matchedOutputFilters.push({
                txid: tx.hash,
                index: o,
                rawtx: tx.toString(), 
                payload: filterRule.payload,
              });

              // If this filter rule indicates to track spends of this output,
              // Then add this output to be monitored for spends. Make sure below that it can be counted if the spend
              // also appears in the same current block
              if (filterRule.trackSpends) {
                this.logger.debug('trackSpends', { projectId, txid: tx.hash, index: o});
                req.monitoredOutpointFilters[projectId][`${tx.hash}${o}`] = { 
                  txid: tx.hash,
                  index: o,
                };
                results[projectId].newOutpointMonitorRecords = results[projectId].newOutpointMonitorRecords || {};
                results[projectId].newOutpointMonitorRecords[`${tx.hash}${o}`] = {
                  txid: tx.hash,
                  index: o,
                };
              }
            }
          }
        }
        o++;
      }
           
      // filter inputs for outpoint pattern match
      // Note this must come after general filter output matching because we may track spends and must detect it
      let i = 0;
        for (const input of tx.inputs) {
        for (const projectId in req.monitoredOutpointFilters) {
          if (!req.monitoredOutpointFilters.hasOwnProperty(projectId)) {
            continue;
          }
          const prevTxid = input.prevTxId.toString('hex');
          const prevIndex = input.outputIndex;
          const monFilter = req.monitoredOutpointFilters[projectId][`${prevTxid}${prevIndex}`];
          if (monFilter) {
            // Update the newOutpointMonitorRecords (this applies to when output is spent in same block as output matcher)
            if (results[projectId] && results[projectId].newOutpointMonitorRecords && results[projectId].newOutpointMonitorRecords[`${prevTxid}${prevIndex}`]) {
              this.logger.debug('spendDetectedCurrentSet', { projectId, txid: tx.hash, prevTxid, prevIndex });
              results[projectId].newOutpointMonitorRecords[`${prevTxid}${prevIndex}`] = {
                ...results[projectId].newOutpointMonitorRecords[`${prevTxid}${prevIndex}`],
                spend_height: null,
                spend_blockhash: null,
                spend_txid: tx.hash,
                spend_index: i
              }
            } else {
              this.logger.debug('spendDetectedPrevSet', { projectId, txid: tx.hash, prevTxid, prevIndex });
              results[projectId].newOutpointMonitorRecords[`${prevTxid}${prevIndex}`] = {
                txid: monFilter.txid,
                index: monFilter.index,
              }
            }
          }
        }
        i++;
      }
    }

    return results;
  }

   /**
   * Filter a block for all projects and their filters
   * 
   * @param req Filter request for all projects
   * @param height Height of this block
   * @param block Block data
   */
  public async filterBlock(req: ITxFilterRequest, height: number, block: bsv.Block) : Promise<ITxFilterResultSet> {
     
    const results: ITxFilterResultSet = {
    };
    // Create txid map
    // Filter by txids (ie: check unconfirmed txs)
    let txMap = {};

    for (const projectId in req.ctxs) {
      if (!req.ctxs.hasOwnProperty(projectId)) {
        continue;
      }
      results[projectId] = results[projectId] || {
        ctx: req.ctxs[projectId],
        matchedMonitoredOutpointFilters: [],
        matchedTxidFilters: [],
        matchedOutputFilters: [],
        newOutpointMonitorRecords: {}
      }
    }

    for (const projectId in req.txidFilters) {
      if (!req.txidFilters.hasOwnProperty(projectId)) {
        continue;
      }
      
      for (const filterRule of req.txidFilters[projectId]) {
        txMap[filterRule.txid] = txMap[filterRule.txid] || {
          projectIds: [],
          filterRules: []
        }
        txMap[filterRule.txid].projectIds.push(projectId);
        txMap[filterRule.txid].filterRules.push(filterRule);
      }
    }
     
    let txIndex = -1;
    for (const tx of block.transactions) {
      txIndex++;
      if (txMap[tx.hash]) {
        for (let i = 0; i < txMap[tx.hash].projectIds.length; i++) {
          const projectId = txMap[tx.hash].projectIds[i];
          const filterRule = txMap[tx.hash].filterRules[i];
          
          results[projectId].matchedTxidFilters.push({
            txid: tx.hash,
            rawtx: tx.toString(), 
          });
        }
      }
      
      // filter output pattern match, make sure to track spends in THIS block by updating the outpoint filter if trackSpends=true
      let o = 0;
      for (const output of tx.outputs) {
        for (const projectId in req.outputFilters) {
          if (!req.outputFilters.hasOwnProperty(projectId)) {
            continue;
          }
          for (const filterRule of req.outputFilters[projectId]) {
            if (output.script.toHex().indexOf(filterRule.payload) !== -1) {
              results[projectId].matchedOutputFilters.push({
                txid: tx.hash,
                index: o,
                rawtx: tx.toString(), 
                payload: filterRule.payload,
              });

              // If this filter rule indicates to track spends of this output,
              // Then add this output to be monitored for spends. Make sure below that it can be counted if the spend
              // also appears in the same current block
              if (filterRule.trackSpends) {
                this.logger.debug('trackSpends', { projectId, txid: tx.hash, index: o});
                req.monitoredOutpointFilters[projectId][`${tx.hash}${o}`] = { 
                  txid: tx.hash,
                  index: o,
                };
                results[projectId].newOutpointMonitorRecords = results[projectId].newOutpointMonitorRecords || {};
                results[projectId].newOutpointMonitorRecords[`${tx.hash}${o}`] = {
                  txid: tx.hash,
                  index: o,
                };
              }
            }
          }
        }
        o++;
      }
 
      // filter inputs for outpoint pattern match
      // Note this must come after general filter output matching because we may track spends and must detect it
      let i = 0;
       for (const input of tx.inputs) {
        for (const projectId in req.monitoredOutpointFilters) {
          if (!req.monitoredOutpointFilters.hasOwnProperty(projectId)) {
            continue;
          }
          const prevTxid = input.prevTxId.toString('hex');
          const prevIndex = input.outputIndex;
          const monFilter = req.monitoredOutpointFilters[projectId][`${prevTxid}${prevIndex}`];
          if (monFilter) {
            // Update the newOutpointMonitorRecords (this applies to when output is spent in same block as output matcher)
            if (results[projectId] && results[projectId].newOutpointMonitorRecords && results[projectId].newOutpointMonitorRecords[`${prevTxid}${prevIndex}`]) {
              this.logger.debug('spendDetectedCurrentBlock', { projectId, txid: tx.hash, prevTxid, prevIndex });
              results[projectId].newOutpointMonitorRecords[`${prevTxid}${prevIndex}`] = {
                ...results[projectId].newOutpointMonitorRecords[`${prevTxid}${prevIndex}`],
                spend_height: height,
                spend_blockhash: block.hash,
                spend_txid: tx.hash,
                spend_index: i
              }
            } else {
              this.logger.debug('spendDetectedPreviousBlock', { projectId, txid: tx.hash, prevTxid, prevIndex });
              results[projectId].newOutpointMonitorRecords[`${prevTxid}${prevIndex}`] = {
                txid: monFilter.txid,
                index: monFilter.index,
              }
            }
          }
        }
        i++;
      }
 
    }
 
    return results;
  }

  private async perforrmProjectTenantUpdates(block: bsv.Block, height: number, filterRules: ITxFilterResultSet): Promise<any> {
    const results = {};

    for (const projectId in filterRules) {
      if (!filterRules.hasOwnProperty(projectId)) {
        continue;
      }
      console.log('perforrmProjectTenantUpdates', (new Date()).getTime() / 1000, projectId);
      // Flatten duplicate transactions from results
      const txsToSave = {};
      for (const match of filterRules[projectId].matchedMonitoredOutpointFilters) {
        txsToSave[match.txid] = {
          rawtx: match.rawtx
        };
      }
      for (const match of filterRules[projectId].matchedOutputFilters) {
        txsToSave[match.txid] = {
          rawtx: match.rawtx
        };
      }
      for (const match of filterRules[projectId].matchedTxidFilters) {
        txsToSave[match.txid] = {
          rawtx: match.rawtx
        };
      }
      console.log('perforrmProjectTenantUpdates saveTxsStarting', (new Date()).getTime() / 1000, projectId);
      const uc = await this.saveTxsFromBlock.run({
        set: txsToSave, 
        newOutpointMonitorRecords: filterRules[projectId].newOutpointMonitorRecords, // Save all new outpoints to monitor
        accountContext: filterRules[projectId].ctx,
        block,
        height
      });
      console.log('perforrmProjectTenantUpdates saveTxsStartingDone', (new Date()).getTime() / 1000, projectId);
      results[projectId] = uc.result;
    }
    return results;
  }

  public async performProjectTenantUpdatesForTx(filterRules: ITxFilterResultSet): Promise<any> {
    const results = {};
    let txToSaveCount = 0;
    for (const projectId in filterRules) {
      if (!filterRules.hasOwnProperty(projectId)) {
        continue;
      }
      // Flatten duplicate transactions from results
      const txsToSave = {};
      for (const match of filterRules[projectId].matchedMonitoredOutpointFilters) {
        txsToSave[match.txid] = {
          rawtx: match.rawtx
        };
        txToSaveCount++;
      }
      for (const match of filterRules[projectId].matchedOutputFilters) {
        txsToSave[match.txid] = {
          rawtx: match.rawtx
        };
        txToSaveCount++;
      }
      for (const match of filterRules[projectId].matchedTxidFilters) {
        txsToSave[match.txid] = {
          rawtx: match.rawtx
        };
        txToSaveCount++;
      }

      if (txToSaveCount) {
        this.logger.debug('performProjectTenantUpdatesForTx', { txToSaveCount })
        const uc = await this.saveTxsFromMempool.run({
          set: txsToSave, 
          newOutpointMonitorRecords: filterRules[projectId].newOutpointMonitorRecords, // Save all new outpoints to monitor
          accountContext: filterRules[projectId].ctx,
        });
        results[projectId] = uc.result;
      }
    }
    return results;
  }

  private async processReorgForProject(ctx: IAccountContext, height: number): Promise<any> {
    console.log('processReorgForProject 1', height);
    const pool = await this.db.getClient(ctx);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Remove all spent outpoints being monitored
      const q = `
      UPDATE outpointmonitor 
      SET
      spend_height = null,
      spend_txid = null,
      spend_index = null,
      spend_blockhash = null
      WHERE spend_height >= $1
      `;
      await client.query(q, [
        height
      ]);

      // Clear off confirmations for transactions
      const q2 = `
      UPDATE tx 
      SET
      i = null,
      h = null
      WHERE i >= $1
      `;
      await client.query(q2, [
        height
      ]);

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      console.log('processReorgForProject 2 DONE', height);
      client.release();
    }
  }

  public async processReorg(projects: { ctxs: any }, params: { height: any, db: any }): Promise<any> {
    for (const prop in projects.ctxs) {
      if (!projects.ctxs.hasOwnProperty(prop)) {
        continue;
      }
      const client = await params.db.connect();
      try {
        await client.query('BEGIN');
        this.processReorgForProject(projects.ctxs[prop], params.height);
        const q = `
        DELETE FROM 
        block_header
        WHERE height >= $1
        `;
        await client.query(q, [
          params.height
        ]);
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }
    return true;
  }

  public async processUpdatesForFilteredBlock(filterRules: ITxFilterResultSet, params: { height: any, block: any, db: any }): Promise<any> {
    const block = params.block;
    let results: any = {};
    await (async () => {
      const client = await params.db.connect();
      try {
        this.logger.debug("processUpdatesForFilteredBlock", (new Date()).getTime() / 1000);
        await client.query('BEGIN');
        results = await this.perforrmProjectTenantUpdates(block, params.height, filterRules);
       
        const checPrev = `
          SELECT * FROM block_header WHERE hash = $1
        `;
        const resultBlock = await client.query(checPrev, [
          block.hash
        ]);
        
        if (resultBlock.rows && resultBlock.rows[0] && resultBlock.rows[0].hash) {
          ; // Nothing to do
        } else {
          const q = `
          INSERT INTO block_header(height, hash, version, merkleroot, time, nonce, bits, difficulty, header, previousblockhash)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (height)
          DO UPDATE
          SET
            hash = EXCLUDED.hash,
            version = EXCLUDED.version,
            merkleroot = EXCLUDED.merkleroot,
            time = EXCLUDED.time,
            nonce = EXCLUDED.nonce,
            difficulty = EXCLUDED.difficulty,
            previousblockhash = EXCLUDED.previousblockhash
          `;
          await client.query(q, [
            params.height,
            block.hash,
            block.header.version,
            block.header.merkleRoot.toString('hex'),
            block.header.time,
            block.header.nonce,
            block.header.bits,
            block.header.getDifficulty(),
            block.header.toBuffer(),
            Buffer.from(block.header.prevHash.toString('hex'), 'hex').reverse().toString('hex')
          ]);
        }

        this.logger.debug("processUpdatesForFilteredBlock about to commited", (new Date()).getTime() / 1000);
    
        await client.query('COMMIT');
         
        this.logger.debug("processUpdatesForFilteredBlock commited", (new Date()).getTime() / 1000);
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    })().catch((e) => {
      this.logger.debug("processUpdatesForFilteredBlock exception", { error: e, stack: e.stack });
      console.error(e, e.stack);
    })
 
    return results;
  }
}
 