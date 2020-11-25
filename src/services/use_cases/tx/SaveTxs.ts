import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import { ITransactionData, ITxEntityWithMetadata } from '../../../interfaces/ITransactionData';
import { EventTypes } from '../../../services/event';
import { IAccountContext } from '@interfaces/IAccountContext';
import contextFactory from '../../../bootstrap/middleware/di/diContextFactory';
import { ITXOutput } from '@interfaces/ITxOutput';

@Service('saveTxs')
export default class SaveTxs extends UseCase {
  constructor(
    @Inject('eventService') private eventService,
    @Inject('updatelogService') private updatelogService,
    @Inject('queueService') private queueService,
    @Inject('txModel') private txModel,
    @Inject('logger') private logger
  ) {
    super();
  }

  public async run(params: {
    channel?: string,
    set: {
      [key: string]: ITransactionData
    },
    hideRawtx?: boolean,
    accountContext?: IAccountContext
  }): Promise<UseCaseOutcome> {
    try {
      // Force permissions check
      contextFactory.getNetwork(params.accountContext);
      let cleanedChannel = params.channel ? params.channel : '';
      const persistResult: {
        txEvents: ITxEntityWithMetadata[],
        savedTxs: string[],
        txoutEvents: ITXOutput[]
      } = await this.txModel.saveTxs(params.accountContext, params);
 
      for (const item of persistResult.txEvents) {
        if (!item.nosync) {
         this.queueService.enqTxStatus(params.accountContext, item.txid);
        }
      }
      
      this.eventService.pushTxEvents(params.accountContext, cleanedChannel, persistResult.txEvents);
      this.eventService.pushTxoutEvents(params.accountContext, persistResult.txoutEvents);
       
      for (const item of persistResult.txEvents) {
        await this.updatelogService.save(params.accountContext, EventTypes.newtx, cleanedChannel, { ...item, entity: item, eventType: 'newtx'}, item.txid);
      }
    
      this.logger.info('SaveTxs', {
        savedTxs: persistResult.savedTxs,
        status: 'Saved',
      });
      return {
        success: true,
        result: persistResult.savedTxs
      };
    } catch (exception) {
      this.logger.info('SaveTxs', {
        exception,
        stack: exception.stack,
        channel: params.channel
      });
      throw exception;
    }
  }
}
