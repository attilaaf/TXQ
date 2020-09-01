import { Service, Inject } from 'typedi';
import { sql, DatabaseConnectionType } from 'slonik';
import { IOutputGroupEntry } from '@interfaces/IOutputGroupEntry';

@Service('txoutgroupModel')
class TxoutgroupModel {
  constructor(@Inject('db') private db: DatabaseConnectionType) {}

  public async getTxoutgroupByName(groupname: string, offset: number = 0, limit: number = 100000): Promise<any> {
    const s = sql`
    SELECT * FROM txoutgroup
    WHERE groupname = ${groupname} ORDER BY created_at DESC OFFSET ${offset} LIMIT ${limit}`;
    const result = await this.db.query(s);
    return result.rows;
  }

  public async getTxoutgroupNamesByScriptId(scriptId: string): Promise<any> {
    const s = sql`
    SELECT * FROM txoutgroup
    WHERE scriptid = ${scriptId}`;
    const result = await this.db.query(s);
    return result.rows;
  }

  public async getTxoutgroupNamesByScriptIds(scriptIds: string[]): Promise<any> {
    const str = sql`
    SELECT * FROM txoutgroup
    WHERE scriptid = ANY(${sql.array(scriptIds, 'varchar')})`;
    const result = await this.db.query(str);
    return result.rows;
  }

  public saveTxoutgroups(groupname: string, items: IOutputGroupEntry[]): Promise<any> {
    let expandedInserts = items.map((item) => {
      return [ groupname, item.scriptid, item.metadata ? JSON.stringify(item.metadata) : null, Math.round((new Date()).getTime() / 1000) ];
    });
    const s = sql`
    INSERT INTO txoutgroup(groupname, scriptid, metadata, created_at)
    SELECT *
    FROM ${sql.unnest(
      expandedInserts,
      [
        'varchar[]',
        'varchar[]',
        'jsonb',
        'int4'
      ]
    )} ON CONFLICT(groupname, scriptid) DO UPDATE SET metadata = excluded.metadata`;
    return this.db.query(s);
  }

  public async deleteTxoutgroupByName(groupname: string): Promise<any> {
    const result = await this.db.query(sql`
    DELETE FROM txoutgroup
    WHERE groupname = ${groupname}`);
    return result.rows;
  }

  public async deleteTxoutgroupByGroupAndScriptids(groupname: string, scriptids: string[]): Promise<any> {
    const result = await this.db.query(sql`
    DELETE FROM txoutgroup
    WHERE groupname = ${groupname} AND
    scriptid = ANY(${sql.array(scriptids, 'varchar')})`);
    return result.rows;
  }

}

export default TxoutgroupModel;
