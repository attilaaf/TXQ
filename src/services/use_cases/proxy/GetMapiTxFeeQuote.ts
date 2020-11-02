
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import Config from '../../../cfg';
import { MerchantRequestor } from '../../helpers/MerchantRequestor';
import MapiServiceError from '../../error/MapiServiceError';
import { IAccountContext } from '@interfaces/IAccountContext';

@Service('getMapiTxFeeQuote')
export default class GetMapiTxFeeQuote extends UseCase {
  constructor(
    @Inject('merchantapilogService') private merchantapilogService,
    @Inject('logger') private logger) {
      super();

  }
  async run(params: { accountContext?: IAccountContext }): Promise<UseCaseOutcome> {

    const saveResponseTask = async (miner: string, eventType: string, response: any, txid: string) => {
      if (Config.merchantapi.enableResponseLogging) {
        await this.merchantapilogService.save(params.accountContext, miner, eventType, response, txid);
      }
      return true;
    };

    const merchantRequestor = new MerchantRequestor(
      { ... Config.merchantapi },
      this.logger,
      saveResponseTask
    );

    try {
      const feeQuote = await merchantRequestor.feeQuote();
      // Conform to mapi spec
      if (feeQuote.payload) {
        feeQuote.payload = JSON.stringify(feeQuote.payload);
      }
      return {
        success: true,
        result: feeQuote
      };
    } catch (error) {
      throw new MapiServiceError(error);
    }
  }
}

