
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import Config from './../../../cfg';
import * as bsv from 'bsv';
import { Request } from 'express';
import * as Minercraft from 'minercraft';
import { MerchantapilogEventTypes } from '../../merchantapilog';
import { StatusTxUtil } from '../../helpers/StatusTxUtil';
import { ChannelMetaUtil } from '../../helpers/ChannelMetaUtil';

@Service('saveProxyRequestResponse')
export default class SaveProxyRequestResponse extends UseCase {

  constructor(
    @Inject('merchantapilogService') private merchantapilogService,
    @Inject('saveTxs') private saveTxs,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params: {
    userReq: any,
    proxyRes: any,
    proxyResData: any,
    miner: string,
  }): Promise<UseCaseOutcome> {
    let success = false;
    if ((params.proxyRes.statusCode <= 299 &&
        params.proxyRes.statusCode >= 200)) {
        success = await this.saveSuccess(params);
    } else {
      const eventType = this.getEventTypeFromPath(params.userReq.path, params.userReq.method);
      const path = params.userReq.path;
      const miner = params.miner;
      const method = params.userReq.method;
      const responseData = params.proxyResData.toString('utf8');
      const rawtx = params.userReq.body ? params.userReq.body.rawtx || params.userReq.body.rawTx : undefined;
      await this.saveError(params.proxyRes.statusCode, {
        eventType,
        path,
        miner,
        method,
        rawtx,
        responseData
      });
      this.logger.error('mapi_proxy', { statusCode: params.proxyRes.statusCode, data: params.proxyResData.toString('utf8')});
    }
    return {
      success,
      result: {
      }
    };
  }
  private async saveSuccess(params: {
    userReq: any,
    proxyRes: any,
    proxyResData: any,
    miner: string,
  }) {
    let eventType = this.getEventTypeFromPath(params.userReq.path,  params.userReq.method);
    const proxyResData = params.proxyResData.toString('utf8');
    console.log('proxyResDatta', proxyResData);

    // There is no data, it could be this was an OPTIONS request.
    // Just return without doing anything.
    if (!proxyResData) {
      return;
    }
    const data = JSON.parse(proxyResData);

    this.logger.info('mapi_proxy', { statusCode: params.proxyRes.statusCode, data: data, eventType: eventType});
    let txid;
    let tx;
    if (eventType === MerchantapilogEventTypes.PROXYPUSHTX) {
      tx = this.getParsedTxFromRawTx(params.userReq);
      txid = tx.hash;
      // Only save the transaction from the proxy if the result if a miner explictly says they accepted it.
      // that can be whether it's in mempool or recently mined.
      // We only want to save in our database the tx when we know we have some committment.
      if (StatusTxUtil.isAcceptedPush(data)) {
        txid = tx.hash || undefined;
        const channelMeta = ChannelMetaUtil.getChannnelMeta(params.userReq)
        await this.saveTxs.run({
          channel: channelMeta.channel ? channelMeta.channel : null,
          set: {
            [txid]: {
              rawtx: tx.toString(),
              metadata: channelMeta.metadata,
              tags: channelMeta.tags
            }
          }
        });
      }
    } else if (eventType === MerchantapilogEventTypes.PROXYSTATUSTX) {
      txid = this.getTxidFromPath(params.userReq.path);
    } else if (eventType === MerchantapilogEventTypes.PROXYFEEQUOTE) {
      txid = undefined;
    }

    if (Config.merchantapi.enableResponseLogging) {
      let isValid;
      try {
        isValid = Minercraft.validate(data);
      } catch (e) {
        isValid = false;
      }
      let validatedData = data;
      validatedData.payload = JSON.parse(data.payload)
      validatedData.valid = isValid;
      await this.merchantapilogService.save(params.miner, eventType, validatedData, txid);
    }
    return true;
  }

  private async saveError(statusCode, params: {
    path: string,
    method: string,
    eventType: string,
    rawtx?: string,
    responseData: string,
    miner: string
  }) {
    if (Config.merchantapi.enableResponseLogging) {
      const txid = this.findTxid(params.path, params.method, params.rawtx);
      await this.merchantapilogService.save(params.miner, params.eventType, { code: statusCode, data: params.responseData }, txid);
    }
  }

  /**
   * Get the event type for the request
   */
  private getEventTypeFromPath(path: string, method: string): MerchantapilogEventTypes {
    if (/^(\/mapi)?\/tx$/i.test(path) && /post/i.test(method)) {
      return MerchantapilogEventTypes.PROXYPUSHTX;
    }
    if (/^(\/mapi)?\/feeQuote$/i.test(path) && /get/i.test(method)) {
      return MerchantapilogEventTypes.PROXYFEEQUOTE;
    }
    const TXID_REGEX = new RegExp('^(\/mapi)?\/tx\/[0-9a-fA-F]{64}$');
    if (TXID_REGEX.test(path) && /get/i.test(method)) {
      return MerchantapilogEventTypes.PROXYSTATUSTX;
    }
    return undefined;
  }

  /**
   * Get the txid if it's available
   */
  private getTxidFromPath(path: string): string {
    const TXID_REGEX = new RegExp('^(\/mapi)?\/tx\/([0-9a-fA-F]{64})$');
    const matches = TXID_REGEX.exec(path);
    if (matches) {
      return matches[2];
    }
    return undefined;
  }

  private getParsedTxFromRawTx(userReq: Request): string {
    if (userReq.body && userReq.body.rawTx || userReq.body.rawtx) {
      let rawtx = userReq.body.rawTx || userReq.body.rawtx;
      try {
        return new bsv.Transaction(rawtx)
      } catch (err) {
        return undefined;
      }
    }
    return undefined;
  }

  /**
   * Get the txid from rawtx if available
   * @param userReq The express request to use to find the txid
   */
  private getTxidFromRawtx(rawtx: string): string {
    try {
      const tx = new bsv.Transaction(rawtx)
      return tx.hash;
    } catch (err) {
      return undefined;
    }
  }

  /**
   * Find the txid in the path or the rawtx body
   */
  private findTxid(path: string, method: string, rawtx?: string): string {
    let txid = this.getTxidFromPath(path);
    if (txid) {
      return txid;
    }
    return this.getTxidFromRawtx(rawtx);
  }
}

