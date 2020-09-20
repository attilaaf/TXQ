import cfg from './../../../cfg';
import { Pool } from 'pg';

const config = {
  host: cfg.db.host,
  user: cfg.db.user, //this is the db user credential
  database: cfg.db.database,
  password: cfg.db.password,
  port: cfg.db.port,
  max: cfg.db.max, // max number of clients in the pool
  idleTimeoutMillis: cfg.db.idleTimeoutMillis,
};

let pool;
try {
  pool = new Pool(config);
} catch (error) {
  console.log('pg', error);
}
console.log(pool);
export default pool;
