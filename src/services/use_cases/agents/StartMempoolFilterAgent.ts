import { IAccountContext } from '@interfaces/IAccountContext';
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import BitworkFactory from '../../../services/helpers/BitworkFactory'
 
@Service('startMempoolFilterAgent')
export default class StartMempoolFilterAgent extends UseCase {

  constructor(
    @Inject('txfiltermatcherService') private txfiltermatcherService,
    @Inject('logger') private logger) {
    super();
  }
  public async run(params?: {accountContext?: IAccountContext}): Promise<UseCaseOutcome> {
    // Create bitcion listeners as backups
    // Deduplication of tx's happens at another layer.
    // Note: the modified bitwork library also reconnects if the connection is detected dead
    for (let bit of await BitworkFactory.getBitworks()) {
      this.logger.debug('Creating bitwork handler...');
      bit.on('ready', async () => {
        this.logger.debug('Bitwork ready...');
        bit.on('mempool', (tx) => {
          console.log('tx', tx.hash);
          this.txfiltermatcherService.notify(tx);
        });
        setInterval(() => {
          const status = bit.getPeer().status;
          console.log('Bitcoind peer status: ', status);
        }, 30000)
      });
    }   
    return {
      success: true,
      result: {}
    };
  }
}
