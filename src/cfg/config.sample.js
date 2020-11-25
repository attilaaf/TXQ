
var cfg = {
  default: {
    enabled: true,
    network: 'livenet',
    keysRequired: false,
    apiKeys: ["apiKey1", "apiKey2"],
    serviceKeys: ["service1"],
    hosts: ["*", "localhost:8097", "public.somehost135322.com"],
    queue: {
      // Max number of concurrent requests to sync tx status from merchantapi
      taskRequestConcurrency: 3,
      abandonedSyncTaskRescanSeconds: 3600,       // How many seconds to rescan for missed tasks
      syncBackoff: {
        // 'full' or 'none'
        jitter: 'full',
        // Exponential back off multiple
        timeMultiple: 2,
        // Initial start delay before first re-check
        startingDelay: 1000 * 60,
        // Max back off time. 60 Minutes is max
        maxDelay: 1000 * 60 * 60,
        // Max attempts before being put into 'dlq'
        numOfAttempts: 20
      },
      // If 'nosync' is true, then the server process always places new transactions into txsync.state=0 (sync_none)
      // In other words, then TXQ behaves as a datastore and makes no attempts to broadcast transations or settle status.
      nosync: false,
    },
    dbConnection: {
        host: "localhost",
        user: "postgres",
        database: "txq_dev",
        password: "postgres",
        port: 5432,
        max: 3,
        idleTimeoutMillis: 10000
    },
    merchantapi: {
      sendPolicy: "RACE_FIRST_SUCCESS",
      statusPolicy: "RACE_FIRST_SUCCESS",            // "SERIAL_BACKUP"
      enableResponseLogging: true,                   // Whether to log every request and response from merchantapi"s to the database
      endpoints: {
        livenet: [
          {
            name: "mapi.taal.com",
            url: "https://mapi.taal.com",
            headers: process.env.MERCHANTAPI_KEY_TAAL ? {
              Authorization: process.env.MERCHANTAPI_KEY_TAAL || null
            } : {}
          },
          {
            name: "mapi.mattercloud.io",
            url: "https://mapi.mattercloud.io",
            headers: {
              api_key: process.env.MERCHANTAPI_KEY_MATTERPOOL || null
            }
          },
          {
            name: "mempool.io",
            url: "https://www.ddpurse.com/openapi",
            headers: {
              token: process.env.MERCHANTAPI_KEY_MEMPOOL || null
            }
          }
        ],
        testnet: [
          {
            name: "merchantapi-testnet.mattercloud.io",
            url: "https://merchantapi-testnet.mattercloud.io",
            headers: {
              api_key: process.env.MERCHANTAPI_KEY_MATTERPOOL_TESTNET || null
            }
          },
          {
            name: "merchantapi2.taal.com",
            url: "https://merchantapi2.taal.com",
            headers: {
              Authorization: process.env.MERCHANTAPI_KEY_TAAL_TESTNET || null
            }
          },
        ]
      }
    }
  },
};


module.exports.contextsConfig = cfg;
