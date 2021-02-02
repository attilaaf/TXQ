import { IAccountContext } from '@interfaces/IAccountContext';
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import { ITxFilterRequest, ITxFilterResultSet } from '@interfaces/ITxFilterSet';
import cfg from '../../../cfg';
import * as zmq from 'zeromq';
import * as bsv from 'bsv';

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
    if (!cfg.filterMempoolStreams.enabled && !cfg.filterMempoolAgent.enabled) {
      return;
    }

    let instances = 1;
    if (process.env.BITCOIND_HOST_COUNT && parseInt(process.env.BITCOIND_HOST_COUNT) > 1) {
      instances = parseInt(process.env.BITCOIND_HOST_COUNT);
    }
    const listeners = [];
    listeners.push({
      host: process.env.BITCOIND_HOST,
      port: process.env.BITCOIND_ZMQ_LISTENER_PORT,
    });

    for (let i = 1; i < instances; i++) {
      listeners.push({
        host: process.env['BITCOIND_HOST_' + (i + 1) ],
          port: process.env['BITCOIND_ZMQ_LISTENER_PORT_' + (i + 1) ],
      });
    }
    for (const listener of listeners) {
      const sock = new zmq.Subscriber
      sock.subscribe("rawtx");
      sock.connect(`tcp://${listener.host}:${listener.port}`)
      for await (const [topic, msg] of sock) {
        const tx = new bsv.Transaction(msg); 
        console.log("txid", tx.hash);
        if (cfg.filterMempoolStreams.enabled) {
          this.txfiltermatcherService.notify(tx); 
        }
        if (cfg.filterMempoolAgent.enabled) {
          const txFilterSet: ITxFilterRequest = this.getFilters();
          if (txFilterSet && txFilterSet.ctxs) {
            const filterResultSet: ITxFilterResultSet = await this.txfiltermanagerService.filterTx(txFilterSet, [tx]);
            this.txfiltermanagerService.performProjectTenantUpdatesForTx(filterResultSet);
          }
        }
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
        console.log('fetchedFilterSet', 'monitoredOutpointFilters', this.txFilterSet.monitoredOutpointFilters.length);
        this.txFilterSet = await this.txfiltermanagerService.getAllFilters();

			} finally {
				this.reloadFiltersEventLoop();
			}
		}, 1000 * CYCLE_TIME_SECONDS);
  }
  
}
