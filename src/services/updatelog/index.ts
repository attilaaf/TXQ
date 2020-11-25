import { IAccountContext } from '@interfaces/IAccountContext';
import { ITxEntityWithMetadata } from '@interfaces/ITransactionData';
import { Service, Inject } from 'typedi';

@Service('updatelogService')
export default class UpdatelogService {
  constructor(
    @Inject('updatelogModel') private updatelogModel,
    @Inject('eventService') private eventService,
    @Inject('logger') private logger) {}

  public async save(accountContext: IAccountContext, requestType: string, channel: string, entity: ITxEntityWithMetadata, txid: string) {
    const savedId = await this.updatelogModel.save(
      accountContext,
      requestType, entity, channel, txid
    );
    if (channel !== '' && channel !== entity.channel) {
      this.logger.error('Logic Errror', { channel, resChannel: entity.channel });
      throw new Error('Logic Error. Channel=' + channel + ', res.channel=' + entity.channel);
    }
    this.eventService.pushChannelEvent(accountContext, 'updatelogs-' + channel, {
      eventType: requestType,
      entity: {
        txid,
        ...entity
      }
    }, savedId);
  }
}
