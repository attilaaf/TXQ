import { Service, Inject } from 'typedi';
import { IAccountContext } from '@interfaces/IAccountContext';
import { ContextFactory } from '../../bootstrap/middleware/di/diContextFactory';

@Service('txinModel')
class TxinModel {
  constructor(@Inject('db') private db: ContextFactory) {}

  public async save(accountContext: IAccountContext, txid: string, index: number, prevTxId: string, prevIndex: number, unlockScript: string): Promise<string> {
    const client = await this.db.getClient(accountContext);
    let result: any = await client.query(`
    INSERT INTO txin(txid, index, prevtxid, previndex, unlockscript)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT(txid, index) DO NOTHING`, [
      txid, index, prevTxId, prevIndex, unlockScript
    ]);
    return result;
  }
  public async getTxinByPrev(accountContext: IAccountContext, prevtxid: string, previndex: number): Promise<string> {
    const client = await this.db.getClient(accountContext);
    let result: any = await client.query(`SELECT * FROM txin WHERE prevtxid = $1 AND previndex = $2` , [prevtxid, previndex]);
    return result.rows[0];
  }
}

export default TxinModel;
