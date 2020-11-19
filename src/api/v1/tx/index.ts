import { Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import GetTx from './../../../services/use_cases/tx/GetTx';
import SaveTxs from '../../../services/use_cases/tx/SaveTxs';
import SyncTxStatus from '../../../services/use_cases/tx/SyncTxStatus';
import { path } from './../index';
import ResourceNotFoundError from '../../../services/error/ResourceNotFoundError';
import TxhashMismatchError from '../../../services/error/TxhashMismatchError';
import InvalidParamError from '../../../services/error/InvalidParamError';
import TransactionStillProcessingError from '../../../services/error/TransactionStillProcessing';
import TransactionDataMissingError from '../../../services/error/TransactionDataMissingError';
import GetTxsForSync from '../../../services/use_cases/tx/GetTxsForSync';
import { sendResponseWrapper } from '../../../util/sendResponseWrapper';
import { sendErrorWrapper } from '../../../util/sendErrorWrapper';
import ResyncTx from '../../../services/use_cases/queue/ResyncTx';
import { AccountContextHelper } from '../../account-context-helper';
import AccessForbiddenError from '../../../services/error/AccessForbiddenError';

export default [

  {
    path: `${path}/tx/:txid/resync`,
    method: 'post',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let resyncTx = Container.get(ResyncTx);
          const data = await resyncTx.run({txid: Req.params.txid, accountContext: AccountContextHelper.getContext(Req)});
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof AccessForbiddenError) {
            sendErrorWrapper(res, 403, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/tx/:txid/sync`,
    method: 'post',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let syncTxStatus = Container.get(SyncTxStatus);
          let data = await syncTxStatus.run({ txid: Req.params.txid, accountContext: AccountContextHelper.getContext(Req)});
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof TransactionStillProcessingError) {
            sendResponseWrapper(Req, res, 202, {});
            return;
          }
          if (error instanceof ResourceNotFoundError) {
            sendErrorWrapper(res, 404, error.toString());
            return;
          }
          if (error instanceof TransactionDataMissingError) {
            sendErrorWrapper(res, 422, error.toString());
            return;
          }
          if (error instanceof AccessForbiddenError) {
            sendErrorWrapper(res, 403, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/tx/sync`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let getTxsForSync = Container.get(GetTxsForSync);
          let data = await getTxsForSync.run({accountContext: AccountContextHelper.getContext(Req)});
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof AccessForbiddenError) {
            sendErrorWrapper(res, 403, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/tx/:txid`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let getTx = Container.get(GetTx);
          let data = await getTx.run({ txid: Req.params.txid, channel: null, rawtx: Req.query.rawtx === '0' ? false : true, accountContext: AccountContextHelper.getContext(Req)});
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            sendErrorWrapper(res, 404, error.toString());
            return;
          }
          if (error instanceof AccessForbiddenError) {
            sendErrorWrapper(res, 403, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/tx/:txid/channel/:channel`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let getTx = Container.get(GetTx);
          let data = await getTx.run({
            txid: Req.params.txid,
            channel: Req.params.channel,
            rawtx: Req.query.rawtx === '0' ? false : true,
            accountContext: AccountContextHelper.getContext(Req)
          });
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            sendErrorWrapper(res, 404, error.toString());
            return;
          }
          if (error instanceof AccessForbiddenError) {
            sendErrorWrapper(res, 403, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/tx/:txid/channel`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let getTx = Container.get(GetTx);
          let data = await getTx.run({
            txid: Req.params.txid,
            rawtx: Req.query.rawtx === '0' ? false : true,
            accountContext: AccountContextHelper.getContext(Req)
          });
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            sendErrorWrapper(res, 404, error.toString());
            return;
          }
          if (error instanceof AccessForbiddenError) {
            sendErrorWrapper(res, 403, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/tx`,
    method: 'post',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let saveTxs = Container.get(SaveTxs);
          let data = await saveTxs.run({
            channel: Req.body.channel,
            set: Req.body.set,
            accountContext: AccountContextHelper.getContext(Req)
          });
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof TxhashMismatchError || error instanceof InvalidParamError) {
            sendErrorWrapper(res, 422, error.toString());
            return;
          }
          if (error instanceof AccessForbiddenError) {
            sendErrorWrapper(res, 403, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  }
];
