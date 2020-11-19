import { Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { path } from './../index';
import GetQueueStats from '../../../services/use_cases/queue/GetQueueStats';
import { sendResponseWrapper } from '../../../util/sendResponseWrapper';
import GetTxsDlq from '../../../services/use_cases/queue/GetTxsDlq';
import GetTxsPending from '../../../services/use_cases/queue/GetTxsPending';
import GetTxsBySyncState from '../../../services/use_cases/queue/GetTxsBySyncState';
import RequeueTxsDlq from '../../../services/use_cases/queue/RequeueTxsDlq';
import { AccountContextHelper } from '../../account-context-helper';
import { sendMapiErrorWrapper } from '../../../util/sendMapiErrorWrapper';
import AccessForbiddenError from '../../../services/error/AccessForbiddenError';

export default [
  {
    path: `${path}/queue/stats`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let getQueueStats = Container.get(GetQueueStats);
          const data = await getQueueStats.run({accountContext: AccountContextHelper.getContext(Req)});
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof AccessForbiddenError) {
            sendMapiErrorWrapper(res, 403, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/queue/dlq`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let getTxsDlq = Container.get(GetTxsDlq);
          const data = await getTxsDlq.run({dlq: null, accountContext: AccountContextHelper.getContext(Req)});
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof AccessForbiddenError) {
            sendMapiErrorWrapper(res, 403, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/queue/dlq/:dlq`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let getTxsDlq = Container.get(GetTxsDlq);
          const data = await getTxsDlq.run({dlq: Req.params.dlq, accountContext: AccountContextHelper.getContext(Req)});
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof AccessForbiddenError) {
            sendMapiErrorWrapper(res, 403, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/queue/requeue`,
    method: 'post',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(RequeueTxsDlq);
          const data = await uc.run({dlq: null, limit: Req.query.limit ? Number(Req.query.limit) : 20, accountContext: AccountContextHelper.getContext(Req)});
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof AccessForbiddenError) {
            sendMapiErrorWrapper(res, 403, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/queue/requeue/:dlq`,
    method: 'post',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(RequeueTxsDlq);
          const data = await uc.run({dlq: Req.params.dlq, limit: Req.query.limit ? Number(Req.query.limit) : 20, accountContext: AccountContextHelper.getContext(Req)});
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof AccessForbiddenError) {
            sendMapiErrorWrapper(res, 403, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/queue/sync/:syncState`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let getTxsBySyncState = Container.get(GetTxsBySyncState);
          const data = await getTxsBySyncState.run({
            limit: Req.query.limit ? Req.query.limit : 10000,
            offset: Req.query.offset ? Req.query.offset : 0,
            syncState: Req.params.syncState ? Req.params.syncState : 'pending',
            accountContext: AccountContextHelper.getContext(Req)
          });
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof AccessForbiddenError) {
            sendMapiErrorWrapper(res, 403, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
];
