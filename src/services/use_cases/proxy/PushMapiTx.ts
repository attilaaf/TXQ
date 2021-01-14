
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
import InvalidParamError from '../../../services/error/InvalidParamError';
import AccessForbiddenError from '../../../services/error/AccessForbiddenError';
import ResourceNotFoundError from '../../../services/error/ResourceNotFoundError';

@Service('pushMapiTx')
export default class PushMapiTx extends UseCase {

  constructor(
    @Inject('merchantapilogService') private merchantapilogService,
    @Inject('saveTxs') private saveTxs,
    @Inject('txService') private txService,
    @Inject('logger') private logger) {
      super();
  }

  async run(params: {
    rawtx: string | Buffer,
    headers?: any,
    checkStatus?: boolean,
    accountContext?: IAccountContext
  }): Promise<UseCaseOutcome> {
   
    // Get the context to trigger exception earlier if needed
    await contextFactory.getNetwork(params.accountContext);
    try {
      const saveResponseTask = async (miner: string, eventType: string, response: any, txid: string) => {
        await this.merchantapilogService.saveNoError(params.accountContext, miner, eventType, response, txid)
        return true;
      };

      const merchantRequestor = new MerchantRequestor(
        contextFactory.getNetwork(params.accountContext),
        contextFactory.getMapiEndpoints(params.accountContext),
        this.logger,
        saveResponseTask
      );
      let tx;
      try {
        tx = new bsv.Transaction(params.rawtx);
      } catch (ex) {
        throw new InvalidParamError('Invalid rawtx');
      }
      let contentType = params.headers['content-type'];
      if (contentType !== 'application/octet-stream') {
        contentType = 'application/json';
      }
      let p: any = params.rawtx;

      // Whether to first check if the transaction is already existing or mined
      // Ensure it gets saved to our database
      // If available, return the payload stored from the database or null otherwise if it is not saved.
      if (params.checkStatus) {
        this.logger.debug('PushMapiTx.1', { projectId: params.accountContext.projectId, checkStatus: true, txid: tx.hash });
        const txStatusExisting = await this.getCheckExistingStatusFromMiner(tx.hash, params.accountContext);
        this.logger.debug('PushMapiTx.2', { projectId: params.accountContext.projectId, checkStatus: true, txid: tx.hash, txStatusExisting});
        if (txStatusExisting && txStatusExisting.payload && StatusTxUtil.isAcceptedStatus(txStatusExisting)) {
          this.logger.debug('PushMapiTx.3', { projectId: params.accountContext.projectId, checkStatus: true, txid: tx.hash, transactionExists: true});
          return this.sendSpoofedMapiPushResponse(txStatusExisting, tx, params.accountContext, params.headers);
        }
      }

      const send = await merchantRequestor.pushTx(p, contentType);
      this.logger.debug('PushMapiTx.send', { ctx: params.accountContext, txid: tx.hash, send});
      let txStatus = null;
      // If it's not accepted, check if it's because the miner already knows about the transaction
      if (!StatusTxUtil.isAcceptedStatus(send)) {
        this.logger.debug('PushMapiTx.4', { projectId: params.accountContext.projectId, send, status: "!isAcceptedStatus"});
        txStatus = await merchantRequestor.statusTx(tx.hash);
      }
      if (StatusTxUtil.isAcceptedPush(send) || StatusTxUtil.isAcceptedStatus(txStatus)) {
        this.logger.debug('PushMapiTx.5', { projectId: params.accountContext.projectId, send, status: "Accepted"});
        const channelMeta = ChannelMetaUtil.getChannnelMetaData(params.headers);
        await this.saveTxs.run({
          channel: channelMeta.channel ? channelMeta.channel : null,
          set: {
            [tx.hash]: {
              rawtx: tx.toString(),
              metadata: channelMeta.metadata,
              tags: channelMeta.tags, 
              send
            }
          },
          accountContext: params.accountContext
        });
      }  
      // Conform to mapi spec
      if (send && send.payload) {
        send.payload = (typeof send.payload === 'string') ? send.payload : JSON.stringify(send.payload);
      }
      return {
        success: true,
        result: send
      };
      
    } catch (error) {
      this.logger.error('PushMapiTx.6', {error, stack: error.stack});
      throw new MapiServiceError(error);
    }
  }
 
  async getCheckExistingStatusFromMiner(txid: string, accountContext: IAccountContext) {
    // Do nothing to save logs
    const saveResponseTask = async (miner: string, eventType: string, response: any, txid: string) => {
      // await this.merchantapilogService.saveNoError(params.accountContext, miner, eventType, response, txid)
      return true;
    };
    const merchantRequestor = new MerchantRequestor(
      contextFactory.getNetwork(accountContext),
      contextFactory.getMapiEndpoints(accountContext),
      this.logger,
      saveResponseTask
    );
    let txStatus = await merchantRequestor.statusTx(txid);
    return txStatus;
  }

  async sendSpoofedMapiPushResponse(txStatusExisting: any, tx: bsv.Transaction, accountContext: IAccountContext, headers: any) {
    try  {
      this.logger.debug('sendSpoofedMapiPushResponse.1', { txid: tx.hash, payload: txStatusExisting});

      let existingSavedTx = await this.txService.getTxSendResponse(accountContext, tx.hash);
      this.logger.debug('sendSpoofedMapiPushResponse.2', { existingSavedTx, txid: tx.hash, status: txStatusExisting.status, sender: txStatusExisting.send});
      // it exists, therefore send the mapi response in 'send'
      return {
        success: true,
        result: existingSavedTx.send || txStatusExisting,
        // existingSavedTx
      }
    } catch (err) {
      if (err instanceof ResourceNotFoundError) {
        // it didn't exist, therefore save it
        this.logger.debug('sendSpoofedMapiPushResponse.3.notFound', { txid: tx.hash });
        // Populate the tx into the database
        const channelMeta = ChannelMetaUtil.getChannnelMetaData(headers);
        await this.saveTxs.run({
          channel: channelMeta.channel ? channelMeta.channel : null,
          set: {
            [tx.hash]: {
              rawtx: tx.toString(),
              metadata: channelMeta.metadata,
              tags: channelMeta.tags
            }
          },
          accountContext: accountContext
        });
      } else {
        this.logger.error('sendSpoofedMapiPushResponse.4.error', { err, stack: err.stack });
      }
    }

    return {
          success: true,
          result: txStatusExisting
    };
  }
}

