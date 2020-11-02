import { Service, Inject } from 'typedi';
import * as bsv from 'bsv';
import { IAccountContext } from '@interfaces/IAccountContext';
@Service('txinService')
export default class TxinService {
  constructor(@Inject('txinModel') private txinModel, @Inject('logger') private logger) {}
  public async saveTxins(accountContext: IAccountContext, tx: bsv.Transaction) {
    let i = 0;
    for (const input of tx.inputs) {
      if (input.isNull()) {
        //Skip coinbase
        continue;
      }
      const prevTxId = input.prevTxId.toString('hex');
      const outputIndex = input.outputIndex;
      const unlockScript = input.script.toBuffer().toString('hex');
      await this.txinModel.save(accountContext,
        tx.hash, i, prevTxId, outputIndex, unlockScript
      );
      i++;
    }
  }
}
