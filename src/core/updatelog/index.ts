import { Service, Inject } from 'typedi';
import { IAccountContext } from '@interfaces/IAccountContext';
import { ContextFactory } from '../../bootstrap/middleware/di/diContextFactory';

@Service('updatelogModel')
class UpdatelogModel {
  constructor(@Inject('db') private db: ContextFactory) {}

  public async save(accountContext: IAccountContext, eventType: string, response: any, channel: string, txid: string): Promise<string> {
    const client = await this.db.getClient(accountContext);
    const restext = JSON.stringify(response);
    let requestTypeStr = eventType ? eventType : '';
    let channelStr = channel ? channel : '';
    let result: any = await client.query(`
    INSERT INTO updatelog(txid, event_type, channel, response)
    VALUES ($1, $2, $3, $4)
    RETURNING id`, [
      txid, requestTypeStr, channelStr, restext
    ]);
    return result.rows[0].id;
  }
}

export default UpdatelogModel;
