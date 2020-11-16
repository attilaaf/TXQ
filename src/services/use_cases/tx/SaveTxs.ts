import { Service, Inject } from 'typedi';
import * as bsv from 'bsv';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import InvalidParamError from '../../error/InvalidParamError';
import TxhashMismatchError from '../../error/TxhashMismatchError';
import { BitcoinRegex } from '../../helpers/BitcoinRegex';
import { ITransactionData } from '../../../interfaces/ITransactionData';
import { EventTypes } from '../../../services/event';
import { txDataExtractor } from '../../../util/txdataextractor';
import Config from './../../../cfg';
import { IAccountContext } from '@interfaces/IAccountContext';
import contextFactory from '../../../bootstrap/middleware/di/diContextFactory';

@Service('saveTxs')
export default class SaveTxs extends UseCase {
  constructor(
    @Inject('eventService') private eventService,
    @Inject('updatelogService') private updatelogService,
    @Inject('txoutgroupService') private txoutgroupService,
    @Inject('queueService') private queueService,
    @Inject('txsyncService') private txsyncService,
    @Inject('txService') private txService,
    @Inject('getTx') private getTx,
    @Inject('txinService') private txinService,
    @Inject('txmetaService') private txmetaService,
    @Inject('txoutService') private txoutService,
    @Inject('spendService') private spendService,
    @Inject('logger') private logger
  ) {
    super();
  }

  public async run(params: {
    channel?: string,
    set: {
      [key: string]: ITransactionData
    },
    accountContext?: IAccountContext
  }): Promise<UseCaseOutcome> {
    try {
      const queueSettings = contextFactory.getQueueSettings(params.accountContext);
      const network = contextFactory.getNetwork(params.accountContext);
      let cleanedChannel = params.channel ? params.channel : '';
      const savedTxs = [];
      for (const txid in params.set) {
        if (!params.set.hasOwnProperty(txid)) {
          continue;
        }
        this.logger.info('SaveTxs', {
          projectId: params.accountContext.projectId,
          txid
        });
        let expectedTxid = txid;
        let didExistBefore = await this.txmetaService.isTxMetaExist(params.accountContext, txid, cleanedChannel);
        const nosync = queueSettings.nosync || !!params.set[txid].nosync;
        const rawtx = params.set[txid].rawtx;
        const metadata = params.set[txid].metadata;
        const tags = params.set[txid].tags;

        if (!txid && !rawtx) {
          throw new InvalidParamError();
        }
        let parsedTx;
        if (rawtx) {
          parsedTx = new bsv.Transaction(rawtx)
          if (expectedTxid) {
            if (parsedTx.hash != expectedTxid) {
              throw new TxhashMismatchError();
            }
          } else {
            expectedTxid = parsedTx.txhash
          }
        }

        if (!BitcoinRegex.TXID_REGEX.test(expectedTxid)) {
          throw new InvalidParamError();
        }

        if (rawtx) {
          await this.txService.saveTx(
            params.accountContext,
            rawtx
          );
        } else {
          await this.txService.saveTxid(
            params.accountContext,
            expectedTxid
          );
        }

        if (parsedTx) {
          await this.txinService.saveTxins(
            params.accountContext,
            parsedTx
          );
        }
        await this.txmetaService.saveTxmeta(
          params.accountContext,
          expectedTxid,
          cleanedChannel,
          metadata,
          tags,
          parsedTx ? txDataExtractor(parsedTx) : {}
        );

        let notifyWithEntities = [];

        if (parsedTx) {
          let i = 0;
          for (const input of parsedTx.inputs) {
            if (input.isNull()) {
              //Skip coinbase
              continue;
            }
            const prevTxId = input.prevTxId.toString('hex');
            const outputIndex = input.outputIndex;
            await this.spendService.updateSpendIndex(params.accountContext,
              prevTxId, outputIndex, parsedTx.hash, i
            );
            i++;
          }

          for (let i = 0; i < parsedTx.outputs.length; i++) {
            const buffer = Buffer.from(parsedTx.outputs[i].script.toHex(), 'hex');
            const scripthash = bsv.crypto.Hash.sha256(buffer).reverse().toString('hex');
            let address = '';
            try {
              address = bsv.Address.fromScript(parsedTx.outputs[i].script, network).toString();
            } catch (err) {
              // Do nothing
            }
            await this.txoutService.saveTxout(
              params.accountContext,
              expectedTxid,
              i,
              address,
              scripthash,
              parsedTx.outputs[i].script.toHex(),
              parsedTx.outputs[i].satoshis,
            );

            const wrappedEntity = { entity: {
              txid: expectedTxid,
              index: i,
              address,
              scripthash,
              script: parsedTx.outputs[i].script.toHex(),
              satoshis: parsedTx.outputs[i].satoshis
            }, eventType: 'txout'};

            notifyWithEntities.push({
              address,
              scripthash,
              wrappedEntity
            });

            await this.spendService.backfillSpendIndexIfNeeded(
              params.accountContext,
              parsedTx.hash, i
            );
          }
        }

        await this.txsyncService.insertTxsync(
          params.accountContext,
          expectedTxid,
          nosync
        );

        if (!nosync) {
          this.queueService.enqTxStatus(params.accountContext, txid);
        }

        savedTxs.push(expectedTxid);
        let useCaseOutcome = await this.getTx.run({ accountContext: params.accountContext, txid: expectedTxid, channel: cleanedChannel, rawtx: true });
        for (const item of notifyWithEntities) {
          const scriptIds = [];
          if (item.address) {
            scriptIds.push(item.address);
            this.eventService.pushChannelEvent(params.accountContext, 'address-' + item.address, item.wrappedEntity, -1);
          }
          if (item.scripthash) {
            scriptIds.push(item.scripthash);
            this.eventService.pushChannelEvent(params.accountContext, 'scripthash-' + item.scripthash, item.wrappedEntity, -1);
          }
          // Now get all the groups to be notified
          const txoutgroups = await this.txoutgroupService.getTxoutgroupNamesByScriptIds(params.accountContext, scriptIds);
          for (const txoutgroup of txoutgroups) {
            this.eventService.pushChannelEvent(params.accountContext, 'groupby-' + txoutgroup.groupname, item.wrappedEntity, -1);
          }
        }

        const entityNotif = { entity: useCaseOutcome.result, eventType: EventTypes.newtx};
        if (!didExistBefore) {
          this.eventService.pushChannelEvent(params.accountContext, cleanedChannel, entityNotif, useCaseOutcome.result.id);
          await this.updatelogService.save(params.accountContext, EventTypes.newtx, cleanedChannel, useCaseOutcome.result, expectedTxid);
        } else {
          entityNotif.eventType = EventTypes.updatetx;
          this.eventService.pushChannelEvent(params.accountContext, cleanedChannel, entityNotif, useCaseOutcome.result.id);
          await this.updatelogService.save(params.accountContext, EventTypes.updatetx, cleanedChannel, useCaseOutcome.result, expectedTxid);
        }

        this.logger.info('SaveTxs', {
          txid,
          status: 'Complete',
          didExistBefore,
        });
      }
      return {
        success: true,
        result: savedTxs
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
