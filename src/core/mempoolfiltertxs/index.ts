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
          let insertedQuery = await client.query(`
          INSERT INTO mempool_filtered_txs(txid, rawtx, session_id, created_at)
          VALUES
          ($1, $2, $3, NOW())
          ON CONFLICT(txid, session_id) DO NOTHING
          RETURNING id, created_at
          `, [ r.txid, Buffer.from(r.rawtx, 'hex'), r.sessionId]);
          
          // Do not insert if exists
          if (insertedQuery && insertedQuery.rows && insertedQuery.rows.length && parseInt(insertedQuery.rows[0].id)) {
            arrayIds.push({
              sessionId: r.sessionId,
              time: (new Date(insertedQuery.rows[0].created_at)).getTime(),
              created_at: (new Date(insertedQuery.rows[0].created_at)).getTime(),
              created_time: insertedQuery.rows[0].created_at,
              id: parseInt(insertedQuery.rows[0].id)
            });
            continue;
          }

          let isFoundAgain: any = await client.query(`
           SELECT count(*) as matches, id, created_at FROM mempool_filtered_txs WHERE txid = $1 AND session_id = $2 GROUP BY id;
          `, [ r.txid, r.sessionId ]);

          // Do not insert if exists
          if (isFoundAgain && isFoundAgain.rows && isFoundAgain.rows.length && isFoundAgain.rows[0].matches && parseInt(isFoundAgain.rows[0].matches) === 1) {
            arrayIds.push({
              sessionId: r.sessionId,
              time: (new Date(isFoundAgain.rows[0].created_at)).getTime(),
              created_at: (new Date(isFoundAgain.rows[0].created_at)).getTime(),
              created_time: isFoundAgain.rows[0].created_at,
              id: parseInt(isFoundAgain.rows[0].id)
            });
            continue;
          }
          arrayIds.push({
            sessionId: r.sessionId,
            id: null, // not set
          });
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

  public getDate(timeVariable: any): Date | null {
    if (!timeVariable) {
      return null;
    }
    let t: number = null;
    try {
      t = parseInt(timeVariable);
      const len = timeVariable.toString().length;
      if (len === 10) {
        return new Date(t * 1000);
      }
      if (len === 13) {
        return new Date(t);
      }
    } catch (err) {
      return null;
    }
    return null;
  }
  public async getMessagesSince(sessionId: string, eventId: any, time: any): Promise<any> {
    console.log('getMessagesSince', sessionId, eventId, time);
    if (!eventId && !time) {
      return [];
    }
    let queryTime = time;
    const client = await this.db.getCacheDbClient();
    let result = null;
    if (eventId && queryTime) {
      result = await client.query(`
        SELECT id, txid, encode(rawtx, 'hex') as rawtx, session_id, created_at FROM 
        mempool_filtered_txs 
        WHERE 
        session_id = $1 AND
        id >= $2 AND 
        created_at >= to_timestamp($3)
        ORDER BY id ASC
        LIMIT 1000
        `, [
          sessionId, eventId, queryTime 
        ]);
    } else if (eventId) {
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
    } else if (queryTime) {
      result = await client.query(`
      SELECT id, txid, encode(rawtx, 'hex') as rawtx, session_id, created_at FROM 
        mempool_filtered_txs 
        WHERE 
        session_id = $1 AND
        created_at >= to_timestamp($2)
        ORDER BY id ASC
        LIMIT 1000
        `, [
          sessionId, queryTime
        ]);
    }
    if (!result || !result.rows) {
      return [];
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
