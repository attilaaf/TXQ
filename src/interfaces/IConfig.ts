export interface ILog {
  level: string;
  logRequestsEnabled: boolean;
  file?: string;
}

export interface IJwt {
  secret: string;
  expiresInHours?: number;
}

export interface IApi {
  prefix?: string;
  port?: number | string;
  jwt?: IJwt;
  bcrypt?: Record<string, number>;
}

/**
 * Configure merchantapi miner endpoints
 * Pass in any required headers if needed for auth
 */
export interface IMerchantApiEndpointConfig {
  name: string;
  url: string;
  headers?: any;
}

export interface IMerchantApiEndpointGroupConfig {
  livenet: IMerchantApiEndpointConfig[];
  testnet: IMerchantApiEndpointConfig[];
}

export interface IMerchantConfig {
  sendPolicy: string | 'SERIAL_BACKUP' | 'ALL_FIRST_PRIORITY_SUCCESS' | 'RACE_FIRST_SUCCESS';
  statusPolicy: string | 'SERIAL_BACKUP' | 'RACE_FIRST_SUCCESS';
  enableResponseLogging: boolean;
  enableProxy?: boolean;
  endpoints: IMerchantApiEndpointGroupConfig;
}

export interface ISyncQueue {
  taskRequestConcurrency: number;
  abandonedSyncTaskRescanSeconds: number;
  syncBackoff: {
    startingDelay: number;
    maxDelay: number;
    jitter: 'full' | 'none';
    timeMultiple: number;
    numOfAttempts: number;
  };
  nosync: boolean;
}

export interface IDBConnection {
  host?: string;
  user?: string;
  database?: string;
  password?: string;
  port?: number;
  max?: number;
  idleTimeoutMillis?: number;
}

export interface IDBMappings {
  [key: string]: {
    apiKeys: string[],
    dbConnection: IDBConnection,
    assetDbConnection?: IDBConnection
  };
}

export interface IAccountContextConfig {
  enabled?: boolean;
  keysRequired: boolean;
  apiKeys: string[];
  serviceKeys: string[];
  hosts: string[];
  queue: ISyncQueue;
  dbConnection: IDBConnection;
  merchantapi?: IMerchantConfig;
}

export interface IAccountContextsConfig {
  [key: string]: IAccountContextConfig;
}

export interface IBitcoind {
   host: string;
   port: number;
   password: string;
   user: string;
   network: string;
   peerPort: number;
}
 
export interface IConfig {
  appname?: string;
  network?: 'testnet' | 'mainnet' | 'livenet' | undefined;
  baseurl?: string;
  bitcoinds?: IBitcoind[];
  enableDefault?: boolean;
  env?: string;
  enableUpdateLogging?: boolean;
  configMode?: string; // 'file' | 'database';
  databaseModeConfig?: any;
  enableDbPollResync?: boolean;
  filterBlockAgent?: {
    enabled: boolean;
    filterBlockAgentStartHeight: number;
    pollTime: number;
  },
  filterMempoolAgent?: {
    enabled: boolean;
  },
  assetFilterBlockAgent?: {
    enabled: boolean;
  },
  filterMempoolStreams?: {
    enabled: boolean;
    storage: string | 'database';
    cleanupOlderTransactionsTimeMinutes?: number;
    database: {
      host: string;
      user: string;
      database: string;
      password: string;
      port: number;
      max: number;
      idleTimeoutMillis: number;
    }
  },
  systemKey?: string;
  api?: IApi;
  logs?: ILog;
  interceptors?: any;
  assets?: any;
}

