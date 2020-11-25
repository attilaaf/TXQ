import { Service, Inject } from 'typedi';
import { ContextFactory } from '../../bootstrap/middleware/di/diContextFactory';
 
@Service('blockheaderModel')
class BlockheaderModel {

  constructor(@Inject('db') private db: ContextFactory) {}
 
  public async deleteBlockDataNewerThan(height: number): Promise<any> {
    const client = await this.db.getConfigDbClient();
    await client.query(`
      DELETE
      FROM
        block_header
      WHERE height > $1
      `, [ height ]);

    await client.query(`
      DELETE
      FROM
        txasset
      WHERE height > $1
      `, [ height ]);

    return true;
  }

  public async getBlockHeaders(limit: number = 20): Promise<string> {
    const client = await this.db.getConfigDbClient();
    let result: any = await client.query(`
      SELECT
        *
      FROM
        block_header
      ORDER BY height DESC
      LIMIT ${limit}
      `);
    return result.rows;
  }
 
}

export default BlockheaderModel;
