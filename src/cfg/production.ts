import { IConfig } from '@interfaces/IConfig';
const config: IConfig = {
  api: {
    port: process.env.PORT || 9000,
  },
};
export default config;