import * as dotenv from 'dotenv-safe';
import { IConfig } from '@interfaces/IConfig';

const envFound = dotenv.config();

if (!envFound) {
  throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

const config: IConfig = {
  appname: 'txq',
  network: process.env.NETWORK === 'testnet' ? 'testnet' : 'livenet',
  baseurl: process.env.BASEURL || 'http://localhost:8097',
  env: process.env.NODE_ENV || 'development',
  api: {
    prefix: '/api',
    port: process.env.PORT || 8097,
    jwt: {
      secret: 'secret', // update before deployment
      expiresInHours: 24, // 24 hrs, update before deployment
    },
    bcrypt: {
      rounds: 8,
    },
  },
  enableDefault: true,
  configMode: process.env.CONFIG_MODE || 'file',
  databaseModeConfig: {
    host: process.env.DBCFG_HOST,
    user: process.env.DBCFG_USER,
    database: process.env.DBCFG_DATABASE,
    password: process.env.DBCFG_PASSWORD,
    port: process.env.DBCFG_PORT || 5432,
    max: process.env.DBCFG_MAX_CLIENTS || 2,
    idleTimeoutMillis: process.env.DBCFG_IDLE_TIMEOUT_MS || 10000
  },
  systemKey: process.env.SYSTEM_API_KEY || 'jsdfkj22494932secret',
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
