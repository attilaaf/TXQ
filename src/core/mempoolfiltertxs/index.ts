import { Service, Inject } from 'typedi';
import { ContextFactory } from '../../bootstrap/middleware/di/diContextFactory';

@Service('mempoolfiltertxsModel')
class MempoolfiltertxsModel {

  constructor(@Inject('db') private db: ContextFactory, @Inject('logger') private logger: any) {}
 
  public async getAllAfterId(id: any): Promise<string> {
    const client = await this.db.getCacheDbClient();
    let result: any = await client.query(`
    SELECT * FROM mempool_filtered_txs WHERE id >= $1
    `, [ id ]);
    return result.rows;
  }

  public async getAllAfterCreatedAt(createdAt?: any): Promise<string> {
    const client = await this.db.getCacheDbClient();
    let result: any = await client.query(`
    SELECT * FROM mempool_filtered_txs WHERE created_at >= $1
    `, [ createdAt ]);
    return result.rows;
  }

  public async createBatch(records: Array<{ txid: string, rawtx: string, sessionId: string}> ): Promise<any> {
    const pool = await this.db.getCacheDbClient();
    return await (async () => {
      // note: we don't try/catch this because if connecting throws an exception
      // we don't need to dispose of the client (it will be undefined)
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const arrayIds = [];
        for (const r of records) {
          let isFound: any = await client.query(`
          SELECT count(*) as matches, id, created_at FROM mempool_filtered_txs WHERE txid = $1 AND session_id = $2 GROUP BY id;
          `, [ r.txid, r.sessionId ]);

          console.log('isFound', isFound.rows);
          // Do not insert if exists
          if (isFound && isFound.rows && isFound.rows.length && isFound.rows[0].matches && parseInt(isFound.rows[0].matches) === 1) {
            arrayIds.push({
              sessionId: r.sessionId,
              time: (new Date(isFound.rows[0].created_at)).getTime(),
              created_at: (new Date(isFound.rows[0].created_at)).getTime(),
              created_time: isFound.rows[0].created_at,
              id: parseInt(isFound.rows[0].id)
            });
            continue;
          }
          let result: any = await client.query(`
          INSERT INTO mempool_filtered_txs(txid, rawtx, session_id, created_at)
          VALUES
          ($1, $2, $3, NOW())
          ON CONFLICT(txid, session_id) DO NOTHING
          RETURNING id, created_at 
          `, [ r.txid, r.rawtx, r.sessionId]);
          if (result.rows && result.rows[0] && result.rows[0].id) {
            arrayIds.push({
              sessionId: r.sessionId,
              time: (new Date(result.rows[0].created_at)).getTime(),
              created_at: (new Date(result.rows[0].created_at)).getTime(),
              created_time: result.rows[0].created_at,
              id: parseInt(result.rows[0].id)
            });
          } else {
            arrayIds.push({
              sessionId: r.sessionId,
              id: null, // not set
            });
          }
        }
        await client.query('COMMIT');
        return arrayIds;
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    })().catch((e) => {
      this.logger.error(e.stack);
    });
  }

  public async deleteExpiredOlderThan(olderThanMinutes?: number): Promise<any> {
    let mins = 10;
    if (olderThanMinutes) {
      mins = olderThanMinutes
    }
    const client = await this.db.getCacheDbClient();
    return client.query(`
      DELETE FROM mempool_filtered_txs WHERE created_at < (NOW() - INTERVAL '${mins} minutes')
    `);
  }

  public async getMessagesSince(sessionId: string, eventId: any, time: any): Promise<any> {
    if (!eventId && !time) {
      return [];
    }
    const client = await this.db.getCacheDbClient();
    let result = null;
    if (eventId && time) {
      result = await client.query(`
        SELECT id, txid, encode(rawtx, 'hex') as rawtx, session_id, created_at FROM 
        mempool_filtered_txs 
        WHERE 
        session_id = $1 AND
        id >= $2 AND 
        created_at >= $3
        ORDER BY id ASC
        LIMIT 1000
        `, [
          sessionId, eventId, time
        ]);
    }
    if (eventId) {
      result = await client.query(`
      SELECT id, txid, encode(rawtx, 'hex') as rawtx, session_id, created_at FROM 
        mempool_filtered_txs 
        WHERE 
        session_id = $1 AND
        id >= $2
        ORDER BY id ASC
        LIMIT 1000
        `, [
          sessionId, eventId
        ]);
    }
    if (time) {
      result = await client.query(`
      SELECT id, txid, encode(rawtx, 'hex') as rawtx, session_id, created_at FROM 
        mempool_filtered_txs 
        WHERE 
        session_id = $1 AND
        created_at >= $2
        ORDER BY id ASC
        LIMIT 1000
        `, [
          sessionId, time
        ]);
    }
    return result.rows.map((item) => {
      return { 
        ...item, 
        time: (new Date(item.created_at)).getTime(),
        created_at: (new Date(item.created_at)).getTime(),
        created_time: item.created_at,
      }
    });
  }

}
 
export default MempoolfiltertxsModel;
