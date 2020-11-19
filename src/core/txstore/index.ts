import { Service, Inject } from 'typedi';
import { DateUtil } from '../../services/helpers/DateUtil';
import { IAccountContext } from '@interfaces/IAccountContext';
import { ContextFactory } from '../../bootstrap/middleware/di/diContextFactory';
import InvalidParamError from '../../services/error/InvalidParamError';

@Service('txStoreModel')
class TxStore {

  constructor(@Inject('db') private db: ContextFactory) {}

  public async getTxStore(accountContext: IAccountContext, id: string, category: string, revision?: number): Promise<string> {
    const client = await this.db.getClient(accountContext);
    if (revision) {
      let result: any = await client.query(`
      SELECT *
      FROM txstore
      WHERE
      id = $1 AND
      category = $2 AND
      revision = $3
      ORDER BY revision DESC
      LIMIT 1
      `, [ id, category, revision]);
      return result.rows[0];
    } else {
      let result: any = await client.query(`
      SELECT *
      FROM txstore
      WHERE
      id = $1 AND
      category = $2
      ORDER BY revision DESC
      LIMIT 1
      `, [ id, category ]);
      return result.rows[0];
    }
  }

  public async getTxStoreRevisions(accountContext: IAccountContext, id: string, category: string): Promise<any> {
    const client = await this.db.getClient(accountContext);
    let result: any = await client.query(`
    SELECT revision
    FROM txstore
    WHERE
    id = $1 AND
    category = $2
    ORDER BY revision DESC
    LIMIT 100
    `, [ id, category]);
    return result.rows;
  }

  public async saveTxStore(accountContext: IAccountContext, id: string, category: string, data: any): Promise<any> {
    const client = await this.db.getClient(accountContext);
    const now = DateUtil.now();
    let revision = 0;
    let maxRevision: any = await client.query(`
    SELECT max(revision) as rev
    FROM txstore
    WHERE
    id = $1 AND
    category = $2
    GROUP BY revision
    ORDER BY revision DESC
    LIMIT 1
    `, [
      id, category
    ]);

    if (maxRevision.rows && maxRevision.rows.length && maxRevision.rows[0]) {
      revision = maxRevision.rows[0].rev + 1;
    }
    let dataJson = '{}';
    try {
      dataJson = JSON.stringify(data);
    } catch (err) {
      throw new InvalidParamError();
    }
    let result: any = await client.query(`
    INSERT INTO txstore(id, category, revision, data, created_at)
    VALUES ($1, $2, $3, $4, $5)`, [
      id, category, revision, dataJson, now
    ]);
    return this.getTxStoreRevisions(accountContext, id, category);
  }
}

export default TxStore;
