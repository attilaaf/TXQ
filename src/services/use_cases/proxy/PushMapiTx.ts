
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import Config from '../../../cfg';
import { MerchantRequestor } from '../../helpers/MerchantRequestor';
import MapiServiceError from '../../error/MapiServiceError';
import { StatusTxUtil } from '../../helpers/StatusTxUtil';
import * as bsv from 'bsv';
import { ChannelMetaUtil } from '../../helpers/ChannelMetaUtil';
import { IAccountContext } from '@interfaces/IAccountContext';
import contextFactory from '../../../bootstrap/middleware/di/diContextFactory';

@Service('pushMapiTx')
export default class PushMapiTx extends UseCase {

  constructor(
    @Inject('merchantapilogService') private merchantapilogService,
    @Inject('saveTxs') private saveTxs,
    @Inject('logger') private logger) {
      super();
  }

  async run(params: {
    rawtx: string,
    headers?: any,
    accountContext?: IAccountContext
  }): Promise<UseCaseOutcome> {
    try {
      const tx = new bsv.Transaction(params.rawtx);
      const saveResponseTask = async (miner: string, eventType: string, response: any, txid: string) => {
        await this.merchantapilogService.saveNoError(params.accountContext, miner, eventType, response, txid)
        return true;
      };

      const merchantRequestor = new MerchantRequestor(
        contextFactory.getMapiEndpoints(params.accountContext),
        this.logger,
        saveResponseTask
      );

      const send = await merchantRequestor.pushTx(params.rawtx);
      setTimeout(async () => {
        let txStatus = null;
        // If it's not accepted, check if it's because the miner already knows about the transaction
        if (!StatusTxUtil.isAcceptedPush(send)) {
          txStatus = await merchantRequestor.statusTx(tx.hash);
        }
        if (StatusTxUtil.isAcceptedPush(send) || StatusTxUtil.isAcceptedStatus(txStatus)) {
          const channelMeta = ChannelMetaUtil.getChannnelMetaData(params.headers);
          await this.saveTxs.run({
            channel: channelMeta.channel ? channelMeta.channel : null,
            set: {
              [tx.hash]: {
                rawtx: tx.toString(),
                metadata: channelMeta.metadata,
                tags: channelMeta.tags
              }
            },
            accountContext: params.accountContext
          });
        }
      }, 50);
      // Conform to mapi spec
      if (send.payload) {
        send.payload = JSON.stringify(send.payload);
      }
      return {
        success: true,
        result: send
      };
    } catch (error) {
      throw new MapiServiceError(error);
    }
  }
}

