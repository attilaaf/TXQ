
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import Config from '../../../cfg';
import { MerchantRequestor } from '../../helpers/MerchantRequestor';
import MapiServiceError from '../../error/MapiServiceError';
import { StatusTxUtil } from '../../helpers/StatusTxUtil';
import * as bsv from 'bsv';
import { ChannelMetaUtil } from '../../helpers/ChannelMetaUtil';

@Service('pushMapiTx')
export default class PushMapiTx extends UseCase {
  private merchantRequestor;
  constructor(
    @Inject('merchantapilogService') private merchantapilogService,
    @Inject('saveTxs') private saveTxs,
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
    rawtx: string,
    headers?: any
  }): Promise<UseCaseOutcome> {
    try {
      const tx = new bsv.Transaction(params.rawtx);
      console.log('params.rawtx', params.rawtx);
      const status = await this.merchantRequestor.pushTx(params.rawtx);
      console.log('status', status);
      setTimeout(async () => {
        if (StatusTxUtil.isAcceptedPush(status)) {
          const channelMeta = ChannelMetaUtil.getChannnelMetaData(params.headers);
          await this.saveTxs.run({
            channel: channelMeta.channel ? channelMeta.channel : null,
            set: {
              [tx.hash]: {
                rawtx: tx.toString(),
                metadata: channelMeta.metadata,
                tags: channelMeta.tags
              }
            }
          });
        }
      }, 0);
      return {
        success: true,
        result: status
      };
    } catch (error) {
      throw new MapiServiceError(error);
    }
  }
}

