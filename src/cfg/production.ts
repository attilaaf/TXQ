import { IConfig } from '@interfaces/IConfig';
const config: IConfig = {
  api: {
    port: process.env.PORT || 9000,
  },
  db: {
    type: 'DIRECT',
    main: {
      host: `${process.env.DB_HOST}`,
      user: `${process.env.DB_USER}`,
      database: `${process.env.DB_DATABASE}`,
      password: `${process.env.DB_PASSWORD}`,
      port: process.env.DB_PORT || 3000,
      max: process.env.DB_MAX_CLIENTS, // max number of clients in the pool
      idleTimeoutMillis: process.env.DB_IDLE_TIMEOUT_MS,
    },
  },
};
export default config;