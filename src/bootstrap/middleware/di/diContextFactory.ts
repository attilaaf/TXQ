import cfg from '../../../cfg';
import { Pool } from 'pg';
import { IAccountContext } from '@interfaces/IAccountContext';
import AccountContextForbiddenError from '../../../services/error/AccountContextForbiddenError';
import { contextsConfig } from "../../../cfg/config.js";

export class ContextFactory {
  /**
   * The static method that controls the access to the singleton instance.
   *
   * This implementation let you subclass the Singleton class while keeping
   * just one instance of each subclass around.
   */
  public static getInstance(): ContextFactory {
    if (!ContextFactory.instance) {
      ContextFactory.instance = new ContextFactory();
    }
    return ContextFactory.instance;
  }

  // tslint:disable-next-line: member-ordering
  private static instance: ContextFactory;
  // Store the database pools by projectId+apiKey
  // tslint:disable-next-line: member-ordering
  private dbPoolMap: any = {};
  private hostsMap: any = {};
  private contextsConfig: any;
  /**
   * The Singleton's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */
  private constructor() {
    this.contextsConfig = contextsConfig;

    // Populate map of which projects are mapped to which hosts
    // Note that the newest (latest appeariing in config) takes precedence.
    for (const entry in this.contextsConfig) {
      if (!this.contextsConfig.hasOwnProperty(entry)) {
        continue;
      }
      if (!this.contextsConfig[entry].enabled) {
        continue;
      }
      for (const host of this.contextsConfig[entry].hosts) {
        if (!this.hostsMap[host]) {
          this.hostsMap[host] = entry;
        }
      }
    }
  }

  public getDefaultPoolClient() {
    if (this.dbPoolMap.default) {
      return this.dbPoolMap.default;
    }
    if (cfg.enableDefault) {
      if (!this.contextsConfig.default || !this.contextsConfig.default.enabled) {
        throw new Error('No enabled default config');
      }
      this.dbPoolMap.default = new Pool(this.contextsConfig.default.dbConnection);
      return this.dbPoolMap.default;
    }

    throw new AccountContextForbiddenError();
  }

  public getQueueSettings(accountContext?: IAccountContext) {
    // Will throw exception if not found
    const ctx = this.getAccountContextConfig(accountContext);
    return ctx.queue;
  }

  public getNetwork(accountContext?: IAccountContext): string {
    // Will throw exception if not found
    const ctx = this.getAccountContextConfig(accountContext);
    return ctx.network;
  }

  public getMapiEndpoints(accountContext?: IAccountContext) {
    // Will throw exception if not found
    const ctx = this.getAccountContextConfig(accountContext);
    return ctx.merchantapi;
  }

  public async getClient(accountContext?: IAccountContext) {
    // Will throw exception if not found
    const ctx = this.getAccountContextConfig(accountContext).dbConnection;

    if (!ctx) {
      throw new AccountContextForbiddenError();
    }

    if (!this.dbPoolMap[accountContext.projectId]) {
      const pool = new Pool(ctx);
      try {
        await pool.query('SELECT 1');
        this.dbPoolMap[accountContext.projectId] = pool;
      } catch (err) {
        throw new Error('DB connect fail: ' + JSON.stringify(ctx) + ' , ' + JSON.stringify(accountContext));
      }
    }

    return this.dbPoolMap[accountContext.projectId];
  }

  public getContextsConfig() {
    return this.contextsConfig;
  }

  public getValidatedProjectId(accountContext?: IAccountContext): any {
    // Throw if not found
    this.getAccountContextConfig(accountContext);
    return accountContext.projectId;
  }

  public getMatchedHost(host?: string): any {
    return host ? this.hostsMap[host] : null;
  }

  private getAccountContextConfig(accountContext?: IAccountContext): any {
    if (!accountContext || !accountContext.projectId || accountContext.projectId === ''){
      throw new AccountContextForbiddenError();
    }
    const entry = this.contextsConfig[accountContext.projectId];
    // If there is a context then try to lookup the connection pool by mapping
    if (accountContext && accountContext.projectId && entry && entry.enabled) {
      // Check for wildcard or restrict to allowed hosts
      if (accountContext.host !== '*' && -1 === entry.hosts.indexOf('*') &&
          -1 === entry.hosts.indexOf(accountContext.host)) {
        throw new AccountContextForbiddenError();
      }
      // If no keys are required, then let it pass through
      if (
          !entry.keysRequired ||
          // Otherwise verify keys are correct
          (
            -1 !== entry.apiKeys.indexOf(accountContext.apiKey) ||
            -1 !== entry.serviceKeys.indexOf(accountContext.serviceKey)
          )
        ) {
        return entry;
      }
    }
    throw new AccountContextForbiddenError();
  }
}

let poolFactory = ContextFactory.getInstance();
export default poolFactory;
