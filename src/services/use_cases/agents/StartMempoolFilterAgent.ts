import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import { ITxFilterRequest, ITxFilterResultSet } from '@interfaces/ITxFilterSet';
import cfg from '../../../cfg';
import * as zmq from 'zeromq';
import * as bsv from 'bsv';

/**
 * The mempool agent handles streaming via ZMQ from 1 or more bitcoinsv 1.0.7+ nodes.
 * 
 * Note that the mempool is not authoritative, but can merely be used as a notification system. 
 * 
 * Responsible for filtering the mempool for either generic filter or output pattern match.
 */
@Service('startMempoolFilterAgent')
export default class StartMempoolFilterAgent extends UseCase {

  private txFilterSet: ITxFilterRequest = null;;

  constructor(
    @Inject('mempoolMatcherService') private mempoolMatcherService,
    @Inject('txfiltermanagerService') private txfiltermanagerService,
    @Inject('logger') private logger) {
    super();
    this.refetchFiltersEventLoop();
  }
  
  /**
   * Get 1 or more BSV ZMQ listener connections.
   */
  private getListeners() {
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
    return listeners;
  }

  public async connect(host, port): Promise<void> {
    const sock = new zmq.Subscriber;
    sock.subscribe("rawtx");
    sock.connect(`tcp://${host}:${port}`)
    for await (const [topic, msg] of sock) {
      const tx = new bsv.Transaction(msg); 
      console.log("mempooltx", tx.hash, host);
      // Filters genericly any pattern (not necessarily a txfilter saved for the project, but just transient SSE connection) 
      if (cfg.filterMempoolStreams.enabled) {
        this.mempoolMatcherService.notify(tx); 
      }
      // Filters for all txfilters
      if (cfg.filterMempoolAgent.enabled) {
        const txFilterSet: ITxFilterRequest = this.getFilters();
        if (txFilterSet && txFilterSet.ctxs) {
          const filterResultSet: ITxFilterResultSet = await this.txfiltermanagerService.filterTx(txFilterSet, [tx]);
          this.txfiltermanagerService.performProjectTenantUpdatesForTx(filterResultSet);
        }
      }
    }
    return;
  }

  public async run(): Promise<UseCaseOutcome> {
    // Only process and connect ZMQ mempool listener if the settings are enabled
    if (!cfg.filterMempoolStreams.enabled && !cfg.filterMempoolAgent.enabled) {
      return;
    }
    // Create multiple listeners
    // Deduplication of tx's happens at another layer.
    for (const listener of this.getListeners()) {
      console.log('Connect listener', listener);
      this.connect(listener.host, listener.port);
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
   * Reload all filters from all tenant projects
   */
  private async refetchFiltersEventLoop() {
    const CYCLE_TIME_SECONDS = 10;
    this.txFilterSet = await this.txfiltermanagerService.getAllFilters();
		setTimeout(async () => {
			try {
        this.txFilterSet = await this.txfiltermanagerService.getAllFilters();
			} finally {
				this.refetchFiltersEventLoop();
			}
		}, 1000 * CYCLE_TIME_SECONDS);
  }
  
}
