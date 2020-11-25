import { IAccountContext } from '@interfaces/IAccountContext';
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import contextFactory from '../../../bootstrap/middleware/di/diContextFactory';
import bitcoinAgent from '../../../bootstrap/middleware/di/diBitcoinAgent';
import Axios from 'axios';
import * as bsv from 'bsv';
import cfg from '../../../cfg';
import { ITxFilterRequest, ITxFilterResultSet } from '@interfaces/ITxFilterSet';
 

@Service('startFilterTrackerAgent')
export default class StartFilterTrackerAgent extends UseCase {

  constructor(
    @Inject('blockheaderService') private blockheaderService,
    @Inject('txfiltermanagerService') private txfiltermanagerService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params?: {accountContext?: IAccountContext}): Promise<UseCaseOutcome> {
    /*let filterMap: {[key: string]: { ctx: any, results: any } } = {};

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

      // Just use the first account context to enque
      ctx = {
        projectId,
        apiKey: contexts[projectId].apiKeys ? contexts[projectId].apiKeys[0] : [],
        host: contexts[projectId].hosts[0]
      };
    }
    */
    const getEarliestStartHeight = () => {
      return cfg.filterTrackerAgentStartHeight;
    };

    bitcoinAgent.start({
      //
      // Get starting options to be used as defaults
      getConfig: async (): Promise<{ startHeight: number, ctx: IAccountContext}> => {
        return new Promise((resolve, reject) => {
          return resolve({
            startHeight: getEarliestStartHeight(),
            ctx: null,
          });
        });
      },

      //
      // Get starting options to be used as defaults
      open: async (config: { startHeight: number, ctx: IAccountContext}): Promise<any> => {
        return new Promise( async (resolve, reject) => {
          return resolve({
            db: contextFactory.getConfigDbClient()
          });
        });
      },

      getKnownBlockHeaders: async (params: { db: any, limit: number }, config: { startHeight: number, ctx: IAccountContext}): Promise<any[]> => {
        return this.blockheaderService.getBlockHeaders(params.limit).
          then((rows) => {
              return rows;
          });
      },

      getBlock: async (params: { db: any, b: string }, config: { startHeight: number, ctx: IAccountContext} ): Promise<string> => {
        return Axios.get(`https://media.bitcoinfiles.org/rawblock/${params.b}`)
          .then((result) => {
            return result.data;
          });
      },

      getBlockByHeight: async (height: string, config: { startHeight: number, ctx: IAccountContext }): Promise<any> => {
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
      getBeaconHeaders: async (params: { db: any, height: number, limit: number }, config: { startHeight: number, ctx: IAccountContext} ): Promise<Array<{ blockhash: string, hash: string, height: number }>> => {
        return Axios.get(`https://txdb.mattercloud.io/api/v1/blockheader/${params.height}?limit=${params.limit}`)
          .then((result) => {
            return result.data.result;
          });
      },
      // Invoked in order for each block at starting point or after the `getKnownBlockheader`
      onBlock: async (params: { db: any, height: number, block: bsv.Block}, config: { startHeight: number, ctx: IAccountContext}) => {
        console.log('onBlock', params.height); 
        const txFilterSet: ITxFilterRequest = await this.txfiltermanagerService.getAllFilters();
        const filterResultSet: ITxFilterResultSet = await this.txfiltermanagerService.filterBlock(txFilterSet, params.height, params.block);
        await this.txfiltermanagerService.processUpdatesForFilteredBlock(filterResultSet, params);
        console.log('onblock FINISHED', txFilterSet, filterResultSet, params.height); 
      },
      onReorg: async (params: { db: any, reorg: { height: number } }, config: { startHeight: number, ctx: IAccountContext}) => {
        // Todo
      }
    });

    return {
      success: true,
      result: true
    };
  }
}
