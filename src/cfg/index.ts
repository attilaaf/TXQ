import * as dotenv from 'dotenv-safe';
import { IConfig } from '@interfaces/IConfig';

const envFound = dotenv.config();

if (!envFound) {
  throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

const config: IConfig = {
  appname: 'txq',
  network: process.env.NETWORK === 'testnet' ? 'testnet' : 'livenet', // Set the merchantapi.endpoints below for testnet
  baseurl: process.env.BASEURL || 'http://localhost:8097',
  env: process.env.NODE_ENV || 'development',
  api: {
    prefix: '/api',
    port: process.env.PORT || 3000,
    jwt: {
      secret: 'secret', // update before deployment
      expiresInHours: 24, // 24 hrs, update before deployment
    },
    bcrypt: {
      rounds: 8,
    },
  },
  queue: {
    // Max number of concurrent requests to sync tx status from merchantapi
    taskRequestConcurrency: process.env.MERCHANT_API_CONCURRENCY ? parseInt(process.env.MERCHANT_API_CONCURRENCY, 10) : 1,
    abandonedSyncTaskRescanSeconds: 300,       // How many seconds to rescan for missed tasks
    syncBackoff: {
      // 'full' or 'none'
      jitter: process.env.SYNC_JITTER ? process.env.SYNC_JITTER : 'none',
      // Exponential back off multiple
      timeMultiple: process.env.SYNC_BACKOFF_MULTIPLE ? parseInt(process.env.SYNC_BACKOFF_MULTIPLE, 10) : 2,
      // Initial start delay before first re-check
      startingDelay: process.env.SYNC_START_DELAY ? parseInt(process.env.SYNC_START_DELAY, 10) : 1000 * 60,
      // Max back off time. 60 Minutes is max
      maxDelay: process.env.SYNC_MAX_DELAY ? parseInt(process.env.SYNC_MAX_DELAY, 10) : 1000 * 60 * 60,
      // Max attempts before being put into 'dlq'
      numOfAttempts: process.env.SYNC_MAX_ATTEMPTS ? parseInt(process.env.SYNC_MAX_ATTEMPTS, 10) : 15
    },
    // If 'nosync' is true, then the server process always places new transactions into txsync.state=0 (sync_none)
    // In other words, then TXQ behaves as a datastore and makes no attempts to broadcast transations or settle status.
    nosync: process.env.NOSYNC && process.env.NOSYNC === 'true' ? true : false,
  },
  enableUpdateLogging: true,                  // Whether to log every update entity to the database
  merchantapi: {
    sendPolicy: 'ALL_FIRST_PRIORITY_SUCCESS', // 'SERIAL_BACKUP' | 'ALL_FIRST_PRIORITY_SUCCESS';
    statusPolicy: 'SERIAL_BACKUP',            // 'SERIAL_BACKUP'
    enableResponseLogging: true,              // Whether to log every request and response from merchantapi's to the database
    endpoints: {
      livenet: [
        {
          name: 'merchantapi.matterpool.io',
          url: 'https://merchantapi.matterpool.io',
          headers: {
            api_key: process.env.MERCHANTAPI_KEY_MATTERPOOL || null
          }
        },
        {
          name: 'mapi.taal.com',
          url: 'https://mapi.taal.com',
          headers: process.env.MERCHANTAPI_KEY_TAAL ? {
            Authorization: process.env.MERCHANTAPI_KEY_TAAL || null
          } : {}
        },
        {
          name: 'mempool.io',
          url: 'https://www.ddpurse.com/openapi',
          headers: {
            token: process.env.MERCHANTAPI_KEY_MEMPOOL || "561b756d12572020ea9a104c3441b71790acbbce95a6ddbf7e0630971af9424b"
          }
        }
      ],
      testnet: [
        {
          name: 'merchantapi-testnet.mattercloud.io',
          url: 'https://merchantapi-testnet.mattercloud.io',
          headers: {
            api_key: process.env.MERCHANTAPI_KEY_MATTERPOOL_TESTNET || null
          }
        },
        {
          name: 'merchantapi2.taal.com',
          url: 'https://merchantapi2.taal.com',
          headers: {
            Authorization: process.env.MERCHANTAPI_KEY_TAAL_TESTNET || null
          }
        },
      ]
    }
  },
  db: {
    host: 'localhost',
    user: 'postgres',
    database: 'txq_dev',
    password: 'postgres',
    port: 5432,
    max: 3,
    idleTimeoutMillis: 3000
  },
  logs: {
    level: process.env.LOG_LEVEL || 'debug',
    logRequestsEnabled: true,
    file: 'debug.log',
  },
  interceptors: [],
};

export default {
  ...config,
  ...require(`./${config.env}`).default,
};
