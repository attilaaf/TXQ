import 'reflect-metadata';
//import 'module-alias/register';
import * as express from 'express';
import * as SetTimeZone from 'set-tz';
import { middlewareLoader } from './middleware';
import "../services/tx/index";
import "../services/txsync/index";
import "../services/txout/index";
import "../services/txmeta/index";
import "../services/txin/index";
import "../services/queue/index";
import "../services/merchantapilog/index";
import "../services/spend/index";
import "../services/event/index";
import "../services/txoutgroup/index";
import "../services/updatelog/index";

import "../services/helpers/MerchantRequestor";

import "../services/use_cases/tx/GetTx";
import "../services/use_cases/tx/SaveTxs";
import "../services/use_cases/tx/SyncTxStatus";
import "../services/use_cases/tx/GetTxsForSync";
import "../services/use_cases/tx/GetTxsByChannel";
import "../services/use_cases/tx/EnqInitialTxsForSync";
import "../services/use_cases/tx/IncrementTxRetries";
import "../services/use_cases/tx/UpdateTxDlq";

import "../services/use_cases/queue/GetTxsDlq";
import "../services/use_cases/queue/ResyncTx";
import "../services/use_cases/queue/GetQueueStats";
import "../services/use_cases/queue/GetTxsPending";
import "../services/use_cases/queue/GetTxsBySyncState";

import "../services/use_cases/spends/GetTxout";
import "../services/use_cases/spends/GetTxoutsByAddress";
import "../services/use_cases/spends/GetTxoutsByScriptHash";
import "../services/use_cases/spends/GetUtxosByAddress";
import "../services/use_cases/spends/GetUtxosByScriptHash";
import "../services/use_cases/spends/GetTxoutsByGroup";
import "../services/use_cases/spends/GetUtxosByGroup";
import "../services/use_cases/spends/GetTxoutsByOutpointArray";
import "../services/use_cases/spends/GetBalanceByAddresses";
import "../services/use_cases/spends/GetBalanceByScriptHashes";
import "../services/use_cases/spends/GetBalanceByGroup";
import "../services/use_cases/events/ConnectChannelClientSSE";
import "../services/use_cases/txoutgroup/GetTxoutgroupByName";
import "../services/use_cases/txoutgroup/AddGroupScriptIds";
import "../services/use_cases/txoutgroup/DeleteGroupScriptIds";

SetTimeZone('UTC');

const createExpressInstance = async () => {
  let app = express();
  await middlewareLoader(app);

  app.get('/', function(req, res) {
    res.json({
      hello: 'world'
    });
  });

  return app;
}

export{ createExpressInstance as createExpress }


