
var cfg = {
  default: {
    enabled: true,
    network: 'livenet',
    keysRequired: false,
    apiKeys: ["somekey1", "somekey2"],
    serviceKeys: ["servicekey1"],
    hosts: ["*", "localhost:8097", "myhostname.com", "api.somewhere1332.io"],
    queue: {
      // Max number of concurrent requests to sync tx status from merchantapi
      taskRequestConcurrency: 1,
      abandonedSyncTaskRescanSeconds: 3600,       // How many seconds to rescan for missed tasks
      syncBackoff: {
        // 'full' or 'none'
        jitter: 'full',
        // Exponential back off multiple
        timeMultiple: 2,
        // Initial start delay before first status check
        startingDelay: 1000 * 60,
        // Max back off time 30 Minutes is max
        maxDelay: 1000 * 30 * 60,
        // Max attempts before being put into 'dlq'
        numOfAttempts: 25
      },
      // If 'nosync' is true, then the server process always places new transactions into txsync.state=0 (sync_none)
      // In other words, then TXQ behaves as a datastore and makes no attempts to broadcast transations or settle status.
      nosync: false,
    },
    // This is the database connection.
    // Install the schema at src/database/schema-latest.sql
    dbConnection: {
        host: "localhost",
        user: "postgres",
        database: "txq_dev",
        password: "postgres",
        port: 5432,
        max: 3,
        idleTimeoutMillis: 10000
    },
    // MAPI configuration setttings
    merchantapi: {
      sendPolicy: "RACE_FIRST_SUCCESS",
      statusPolicy: "RACE_FIRST_SUCCESS",            // "SERIAL_BACKUP"
      enableResponseLogging: true,              // Whether to log every request and response from merchantapi"s to the database
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
            name: "mempool.io",
            url: "https://www.ddpurse.com/openapi",
            headers: process.env.MERCHANTAPI_KEY_MEMPOOL ? {
              Authorization: process.env.MERCHANTAPI_KEY_MEMPOOL || null
            } : {}
          }
        ],
        testnet: [
          {
            name: "merchantapi2.taal.com",
            url: "https://merchantapi2.taal.com",
            headers: process.env.MERCHANTAPI_KEY_TAAL_TESTNET ? {
              Authorization: process.env.MERCHANTAPI_KEY_TAAL_TESTNET || null
            } : {}
          }
        ]
      }
    }
  }
};

module.exports.contextsConfig = cfg;
