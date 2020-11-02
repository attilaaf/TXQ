import { Service, Inject } from 'typedi';
import { IAccountContext } from '@interfaces/IAccountContext';
import { PoolFactory } from '../../bootstrap/middleware/di/diDatabase';

@Service('txinModel')
class TxinModel {
  constructor(@Inject('db') private db: PoolFactory) {}

  public async save(accountContext: IAccountContext, txid: string, index: number, prevTxId: string, prevIndex: number, unlockScript: string): Promise<string> {
    let result: any = await this.db.getClient(accountContext).query(`
    INSERT INTO txin(txid, index, prevtxid, previndex, unlockscript)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT(txid, index) DO NOTHING`, [
      txid, index, prevTxId, prevIndex, unlockScript
    ]);
    return result;
  }
  public async getTxinByPrev(accountContext: IAccountContext, prevtxid: string, previndex: number): Promise<string> {
    let result: any = await this.db.getClient(accountContext).query(`SELECT * FROM txin WHERE prevtxid = $1 AND previndex = $2` , [prevtxid, previndex]);
    return result.rows[0];
  }
}

export default TxinModel;
