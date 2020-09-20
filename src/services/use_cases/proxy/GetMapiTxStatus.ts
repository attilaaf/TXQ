
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import Config from '../../../cfg';
import { MerchantRequestor } from '../../helpers/MerchantRequestor';
import { BitcoinRegex } from '../../helpers/BitcoinRegex';
import MapiServiceError from '../../error/MapiServiceError';

@Service('getMapiTxStatus')
export default class GetMapiTxStatus extends UseCase {
  private merchantRequestor;
  constructor(
    @Inject('merchantapilogService') private merchantapilogService,
    @Inject('queueService') private queueService,
    @Inject('logger') private logger) {
      super();

      const saveResponseTask = async (miner: string, eventType: string, response: any, txid: string) => {
        if (Config.merchantapi.enableResponseLogging) {
          await this.merchantapilogService.save(miner, eventType, response, txid);
        }
        return true;
      };

      this.merchantRequestor = new MerchantRequestor(
        { ... Config.merchantapi },
        this.logger,
        saveResponseTask
      );
  }

  async run(params: {
    txid: string,
  }): Promise<UseCaseOutcome> {
    const txRegex = new RegExp(BitcoinRegex.TXID_REGEX);
    if (!txRegex.test(params.txid)) {
      return;
    }
    try {
      const status = await this.merchantRequestor.statusTx(params.txid);
      return {
        success: true,
        result: status
      };
    } catch (error) {
      throw new MapiServiceError(error);
    }
  }
}

