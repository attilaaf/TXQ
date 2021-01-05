import { IAccountContext } from '@interfaces/IAccountContext';
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import BitworkFactory from '../../../services/helpers/BitworkFactory'
import { ITxFilterRequest, ITxFilterResultSet } from '@interfaces/ITxFilterSet';
 
@Service('startMempoolFilterAgent')
export default class StartMempoolFilterAgent extends UseCase {

  private txFilterSet: ITxFilterRequest = null;;

  constructor(
    @Inject('txfiltermatcherService') private txfiltermatcherService,
    @Inject('txfiltermanagerService') private txfiltermanagerService,
    @Inject('logger') private logger) {
    super();
  
    this.reloadFiltersEventLoop();
  }
  
  public async run(params?: {accountContext?: IAccountContext}): Promise<UseCaseOutcome> {
    // Create bitcion listeners as backups
    // Deduplication of tx's happens at another layer.
    // Note: the modified bitwork library also reconnects if the connection is detected dead
    if (process.env.ENABLE_MEMPOOL_ROUTES === 'true' || process.env.ENABLE_MEMPOOL_FILTERS === 'true') {
      for (let bit of await BitworkFactory.getBitworks()) {
        this.logger.debug('Creating bitwork handler...');
        bit.on('ready', () => {
          this.logger.debug('Bitwork ready...');
          bit.on('mempool', async (tx) => {
            this.txfiltermatcherService.notify(tx);
            if (process.env.ENABLE_MEMPOOL_FILTERS === 'true') {
              const txFilterSet: ITxFilterRequest = this.getFilters();
              const filterResultSet: ITxFilterResultSet = await this.txfiltermanagerService.filterTx(txFilterSet, [tx]);
              this.txfiltermanagerService.perforrmProjectTenantUpdatesForTx(filterResultSet);
            }
          });
          setInterval(() => {
            const status = bit.getPeer().status;
            console.log('Bitcoind peer status: ', status);
          }, 30000)
        });
      }   
    }
    return {
      success: true,
      result: {}
    };
  }
  private getFilters() {

    return this.txFilterSet;
  }

  /**
   * Clean up old sessions
   */
  private async reloadFiltersEventLoop() {
    const CYCLE_TIME_SECONDS = 10;
    this.txFilterSet = await this.txfiltermanagerService.getAllFilters();
		setTimeout(async () => {
			try {
        this.txFilterSet = await this.txfiltermanagerService.getAllFilters();

			} finally {
				this.reloadFiltersEventLoop();
			}
		}, 1000 * CYCLE_TIME_SECONDS);
  }
  
}
