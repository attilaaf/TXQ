
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import Config from '../../../cfg';
import { MerchantRequestor } from '../../helpers/MerchantRequestor';
import { BitcoinRegex } from '../../helpers/BitcoinRegex';
import MapiServiceError from '../../error/MapiServiceError';
import { IAccountContext } from '@interfaces/IAccountContext';
import contextFactory from '../../../bootstrap/middleware/di/diContextFactory';
import AccessForbiddenError from '../../../services/error/AccessForbiddenError';

@Service('getMapiTxStatus')
export default class GetMapiTxStatus extends UseCase {
  private merchantRequestor;
  constructor(
    @Inject('merchantapilogService') private merchantapilogService,
    @Inject('queueService') private queueService,
    @Inject('logger') private logger) {
      super();
  }

  async run(params: {
    txid: string,
    accountContext?: IAccountContext
  }): Promise<UseCaseOutcome> {
    const txRegex = new RegExp(BitcoinRegex.TXID_REGEX);
    if (!txRegex.test(params.txid)) {
      return;
    }
    await contextFactory.getClient(params.accountContext);
    const saveResponseTask = async (miner: string, eventType: string, response: any, txid: string) => {
      await this.merchantapilogService.saveNoError(params.accountContext, miner, eventType, response, txid);
      return true;
    };

    this.merchantRequestor = new MerchantRequestor(
      contextFactory.getNetwork(params.accountContext),
      contextFactory.getMapiEndpoints(params.accountContext),
      this.logger,
      saveResponseTask
    );
    try {
      const status = await this.merchantRequestor.statusTx(params.txid);
      // Conform to mapi spec
      if (status.payload) {
        status.payload = JSON.stringify(status.payload);
      }
      return {
        success: true,
        result: status
      };
    } catch (error) {
      this.logger.error({error, stack: error.stack});
      throw new MapiServiceError(error);
    }
  }
}

