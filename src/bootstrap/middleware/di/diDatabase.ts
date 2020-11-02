import cfg from './../../../cfg';
import { Pool } from 'pg';
import { IAccountContext } from '@interfaces/IAccountContext';

const config = {
  host: cfg.db.host,
  user: cfg.db.user, //this is the db user credential
  database: cfg.db.database,
  password: cfg.db.password,
  port: cfg.db.port,
  max: cfg.db.max, // max number of clients in the pool
  idleTimeoutMillis: cfg.db.idleTimeoutMillis,
};

/**
 * The Singleton class defines the `getInstance` method that lets clients access
 * the unique singleton instance.
 */
export class PoolFactory {

  /**
   * The static method that controls the access to the singleton instance.
   *
   * This implementation let you subclass the Singleton class while keeping
   * just one instance of each subclass around.
   */
  public static getInstance(): PoolFactory {
      if (!PoolFactory.instance) {
        PoolFactory.instance = new PoolFactory();
      }

      return PoolFactory.instance;
  }
  private static instance: PoolFactory;
  private dbPoolMap = {};
  /**
   * The Singleton's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */
  private constructor() { }

  public getPoolConfigWithCredentials(accountContext?: IAccountContext): any {
    return {
      ...config,
      namespace: accountContext ? accountContext.namespace : null,
    };
  }
  /**
   * Finally, any singleton should define some business logic, which can be
   * executed on its instance.
   */
  public getClient(accountContext?: IAccountContext) {
    const poolConfig = this.getPoolConfigWithCredentials(accountContext);
    if (poolConfig && this.dbPoolMap[poolConfig.namespace]) {
      return this.dbPoolMap[poolConfig.namespace];
    }
    this.dbPoolMap[poolConfig.namespace] = new Pool(poolConfig);
    return this.dbPoolMap[poolConfig.namespace];
  }
}
let poolFactory = PoolFactory.getInstance();
export default poolFactory;
