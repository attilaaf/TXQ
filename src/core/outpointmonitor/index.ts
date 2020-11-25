import { Service, Inject } from 'typedi';
import { DateUtil } from '../../services/helpers/DateUtil';
import { IAccountContext } from '@interfaces/IAccountContext';
import { ContextFactory } from '../../bootstrap/middleware/di/diContextFactory';

@Service('outpointmonitorModel')
class OutpointmonitorModel {

  constructor(@Inject('db') private db: ContextFactory) {}
 
  public async getAll(accountContext: IAccountContext): Promise<string> {
    const client = await this.db.getClient(accountContext);
    let result: any = await client.query(`
    SELECT * FROM outpointmonitor WHERE spend_height IS NULL`);
    return result.rows;
  }
}

export default OutpointmonitorModel;
