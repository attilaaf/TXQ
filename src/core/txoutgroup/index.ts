import { Service, Inject } from 'typedi';
import { IOutputGroupEntry } from '@interfaces/IOutputGroupEntry';
import { IAccountContext } from '@interfaces/IAccountContext';
import { ContextFactory } from '../../bootstrap/middleware/di/diContextFactory';

@Service('txoutgroupModel')
class TxoutgroupModel {
  constructor(@Inject('db') private db: ContextFactory) {}

  public async getTxoutgroupByName(accountContext: IAccountContext, groupname: string, offset: number = 0, limit: number = 100000): Promise<any> {
    const client = await this.db.getClient(accountContext);
    const s = `
    SELECT * FROM txoutgroup
    WHERE groupname = $1 ORDER BY created_at DESC OFFSET $2 LIMIT $3`;
    const result = await client.query(s, [ groupname, offset, limit] );
    return result.rows;
  }

  public async getTxoutgroupNamesByScriptId(accountContext: IAccountContext, scriptId: string): Promise<any> {
    const client = await this.db.getClient(accountContext);
    const s = `
    SELECT * FROM txoutgroup
    WHERE scriptid = $1`;
    const result = await client.query(s, [ scriptId ]);
    return result.rows;
  }

  public async getTxoutgroupNamesByScriptIds(accountContext: IAccountContext, scriptIds: string[]): Promise<any> {
    const client = await this.db.getClient(accountContext);
    const str = `
    SELECT * FROM txoutgroup
    WHERE scriptid IN (${this.joinQuote(scriptIds)})`;
    const result = await client.query(str);
    return result.rows;
  }

  public async saveTxoutgroups(accountContext: IAccountContext, groupname: string, items: IOutputGroupEntry[]): Promise<any> {
    const client = await this.db.getClient(accountContext);
    let expandedInserts = items.map((item) => {
      return `( '${groupname}', '${item.scriptid}', '${item.metadata ? JSON.stringify(item.metadata) : null }', ${Math.round((new Date()).getTime() / 1000)} )`;
    });
    const s = `
    INSERT INTO txoutgroup(groupname, scriptid, metadata, created_at)
    VALUES
    ${expandedInserts}
    ON CONFLICT(groupname, scriptid) DO UPDATE SET metadata = excluded.metadata`;
    return client.query(s);
  }

  public async deleteTxoutgroupByName(accountContext: IAccountContext, groupname: string): Promise<any> {
    const client = await this.db.getClient(accountContext);
    const result = await client.query(`
    DELETE FROM txoutgroup
    WHERE groupname = $1`, [ groupname ]);
    return result.rows;
  }

  public async deleteTxoutgroupByGroupAndScriptids(accountContext: IAccountContext, groupname: string, scriptids: string[]): Promise<any> {
    const client = await this.db.getClient(accountContext);
    const result = await client.query(`
    DELETE FROM txoutgroup
    WHERE groupname = $1 AND
    scriptid IN (${this.joinQuote(scriptids)})`, [ groupname ]);
    return result.rows;
  }


  private joinQuote(arr: string[]): string {
    return "'" + arr.join("','") + "'";
  }
}

export default TxoutgroupModel;
