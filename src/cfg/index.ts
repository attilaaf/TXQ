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
    port: process.env.PORT || 3000,
    jwt: {
      secret: 'secret', // update before deployment
      expiresInHours: 24, // 24 hrs, update before deployment
    },
    bcrypt: {
      rounds: 8,
    },
  },
  enableDefault: true,
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
