import { IAccountContext } from '@interfaces/IAccountContext';
import { Service, Inject } from 'typedi';

export enum MerchantapilogEventTypes {
  PUSHTX = 'pushtx',
  STATUSTX = 'statustx',
  PROXYPUSHTX = 'proxypushtx',
  PROXYSTATUSTX = 'proxystatustx',
  CHECKPUSHTX = 'checkpushtx',
  PROXYFEEQUOTE = 'proxyfeequote',
  FEEQUOTE = 'feequote',
}

@Service('merchantapilogService')
export default class MerchantapilogService {
  constructor(
    @Inject('merchantapilogModel') private merchantapilogModel,
    @Inject('eventService') private eventService,
    @Inject('logger') private logger) {}

  public async save(accountContext: IAccountContext, miner: string, requestType: string, response: any, txid?: string) {
    const savedId = await this.merchantapilogModel.save(accountContext,
      miner, requestType, response, txid
    );

    if (txid) {
      this.eventService.pushChannelEvent(accountContext, 'merchantapilogs', {
        miner,
        eventType: requestType,
        entity: {
          txid,
          ...response
        },
      }, savedId);
    }
  }
  public async saveNoError(accountContext: IAccountContext, miner: string, requestType: string, response: any, txid?: string) {
    try {
      return await this.save(accountContext, miner, requestType, response, txid);
    } catch (err) {
      return err;
    }
  }
}
