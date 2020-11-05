import { IAccountContext } from '@interfaces/IAccountContext';
import { Service, Inject } from 'typedi';
import { ContextFactory } from '../../bootstrap/middleware/di/diContextFactory';
@Service('merchantapilogModel')
class MerchantapilogModel {
  constructor(@Inject('db') private db: ContextFactory) {}

  public async save(accountContext: IAccountContext, miner: string, eventType: string, response: any, txid?: string): Promise<string> {
    const client = await this.db.getClient(accountContext);
    const restext = JSON.stringify(response);
    let requestTypeStr = eventType ? eventType : '';
    let result: any = await client.query(`
    INSERT INTO merchantapilog(miner, txid, event_type, response)
    VALUES ($1, $2, $3, $4)
    RETURNING id`, [ miner, txid ? txid : null, requestTypeStr, restext ],
    );
    return result.rows[0].id;
  }
}

export default MerchantapilogModel;
