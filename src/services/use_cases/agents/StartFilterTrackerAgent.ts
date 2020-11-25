import { IAccountContext } from '@interfaces/IAccountContext';
import Container, { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import contextFactory from '../../../bootstrap/middleware/di/diContextFactory';
import bitcoinAgent from '../../../bootstrap/middleware/di/diBitcoinAgent';
import Axios from 'axios';
import * as bsv from 'bsv';
import cfg from '../../../cfg';
import IngestFilterBlock from './filteragent/IngestFilterBlock';
import ReorgFilterBlock from './filteragent/ReorgFilterBlock';
 
@Service('startFilterTrackerAgent')
export default class StartFilterTrackerAgent extends UseCase {

  constructor(
    @Inject('blockheaderService') private blockheaderService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params?: {accountContext?: IAccountContext}): Promise<UseCaseOutcome> {
     
    const getEarliestStartHeight = () => {
      return cfg.filterTrackerAgentStartHeight;
    };

    bitcoinAgent.start({
      //
      // Get starting options to be used as defaults
      getConfig: async (): Promise<{ startHeight: number, blockPollTime?: number}> => {
        return new Promise((resolve, reject) => {
          return resolve({
            startHeight: getEarliestStartHeight(),
            blockPollTime: process.env.BLOCK_POLL_TIME ? Number(process.env.BLOCK_POLL_TIME) : 10,
          });
        });
      },

      //
      // Get starting options to be used as defaults
      open: async (config: { startHeight: number }): Promise<any> => {
        this.logger.debug("bitcoinAgent.open", config);
        return new Promise( async (resolve, reject) => {
          return resolve({
            db: contextFactory.getConfigDbClient()
          });
        });
      },

      getKnownBlockHeaders: async (params: { db: any, limit: number }, config: { startHeight: number }): Promise<any[]> => {
        this.logger.debug("bitcoinAgent.getKnownBlockHeaders", { limit: params.limit });
        return this.blockheaderService.getBlockHeaders(params.limit).
          then((rows) => {
              return rows;
          });
      },

      getBlock: async (params: { db: any, b: string }, config: { startHeight: number} ): Promise<string> => {
        this.logger.debug("bitcoinAgent.getBlock", { blockhash: params.b });
        return Axios.get(`https://media.bitcoinfiles.org/rawblock/${params.b}`)
          .then((result) => {
            return result.data;
          });
      },

      getBlockByHeight: async (height: string, config: { startHeight: number }): Promise<any> => {
        this.logger.debug("bitcoinAgent.getBlockByHeight", { height: height });
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
      getBeaconHeaders: async (params: { db: any, height: number, limit: number }, config: { startHeight: number} )
        : Promise<Array<{ blockhash: string, hash: string, height: number }>> => {
        this.logger.debug("bitcoinAgent.getBeaconHeaders", { height: params.height });
        return Axios.get(`https://txdb.mattercloud.io/api/v1/blockheader/${params.height}?limit=${params.limit}`)
          .then((result) => {
            return result.data.result;
          });
      },
      // Invoked in order for each block at starting point or after the `getKnownBlockheader`
      onBlock: async (params: { db: any, height: number, block: bsv.Block}, config: { startHeight: number }) => {
        this.logger.debug("bitcoinAgent.onBlock", { height: params.height, blockhash: params.block.hash });
        const uc = Container.get(IngestFilterBlock);
        await uc.run({
          db: params.db,
          block: params.block,
          height: params.height,
        });
        this.logger.debug("bitcoinAgent.onBlock FINISHED", { height: params.height, blockhash: params.block.hash });
      },
      onReorg: async (params: { db: any, height: number }, config: { startHeight: number, ctx: IAccountContext}) => {
        this.logger.debug("bitcoinAgent.onReorg", { height: params.height });
        const uc = Container.get(ReorgFilterBlock);
        await uc.run({
          height: params.height,
          db: params.db
        });
        this.logger.debug("bitcoinAgent.onReorg FINISHED", { height: params.height });
      }
    });

    return {
      success: true,
      result: {}
    };
  }
}
