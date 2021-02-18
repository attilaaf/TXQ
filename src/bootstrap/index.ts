import 'reflect-metadata';
import { createServer } from 'http';
import * as SetTimeZone from 'set-tz';
import { handleServerExit, handleExceptions } from './middleware/errorMiddleware';
import { Container } from 'typedi';
import Config from './../cfg';
import * as ws from 'ws';
import "../services/tx/index";
import "../services/txsync/index";
import "../services/txout/index";
import "../services/txmeta/index";
import "../services/txin/index";
import "../services/queue/index";
import "../services/merchantapilog/index";
import "../services/event/index";
import "../services/txoutgroup/index";
import "../services/updatelog/index";
import "../services/blockheader/index";
import "../services/txfilter/index";
import "../services/txstore/index";
import "../services/txfiltermanager/index";
import "../services/txfiltermatcher/index";
import "../services/outpointmonitor/index";
import "../services/stats/index";
import "../services/mempoolfiltertxs/index";
 
import "../services/helpers/MerchantRequestor";
import "../services/use_cases/proxy/GetMapiTxStatus";
import "../services/use_cases/proxy/GetMapiTxFeeQuote";
import "../services/use_cases/proxy/PushMapiTx";

import "../services/use_cases/tx/GetTx";
import "../services/use_cases/tx/SaveTxs";
import "../services/use_cases/tx/SaveTxsFromBlock";
import "../services/use_cases/tx/SaveTxsFromMempool";
import "../services/use_cases/tx/SyncTxStatus";
import "../services/use_cases/tx/GetTxsForSync";
import "../services/use_cases/tx/GetTxsByChannel";
import "../services/use_cases/tx/EnqInitialTxsForSync";
import "../services/use_cases/tx/IncrementTxRetries";
import "../services/use_cases/tx/UpdateTxDlq";

import "../services/use_cases/system/GetSystemStatus";
import "../services/use_cases/txfilters/GetTxFilters";
import "../services/use_cases/txfilters/GetTxFiltersByGroupName";
import "../services/use_cases/txfilters/CreateTxFilter";

import "../services/use_cases/queue/GetTxsDlq";
import "../services/use_cases/queue/RequeueTxsDlq";
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
import "../services/use_cases/spends/GetTxHistoryByScriptHashOrAddressArray";
import "../services/use_cases/spends/GetUtxoCountByScriptHashOrAddress";
import "../services/use_cases/spends/GetUtxoCountByGroup";
import "../services/use_cases/spends/GetUnspentTxidsByScriptHash";


import ConnectMempoolClientWebSocket from "../services/use_cases/events/ConnectMempoolClientWebSocket";
import "../services/use_cases/events/ConnectChannelClientSSE";
import "../services/use_cases/events/ConnectMempoolClientSSE";
import "../services/use_cases/txoutgroup/GetTxoutgroupByName";
import "../services/use_cases/txoutgroup/GetTxoutgroupListByScriptid";
import "../services/use_cases/txoutgroup/AddGroupScriptIds";
import "../services/use_cases/txoutgroup/DeleteGroupScriptIds";

import "../services/use_cases/assets/GetTxoutsByScriptHashOrAddressArray";
import "../services/use_cases/assets/GetUtxosByScriptHashOrAddressArray";
import "../services/use_cases/assets/GetBalanceByScriptHashOrAddressArray";
import "../services/use_cases/assets/GetAssetHistoryByScriptHashOrAddressArray";

import "../services/use_cases/txstore/GetTxStore";
import "../services/use_cases/txstore/GetTxStoreRevisions";
import "../services/use_cases/txstore/SaveTxStore";

import "../services/use_cases/stats/GetStats";

import "../services/use_cases/agents/filteragent/IngestFilterBlock";
import "../services/use_cases/agents/filteragent/ReorgFilterBlock";
import "../services/use_cases/utils/CheckAndUpgradeDbs";

import EnqInitialTxsForSyncAllProjects from '../services/use_cases/tx/EnqInitialTxsForSyncAllProjects';
import StartAssetAgent from '../services/use_cases/agents/StartAssetAgent';
import StartFilterTrackerAgent from '../services/use_cases/agents/StartFilterTrackerAgent';
 
console.log('process.env.NODE_ENV', process.env.NODE_ENV);
SetTimeZone('UTC');

import cfg from './../cfg';
import { createExpress } from './express-factory';
import StartMempoolFilterAgent from '../services/use_cases/agents/StartMempoolFilterAgent';
import CheckAndUpgradeDbs from '../services/use_cases/utils/CheckAndUpgradeDbs';
 
async function startServer() {
  let app = await createExpress();
  let server = createServer(app);
 
  app.get('/', function(req, res) {
    res.json({
      hello: 'world'
    });
  });
  server.listen(Config.api.port);

  process.on('unhandledRejection', handleExceptions);
  process.on('uncaughtException', handleExceptions);
  process.on('SIGINT', handleServerExit('SIGINT', server));
  process.on('SIGTERM', handleServerExit('SIGTERM', server));
  // Set up a headless websocket server that prints any
  // events that come in.
  function noop() {}
  function heartbeat() {
    this.isAlive = true;
  }
  const wss = new ws.Server({ noServer: true });
  wss.on('connection', (socket, req) => {
    let uc = Container.get(ConnectMempoolClientWebSocket);
    uc.run(
      {
        req, 
        socket
      }
    );
  });

  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, socket => {
      wss.emit('connection', socket, request);
    });
  });
  
  return app;
}

startServer();
 
/**
 * Check ever N minutes for jobs that are in DB in 'pending' that may need to be enqueued
 */
async function startPendingTaskPoller() {
  let enqInitialTxsForSync = Container.get(EnqInitialTxsForSyncAllProjects);
  enqInitialTxsForSync.run();
}
 
if (cfg.enableDbPollResync) {
  console.log('enableDbPollResync is true');
  setTimeout(() => {
    startPendingTaskPoller();
  }, process.env.ENABLE_DB_POLL_SYNC_TIME ? parseInt(process.env.ENABLE_DB_POLL_SYNC_TIME) * 1000 : 300 * 1000)
}
 
if (cfg.enableAssetBlockAgent) {
  console.log('enableAssetBlockAgent is true');
  setTimeout(() => {
    let uc = Container.get(StartAssetAgent);
    uc.run();
  }, 1000);
}
 
if (cfg.filterBlockAgent.enabled) {
  console.log('cfg.filterBlockAgent.enabled is true');
  setTimeout(() => {
    let uc = Container.get(StartFilterTrackerAgent);
    uc.run();
  }, 1000);
}

if (cfg.filterMempoolStreams.enabled || cfg.filterMempoolAgent.enabled) {
  console.log('cfg.filterMempoolStreams.enabled || cfg.filterMempoolAgent.enabled is true');

  setTimeout(() => {
    let uc = Container.get(StartMempoolFilterAgent);
    uc.run();
  }, 1000);
}

 
if (false) {

  setTimeout(() => {
    let uc = Container.get(CheckAndUpgradeDbs);
    uc.run();
  }, 5000);
 
}