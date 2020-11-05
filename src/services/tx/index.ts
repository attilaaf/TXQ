import { Service, Inject } from 'typedi';
import ResourceNotFoundError from '../error/ResourceNotFoundError';
import * as bsv from 'bsv';
import InvalidParamError from '../error/InvalidParamError';
import { ITransactionStatus } from '../../interfaces/ITransactionData';
import { sync_state } from '../../core/txsync';
import { IAccountContext } from '@interfaces/IAccountContext';

@Service('txService')
export default class TxService {
  constructor(@Inject('txModel') private txModel, @Inject('txsyncModel') private txsyncModel, @Inject('logger') private logger) {}

  public async isTxExist(accountContext: IAccountContext, txid: string): Promise<boolean> {
    return this.txModel.isTxExist(accountContext, txid);
  }

  public async getTx(accountContext: IAccountContext, txid: string, rawtx?: boolean) {
    let tx = await this.txModel.getTx(accountContext, txid, rawtx);
    if (!tx) {
      throw new ResourceNotFoundError();
    }
    return tx;
  }

  public async saveTxid(accountContext: IAccountContext, txid: string) {
    if (!txid) {
      throw new InvalidParamError();
    }
    return this.txModel.saveTxid(accountContext,
      txid
    );
  }

  public async saveTx(accountContext: IAccountContext, rawtx: string) {
    if (!rawtx) {
      throw new InvalidParamError();
    }
    const parsedTx = new bsv.Transaction(rawtx)
    return this.txModel.saveTx(accountContext,
      parsedTx.hash,
      rawtx
    );
  }

  public async saveTxStatus(accountContext: IAccountContext, txid: string, txStatus: ITransactionStatus, blockhash?: string, blockheight?: number) {
    await this.txModel.saveTxStatus(
      accountContext,
      txid,
      txStatus,
      blockhash,
      blockheight
    );
  }

  public async saveTxSend(accountContext: IAccountContext, txid: string, send: any) {
    await this.txModel.saveTxSend(
      accountContext,
      txid,
      send
    );
  }

  public async setTxCompleted(accountContext: IAccountContext, txid: string) {
    this.logger.info('setTxCompleted', {
      txid,
      projectId: accountContext.projectId
    });

    await this.txModel.updateCompleted(accountContext,
      txid,
      true
    );
    await this.txsyncModel.updateTxsyncAndClearDlq(
      accountContext,
      txid,
      sync_state.sync_success
    );
  }
}
