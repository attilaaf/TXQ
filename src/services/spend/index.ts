import { IAccountContext } from '@interfaces/IAccountContext';
import { Service, Inject } from 'typedi';

@Service('spendService')
export default class SpendService {
  constructor(@Inject('txinModel') private txinModel, @Inject('txoutModel') private txoutModel, @Inject('logger') private logger) {}


  public async updateSpendIndex(accountContext: IAccountContext,
    txid: string, index: string, spendTxId: string, spendIndex: number
  ) {
    await this.txoutModel.updateSpendIndex(accountContext, txid, index, spendTxId, spendIndex);
  }

  /**
   * Backfill any required spend_txid and spend_index for transactions created out of orde
   *
   * @param txid txid to check if spent
   * @param index index of txid to check if spent
   */
  public async backfillSpendIndexIfNeeded(accountContext: IAccountContext,
    txid: string, index: string
  ) {
    // We must also check to see if a tx that spends the current txid+index already exists
    // The user could have inserted a child tx first, therefore we must make sure to update spend index if needed
    const foundSpend = await this.txinModel.getTxinByPrev(accountContext, txid, index);
    if (foundSpend) {
      await this.txoutModel.updateSpendIndex(accountContext, txid, index, foundSpend.txid, foundSpend.index);
    }
  }
}
