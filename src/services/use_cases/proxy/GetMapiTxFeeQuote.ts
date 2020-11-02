
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import Config from '../../../cfg';
import { MerchantRequestor } from '../../helpers/MerchantRequestor';
import MapiServiceError from '../../error/MapiServiceError';

@Service('getMapiTxFeeQuote')
export default class GetMapiTxFeeQuote extends UseCase {
  private merchantRequestor;
  constructor(
    @Inject('merchantapilogService') private merchantapilogService,
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

  async run(): Promise<UseCaseOutcome> {
    try {
      const feeQuote = await this.merchantRequestor.feeQuote();
      return {
        success: true,
        result: feeQuote
      };
    } catch (error) {
      throw new MapiServiceError(error);
    }
  }
}

