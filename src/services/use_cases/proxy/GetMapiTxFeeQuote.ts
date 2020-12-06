
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import { MerchantRequestor } from '../../helpers/MerchantRequestor';
import MapiServiceError from '../../error/MapiServiceError';
import { IAccountContext } from '@interfaces/IAccountContext';
import contextFactory from '../../../bootstrap/middleware/di/diContextFactory';
import AccessForbiddenError from '../../../services/error/AccessForbiddenError';

@Service('getMapiTxFeeQuote')
export default class GetMapiTxFeeQuote extends UseCase {
  constructor(
    @Inject('merchantapilogService') private merchantapilogService,
    @Inject('logger') private logger) {
      super();

  }
  async run(params: { accountContext?: IAccountContext }): Promise<UseCaseOutcome> {
    const saveResponseTask = async (miner: string, eventType: string, response: any, txid: string) => {
      await this.merchantapilogService.saveNoError(params.accountContext, miner, eventType, response, txid);
      return true;
    };
    await contextFactory.getClient(params.accountContext);
    const merchantRequestor = new MerchantRequestor(
      contextFactory.getNetwork(params.accountContext),
      contextFactory.getMapiEndpoints(params.accountContext),
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
      this.logger.error({error, stack: error.stack});
      throw new MapiServiceError(error);
    }
  }
}

