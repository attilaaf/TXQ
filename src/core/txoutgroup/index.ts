import { Service, Inject } from 'typedi';
import { IOutputGroupEntry } from '@interfaces/IOutputGroupEntry';
import { IAccountContext } from '@interfaces/IAccountContext';
import { PoolFactory } from '../../bootstrap/middleware/di/diDatabase';

@Service('txoutgroupModel')
class TxoutgroupModel {
  constructor(@Inject('db') private db: PoolFactory) {}

  public async getTxoutgroupByName(accountContext: IAccountContext, groupname: string, offset: number = 0, limit: number = 100000): Promise<any> {
    const s = `
    SELECT * FROM txoutgroup
    WHERE groupname = $1 ORDER BY created_at DESC OFFSET $2 LIMIT $3`;
    const result = await this.db.getClient(accountContext).query(s, [ groupname, offset, limit] );
    return result.rows;
  }

  public async getTxoutgroupNamesByScriptId(accountContext: IAccountContext, scriptId: string): Promise<any> {
    const s = `
    SELECT * FROM txoutgroup
    WHERE scriptid = $1`;
    const result = await this.db.getClient(accountContext).query(s, [ scriptId ]);
    return result.rows;
  }

  public async getTxoutgroupNamesByScriptIds(accountContext: IAccountContext, scriptIds: string[]): Promise<any> {
    const str = `
    SELECT * FROM txoutgroup
    WHERE scriptid IN (${this.joinQuote(scriptIds)})`;
    const result = await this.db.getClient(accountContext).query(str);
    return result.rows;
  }

  public saveTxoutgroups(accountContext: IAccountContext, groupname: string, items: IOutputGroupEntry[]): Promise<any> {
    let expandedInserts = items.map((item) => {
      return `( '${groupname}', '${item.scriptid}', '${item.metadata ? JSON.stringify(item.metadata) : null }', ${Math.round((new Date()).getTime() / 1000)} )`;
    });
    const s = `
    INSERT INTO txoutgroup(groupname, scriptid, metadata, created_at)
    VALUES
    ${expandedInserts}
    ON CONFLICT(groupname, scriptid) DO UPDATE SET metadata = excluded.metadata`;
    return this.db.getClient(accountContext).query(s);
  }

  public async deleteTxoutgroupByName(accountContext: IAccountContext, groupname: string): Promise<any> {
    const result = await this.db.getClient(accountContext).query(`
    DELETE FROM txoutgroup
    WHERE groupname = $1`, [ groupname ]);
    return result.rows;
  }

  public async deleteTxoutgroupByGroupAndScriptids(accountContext: IAccountContext, groupname: string, scriptids: string[]): Promise<any> {
    const result = await this.db.getClient(accountContext).query(`
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
