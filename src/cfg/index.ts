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
      secret: process.env.APP_SECRET || 'secret',   // update before deployment
      expiresInHours: 24,                           // 24 hrs, update before deployment
    },
    bcrypt: {
      rounds: 8,
    },
  },
  systemKey: process.env.SYSTEM_API_KEY || 'jsdfkj22494932secret',
  logs: {
    level: process.env.LOG_LEVEL || 'debug',
    logRequestsEnabled: true,
    file: 'debug.log',
  },
  enableDefault: true,
  interceptors: [],
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

  enableDbPollResync: process.env.ENABLE_DB_POLL_SYNC === 'true' || true,

  // Experimental Settings below
  filterBlockAgent: {
    enabled: process.env.ENABLE_FILTER_BLOCK_AGENT === 'true' ? true : false,
    filterBlockAgentStartHeight: process.env.ENABLE_ASSET_BLOCK_AGENT ? parseInt(process.env.ENABLE_ASSET_BLOCK_AGENT) : 606734,
    pollTime: process.env.FILTER_BLOCK_AGENT_POLL_TIME ? parseInt(process.env.FILTER_BLOCK_AGENT_POLL_TIME) : 20,
  },

  filterMempoolAgent: {
    enabled: process.env.ENABLE_FILTER_MEMPOOL_AGENT === 'true' ? true : false
  },
  
  assetFilterBlockAgent: {
    enabled: process.env.ENABLE_ASSET_BLOCK_AGENT === 'true' ? true : false
  },

  filterMempoolStreams: {
    enabled: process.env.ENABLE_FILTER_MEMPOOL_STREAMS === 'true' ? true : false,
    storage: process.env.ENABLE_FILTER_MEMPOOL_STREAMS_STORAGE || 'memory', // If 'null' used, then uses internal in memory array for SSE event tracking
    cleanupOlderTransactionsTimeMinutes: process.env.MEMPOOL_STREAMS_CLEANUP_MINS ? parseInt(process.env.MEMPOOL_STREAMS_CLEANUP_MINS) : 60,
    database: {
      host: process.env.DB_MEMPOOL_STREAMS_HOST,
      user: process.env.DB_MEMPOOL_STREAMS_USER,
      database: process.env.DB_MEMPOOL_STREAMS_DATABASE,
      password: process.env.DB_MEMPOOL_STREAMS_PASSWORD,
      port: process.env.DB_MEMPOOL_STREAMS_PORT ? parseInt(process.env.DB_MEMPOOL_STREAMS_PORT) : 5432,
      max: process.env.DB_MEMPOOL_STREAMS_MAX_CLIENTS ? parseInt(process.env.DB_MEMPOOL_STREAMS_MAX_CLIENTS) : 5,
      idleTimeoutMillis: process.env.DB_MEMPOOL_STREAMS_IDLE_TIMEOUT_MS ? parseInt(process.env.DB_MEMPOOL_STREAMS_IDLE_TIMEOUT_MS) : 10000
    }
  },
 
  assets: {
    'sa10': {
      coinbase: '51014001800176018801a901ac58011459790087635679597985587985615e79517920ea401e7cedf9c428fbf9b92b75c90dfdd354394e58195d58e82bf79a8de31d622102773aca113a3217b67a95d5b78b69bb6386ed443ea5decf0ba92c00d1792919212108dc7dc8b865cafc4cb5ff38624ba4c5385a3b8d7381f5bb49ba4a55963f10a20021606bfc5df21a9603c63d49e178b0620c9953d37c7ddeddfc12580925da43fcf0002100f0fc43da25095812fcddde7d7cd353990c62b078e1493dc603961af25dfc6b60615679557955795579557955795b795679aa616100790079517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e01007e81776157795679567956795679537956795479577995939521414136d08c5ed2bf3ba048afe6dcaebafeffffffffffffffffffffffffffffff0061517951795179517997527a75517a5179009f635179517993527a75517a685179777761527a75517a517951795296a0630079527994527a75517a68537982775279827754527993517993013051797e527e53797e57797e527e52797e5579517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7e56797e00797777777777777777777777776100795779ac77777777777777777761777777777777776169615e7961007901687f7700005279007f77517f75007901fd8763615379537f75517f77007901007e817761537a75527a527a5379535479937f75537f77527a75517a67007901fe8763615379557f75517f77007901007e817761537a75527a527a5379555479937f75557f77527a75517a67007901ff8763615379597f75517f77007901007e817761537a75527a527a5379595479937f75597f77527a75517a67615379517f75007f77007901007e817761537a75527a527a5379515479937f75517f77527a75517a686868517977777777617761007902a70c7f77007901247f75011379527901467f7501257f77ac69007900012480876361011179007901687f7501447f777761517a756861527902a50c7f75026a247e51797e01217e0113797e615f7900798277005179009c63675179519c63615279007901007e817761007951a2517960a19a63610150517993515179517951938000795179827751947f75007f7777777761527a75517a675279519c51790281009c9a6361014f515179517951938000795179827751947f75007f7777777761527a75517a686875675179014c9f63615179515179517951938000795179827751947f75007f777777776153797e517a7567517902ff00a163014c615279515179517951938000795179827751947f75007f77777777617e53797e517a7567517903ffff00a163014d615279525179517951938000795179827751947f75007f77777777617e53797e517a7567014e615279545179517951938000795179827751947f75007f77777777617e53797e517a7568686868680079777777617e61011279616100790079827751795179012c947f7551790134947f77777761007901007e817761776100795879806152790079827700517902fd009f63615179515179517951938000795179827751947f75007f7777777761517a75675179030000019f6301fd615279525179517951938000795179827751947f75007f77777777617e517a756751790500000000019f6301fe615279545179517951938000795179827751947f75007f77777777617e517a75675179090000000000000000019f6301ff615279585179517951938000795179827751947f75007f77777777617e517a7568686868007953797e777777617e77776161610111795b795a797e57797e51797e5b797e59797e776101117900795979806152790079827700517902fd009f63615179515179517951938000795179827751947f75007f7777777761517a75675179030000019f6301fd615279525179517951938000795179827751947f75007f77777777617e517a756751790500000000019f6301fe615279545179517951938000795179827751947f75007f77777777617e517a75675179090000000000000000019f6301ff615279585179517951938000795179827751947f75007f77777777617e517a7568686868007953797e777777617e7777617eaa61011279007982775179517958947f7551790128947f777777618777777777777777777777777777777777777777776759795187635679597985587985615d79517920ea401e7cedf9c428fbf9b92b75c90dfdd354394e58195d58e82bf79a8de31d622102773aca113a3217b67a95d5b78b69bb6386ed443ea5decf0ba92c00d1792919212108dc7dc8b865cafc4cb5ff38624ba4c5385a3b8d7381f5bb49ba4a55963f10a20021606bfc5df21a9603c63d49e178b0620c9953d37c7ddeddfc12580925da43fcf0002100f0fc43da25095812fcddde7d7cd353990c62b078e1493dc603961af25dfc6b60615679557955795579557955795b795679aa616100790079517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e01007e81776157795679567956795679537956795479577995939521414136d08c5ed2bf3ba048afe6dcaebafeffffffffffffffffffffffffffffff0061517951795179517997527a75517a5179009f635179517993527a75517a685179777761527a75517a517951795296a0630079527994527a75517a68537982775279827754527993517993013051797e527e53797e57797e527e52797e5579517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7e56797e00797777777777777777777777776100795779ac77777777777777777761777777777777776169615d7961007901687f7700005279007f77517f75007901fd8763615379537f75517f77007901007e817761537a75527a527a5379535479937f75537f77527a75517a67007901fe8763615379557f75517f77007901007e817761537a75527a527a5379555479937f75557f77527a75517a67007901ff8763615379597f75517f77007901007e817761537a75527a527a5379595479937f75597f77527a75517a67615379517f75007f77007901007e817761537a75527a527a5379515479937f75517f77527a75517a6868685179777777776177616079517902a70c7f7701467f7501257f77ac6961615f79587957797e54797e51797e58797e56797e7761615f79616100790079827751795179012c947f7551790134947f77777761007901007e817761776100795679806152790079827700517902fd009f63615179515179517951938000795179827751947f75007f7777777761517a75675179030000019f6301fd615279525179517951938000795179827751947f75007f77777777617e517a756751790500000000019f6301fe615279545179517951938000795179827751947f75007f77777777617e517a75675179090000000000000000019f6301ff615279585179517951938000795179827751947f75007f77777777617e517a7568686868007953797e777777617e77776161615e79597958797e55797e51797e59797e57797e77615e7900795779806152790079827700517902fd009f63615179515179517951938000795179827751947f75007f7777777761517a75675179030000019f6301fd615279525179517951938000795179827751947f75007f77777777617e517a756751790500000000019f6301fe615279545179517951938000795179827751947f75007f77777777617e517a75675179090000000000000000019f6301ff615279585179517951938000795179827751947f75007f77777777617e517a7568686868007953797e777777617e7777617eaa615f79007982775179517958947f7551790128947f77777761877777777777777777777777777777777777670068686a24000000000000000000000000000000000000000000000000000000000000000000000000',
      code: '51014001800176018801a901ac58011459790087635679597985587985615e79517920ea401e7cedf9c428fbf9b92b75c90dfdd354394e58195d58e82bf79a8de31d622102773aca113a3217b67a95d5b78b69bb6386ed443ea5decf0ba92c00d1792919212108dc7dc8b865cafc4cb5ff38624ba4c5385a3b8d7381f5bb49ba4a55963f10a20021606bfc5df21a9603c63d49e178b0620c9953d37c7ddeddfc12580925da43fcf0002100f0fc43da25095812fcddde7d7cd353990c62b078e1493dc603961af25dfc6b60615679557955795579557955795b795679aa616100790079517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e01007e81776157795679567956795679537956795479577995939521414136d08c5ed2bf3ba048afe6dcaebafeffffffffffffffffffffffffffffff0061517951795179517997527a75517a5179009f635179517993527a75517a685179777761527a75517a517951795296a0630079527994527a75517a68537982775279827754527993517993013051797e527e53797e57797e527e52797e5579517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7e56797e00797777777777777777777777776100795779ac77777777777777777761777777777777776169615e7961007901687f7700005279007f77517f75007901fd8763615379537f75517f77007901007e817761537a75527a527a5379535479937f75537f77527a75517a67007901fe8763615379557f75517f77007901007e817761537a75527a527a5379555479937f75557f77527a75517a67007901ff8763615379597f75517f77007901007e817761537a75527a527a5379595479937f75597f77527a75517a67615379517f75007f77007901007e817761537a75527a527a5379515479937f75517f77527a75517a686868517977777777617761007902a70c7f77007901247f75011379527901467f7501257f77ac69007900012480876361011179007901687f7501447f777761517a756861527902a50c7f75026a247e51797e01217e0113797e615f7900798277005179009c63675179519c63615279007901007e817761007951a2517960a19a63610150517993515179517951938000795179827751947f75007f7777777761527a75517a675279519c51790281009c9a6361014f515179517951938000795179827751947f75007f7777777761527a75517a686875675179014c9f63615179515179517951938000795179827751947f75007f777777776153797e517a7567517902ff00a163014c615279515179517951938000795179827751947f75007f77777777617e53797e517a7567517903ffff00a163014d615279525179517951938000795179827751947f75007f77777777617e53797e517a7567014e615279545179517951938000795179827751947f75007f77777777617e53797e517a7568686868680079777777617e61011279616100790079827751795179012c947f7551790134947f77777761007901007e817761776100795879806152790079827700517902fd009f63615179515179517951938000795179827751947f75007f7777777761517a75675179030000019f6301fd615279525179517951938000795179827751947f75007f77777777617e517a756751790500000000019f6301fe615279545179517951938000795179827751947f75007f77777777617e517a75675179090000000000000000019f6301ff615279585179517951938000795179827751947f75007f77777777617e517a7568686868007953797e777777617e77776161610111795b795a797e57797e51797e5b797e59797e776101117900795979806152790079827700517902fd009f63615179515179517951938000795179827751947f75007f7777777761517a75675179030000019f6301fd615279525179517951938000795179827751947f75007f77777777617e517a756751790500000000019f6301fe615279545179517951938000795179827751947f75007f77777777617e517a75675179090000000000000000019f6301ff615279585179517951938000795179827751947f75007f77777777617e517a7568686868007953797e777777617e7777617eaa61011279007982775179517958947f7551790128947f777777618777777777777777777777777777777777777777776759795187635679597985587985615d79517920ea401e7cedf9c428fbf9b92b75c90dfdd354394e58195d58e82bf79a8de31d622102773aca113a3217b67a95d5b78b69bb6386ed443ea5decf0ba92c00d1792919212108dc7dc8b865cafc4cb5ff38624ba4c5385a3b8d7381f5bb49ba4a55963f10a20021606bfc5df21a9603c63d49e178b0620c9953d37c7ddeddfc12580925da43fcf0002100f0fc43da25095812fcddde7d7cd353990c62b078e1493dc603961af25dfc6b60615679557955795579557955795b795679aa616100790079517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e01007e81776157795679567956795679537956795479577995939521414136d08c5ed2bf3ba048afe6dcaebafeffffffffffffffffffffffffffffff0061517951795179517997527a75517a5179009f635179517993527a75517a685179777761527a75517a517951795296a0630079527994527a75517a68537982775279827754527993517993013051797e527e53797e57797e527e52797e5579517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7e56797e00797777777777777777777777776100795779ac77777777777777777761777777777777776169615d7961007901687f7700005279007f77517f75007901fd8763615379537f75517f77007901007e817761537a75527a527a5379535479937f75537f77527a75517a67007901fe8763615379557f75517f77007901007e817761537a75527a527a5379555479937f75557f77527a75517a67007901ff8763615379597f75517f77007901007e817761537a75527a527a5379595479937f75597f77527a75517a67615379517f75007f77007901007e817761537a75527a527a5379515479937f75517f77527a75517a6868685179777777776177616079517902a70c7f7701467f7501257f77ac6961615f79587957797e54797e51797e58797e56797e7761615f79616100790079827751795179012c947f7551790134947f77777761007901007e817761776100795679806152790079827700517902fd009f63615179515179517951938000795179827751947f75007f7777777761517a75675179030000019f6301fd615279525179517951938000795179827751947f75007f77777777617e517a756751790500000000019f6301fe615279545179517951938000795179827751947f75007f77777777617e517a75675179090000000000000000019f6301ff615279585179517951938000795179827751947f75007f77777777617e517a7568686868007953797e777777617e77776161615e79597958797e55797e51797e59797e57797e77615e7900795779806152790079827700517902fd009f63615179515179517951938000795179827751947f75007f7777777761517a75675179030000019f6301fd615279525179517951938000795179827751947f75007f77777777617e517a756751790500000000019f6301fe615279545179517951938000795179827751947f75007f77777777617e517a75675179090000000000000000019f6301ff615279585179517951938000795179827751947f75007f77777777617e517a7568686868007953797e777777617e7777617eaa615f79007982775179517958947f7551790128947f7777776187777777777777777777777777777777777767006868',
      height: 658607,
    }
  } 
};

export default {
  ...config,
  ...require(`./${config.env}`).default,
};
