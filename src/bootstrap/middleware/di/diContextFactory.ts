import cfg from '../../../cfg';
import { Pool } from 'pg';
import { IAccountContext } from '@interfaces/IAccountContext';
import { contextsConfig } from "../../../cfg/config.js";
import AccessForbiddenError from '../../../services/error/AccessForbiddenError';
import { ISystemContext } from '@interfaces/ISystemContext';
import * as fs from 'fs';
import InvalidParamError from '../../../services/error/InvalidParamError';
import { IAccountContextsConfig } from '@interfaces/IConfig';

const cacheConfigPath = './config.cache.json';

const jsonFileReader = async (filePath) => {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, fileData: any) => {
        if (err) {
          return reject(err);
        }
        try {
            const object = JSON.parse(fileData);
            return resolve(object);
        } catch(err) {
          console.log('jsonFileReader', err);
          return reject(null);
        }
      });
    });
};

const jsonFileWriter = async (filePath, data) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, JSON.stringify(data, null, 4), 'utf8', (err) => {
            if (err){
                console.log('jsonFileWriter', err);
                reject(err);
            }
            else {
              resolve();
            }
        });
    });
};


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
      ContextFactory.instance.initialize();
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
  private dbCfgPool: any;
  /**
   * The Singleton's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */
  private constructor() {
    this.contextsConfig = contextsConfig;
  }

  public loadCtx(ctxCfg: any) {

    this.validateContext(ctxCfg);

    this.hostsMap = {};
    // Populate map of which projects are mapped to which hosts
    // Note that the newest (latest appeariing in config) takes precedence.
    for (const entry in ctxCfg) {
      if (!ctxCfg.hasOwnProperty(entry)) {
        continue;
      }
      if (!ctxCfg[entry].enabled) {
        continue;
      }
      for (const host of ctxCfg[entry].hosts) {
        if (!this.hostsMap[host]) {
          this.hostsMap[host] = entry;
        }
      }
    }
    this.contextsConfig = ctxCfg;
    jsonFileWriter(cacheConfigPath, this.contextsConfig);

  }

  public getContexts(systemContext: ISystemContext) {
    if (systemContext.systemKey && systemContext.systemKey === cfg.systemKey) {
      const copied = {};
      for (const entry in this.contextsConfig) {
        if (!this.contextsConfig.hasOwnProperty(entry)) {
          continue;
        }
        const copy = Object.assign({}, this.contextsConfig[entry]);
        delete copy.dbConnection;
        delete copy.apiKeys;
        delete copy.serviceKeys;
        copied[entry] = copy;
      }
      return copied;
    }
    throw new AccessForbiddenError();
  }

  public async initialize() {
    // Always load the cache first if available, if not then default to config.js
    try {
      await jsonFileReader(cacheConfigPath)
      .then(async (data: any) => {
          if (data) {
              this.loadCtx(data);
              return;
          }
      });
    } catch (err) {
      console.log('Cache config file error, falling back to default config.js', err);
      if (cfg.configMode === 'file' || cfg.configMode === 'database') {
        this.loadCtx(contextsConfig);
      }
    }

    // Try to load from database if it's also set
    if (cfg.configMode === 'database') {
      this.dbCfgPool = new Pool(cfg.databaseModeConfig);
      this.dbConfigTimerStart(true);
    } else if (cfg.configMode === 'file') {
      // Do nothing since we always default to file
    }
    else {
      throw new Error('Invalid configMode');
    }
  }

  public dbConfigTimerStart(startNow?: boolean) {
    const CYCLE_TIME_SECONDS = startNow ? 0 : 20;
		setTimeout(async () => {
      console.log('Updating config...');
      try {
        const constructedConfigContext = {};
        const projects = await this.dbCfgPool.query('SELECT * FROM project');
        console.log('Project rows', projects.rows.length);
        let c = 0;
        for (const project of projects.rows) {
          if (!project.service_txq_db ||
              !project.service_txq_config ||
              !project.service_txq_config.enabled ||
              !project.service_txq_config.hosts) {
            continue;
          }
          constructedConfigContext[project.name] = project.service_txq_config;
          constructedConfigContext[project.name].dbConnection = project.service_txq_db;
          constructedConfigContext[project.name].apiKeys = [ project.api_key ];
          constructedConfigContext[project.name].serviceKeys = [ project.service_key ];
          c++;
        }
        // Update to latest config
        this.contextsConfig = Object.assign(this.contextsConfig, {}, constructedConfigContext);
        console.log('contextsConfig db counts', c);
        this.loadCtx(this.contextsConfig);
			} catch (err) {
        console.log('Err', err.toString(), err.stack);
      } finally {
				this.dbConfigTimerStart();
			}
		}, 1000 * CYCLE_TIME_SECONDS);
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

    throw new AccessForbiddenError();
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
    if (!this.dbPoolMap[accountContext.projectId]) {
      const pool = new Pool(ctx);
      try {
        await pool.query('SELECT 1');
        this.dbPoolMap[accountContext.projectId] = pool;
      } catch (err) {
        console.log('db connect fail', accountContext.projectId, err, err.stack);
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
      throw new AccessForbiddenError();
    }
    const entry = this.contextsConfig[accountContext.projectId];
    // If there is a context then try to lookup the connection pool by mapping
    if (accountContext && accountContext.projectId && entry && entry.enabled) {
      // Check for wildcard or restrict to allowed hosts
      if (accountContext.host !== '*' && -1 === entry.hosts.indexOf('*') &&
          -1 === entry.hosts.indexOf(accountContext.host)) {
        throw new AccessForbiddenError();
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
    throw new AccessForbiddenError();
  }
  private validateContext(ctx: IAccountContextsConfig) {
    if (!ctx) {
      throw new InvalidParamError();
    }
    let counter = 0;
    for (const entry  in ctx) {
      if (!ctx.hasOwnProperty(entry)) {
        continue;
      }
      counter++;

      if (!ctx[entry].queue) {
        throw new InvalidParamError();
      }
      if (!ctx[entry].merchantapi) {
        throw new InvalidParamError();
      }
      if (!ctx[entry].hosts) {
        throw new InvalidParamError();
      }

      if (!ctx[entry].dbConnection) {
        throw new InvalidParamError();
      }
    }

    if (!counter) {
      throw new InvalidParamError();
    }
  }
}

let poolFactory = ContextFactory.getInstance();
export default poolFactory;
