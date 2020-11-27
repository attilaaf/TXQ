import { IAccountContext } from '@interfaces/IAccountContext';
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import contextFactory from '../../../bootstrap/middleware/di/diContextFactory';
import bitcoinAgent from '../../../bootstrap/middleware/di/diBitcoinAgent';
import Axios from 'axios';
import * as bsv from 'bsv';
import * as rocksdb from 'level-rocksdb';
import cfg from '../../../cfg';

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

    const getEarliestStartHeight = () => {
      const infinity = 999999999999;
      let seenMin = infinity;
      for (const item in cfg.assets) {
        if (!cfg.assets.hasOwnProperty(item)) {
          continue;
        }
        if (cfg.assets[item].height < seenMin) {
          seenMin = cfg.assets[item].height;
        }
      }
      return seenMin !== infinity ? seenMin : 0;
    };

    bitcoinAgent.start({
      //
      // Get starting options to be used as defaults
      getConfig: async (): Promise<{ startHeight: number, ctx: IAccountContext}> => {
        return new Promise((resolve, reject) => {
          return resolve({
            startHeight: getEarliestStartHeight(),
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
            return result.data;
          });
      },

      getBlockByHeight: async (height: number, config: { startHeight: number, ctx: IAccountContext}): Promise<any> => {
        return Axios.get(`https://media.bitcoinfiles.org/height/${height}`)
          .then((result) => {
            return Axios.get(`https://media.bitcoinfiles.org/rawblock/${result.data.blockhash}`)
            .then((resultblock) => {
              return resultblock.data;
            });
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
          return this.txassetModel.saveBlockData(ctx, height, block);
      },
      // We know after this point that the next `onBlock` that is invoked will be _after_ lastCommonBlockHash
      // Delete after thing after corrrespondingHeight
      onReorg: async (kvstore: any, db: any, reorg: { height: number }, config: { startHeight: number, ctx: IAccountContext}) => {
        return this.txassetModel.deleteBlockDataNewerThan(ctx, reorg.height - 1);
      }
    });

    return {
      success: true,
      result: true
    };
  }
}
