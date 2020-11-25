import { IAccountContext } from '@interfaces/IAccountContext';
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import contextFactory from '../../../bootstrap/middleware/di/diContextFactory';
import bitcoinAgent from '../../../bootstrap/middleware/di/diBitcoinAgent';
import Axios from 'axios';
import * as bsv from 'bsv';
import * as rocksdb from 'level-rocksdb';

@Service('startAssetAgent')
export default class StartAssetAgent extends UseCase {

  constructor(
    @Inject('txassetModel') private txassetModel,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params?: {accountContext?: IAccountContext}): Promise<UseCaseOutcome> {

    let ctx: IAccountContext = null;
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

      if (!contexts[projectId].hosts) {
        continue;
      }
      // Only support assetdb for now
      if (projectId !== 'assetdb') {
        continue;
      }
      // Just use the first account context to enque
      ctx = {
        projectId,
        apiKey: contexts[projectId].apiKeys ? contexts[projectId].apiKeys[0] : [],
        host: contexts[projectId].hosts[0]
      };
    }

    bitcoinAgent.start({
      //
      // Get starting options to be used as defaults
      getConfig: async (): Promise<{ startHeight: number, ctx: IAccountContext}> => {
        return new Promise((resolve, reject) => {
          return resolve({
            startHeight: 12332,
            ctx,
          });
        });
      },

      //
      // Get starting options to be used as defaults
      open: async (config: { startHeight: number, ctx: IAccountContext}): Promise<{ kvstore: any, db: any }> => {
        return new Promise( async (resolve, reject) => {
          const kvstore = rocksdb('./agentdb');
          kvstore.put('node', 'rocks');
          const value = kvstore.get('node');
          kvstore.del('node');
          return resolve({
            kvstore,
            db: contextFactory.getAssetDbClient(config.ctx)
          });
        });
      },

      // Get the currently known header so we do not accidentally delete everything
      // This is used as the 'starting point' for the agent to index the blockchain
      getKnownBlockHeaders: async (kvstore: any, db: any, limit: number, config: { startHeight: number, ctx: IAccountContext}): Promise<any[]> => {
        return this.txassetModel.getBlockHeaders(ctx, limit).
          then((rows) => {
              return rows;
          });
      },

      getBlock: async (kvstore: any, db: any, b: bsv.Block, config: { startHeight: number, ctx: IAccountContext}): Promise<string> => {
        return Axios.get(`https://media.bitcoinfiles.org/rawblock/${b}`)
          .then((result) => {
            console.log('getblock', result.data);
            return result.data;
          });
      },
      // Get the currently known header so we do not accidentally delete everything
      // This is used as the 'starting point' for the agent to index the blockchain
      getBeaconHeaders: async (kvstore: any, db: any, height: number, limit: number, config: { startHeight: number, ctx: IAccountContext}): Promise<Array<{ blockhash: string, hash: string, height: number }>> => {
        return Axios.get(`https://txdb.mattercloud.io/api/v1/blockheader/${height}?limit=${limit}`)
          .then((result) => {
            return result.data.result;
          });
      },
      // Invoked in order for each block at starting point or after the `getKnownBlockheader`
      onBlock: async (kvstore: any, db: any, height: number, block: bsv.Block, config: { startHeight: number, ctx: IAccountContext}) => {
        return new Promise(async (resolve, reject) => {
          console.log('onblock');
          // Insert into block header

          kvstore.put('node', 'rocks');

          await this.txassetModel.saveBlockData(ctx, height, block);
          resolve();
        });
      },
      // We know after this point that the next `onBlock` that is invoked will be _after_ lastCommonBlockHash
      // Delete after thing after corrrespondingHeight
      onReorg: async (kvstore: any, db: any, reorg: { lastCommonBlockHash: string, corrrespondingHeight: number }, config: { startHeight: number, ctx: IAccountContext}) => {
        return new Promise(async (resolve, reject) => {
          console.log('reorg', reorg);
          // Insert into block header
          await this.txassetModel.deleteBlockDataNewerThan(ctx, reorg.corrrespondingHeight);
          resolve();
        });
      }
    });

    return {
      success: true,
      result: true
    };
  }
}
