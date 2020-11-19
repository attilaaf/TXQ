import { Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { path } from '../index';
import { sendResponseWrapper } from '../../../util/sendResponseWrapper';
import { sendErrorWrapper } from '../../../util/sendErrorWrapper';
import { AccountContextHelper } from '../../account-context-helper';
import AccessForbiddenError from '../../../services/error/AccessForbiddenError';
import SaveTxStore from '../../../services/use_cases/txstore/SaveTxStore';
import GetTxStore from '../../../services/use_cases/txstore/GetTxStore';
import GetTxStoreRevisions from '../../../services/use_cases/txstore/GetTxStoreRevisions';
import ResourceNotFoundError from '../../../services/error/ResourceNotFoundError';

export default [
  {
    path: `${path}/txstore/:id/:category`,
    method: 'post',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(SaveTxStore);
          const data = await uc.run({id: Req.params.id, category: Req.params.category, data: Req.body.data, accountContext: AccountContextHelper.getContext(Req)});
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
    path: `${path}/txstore/:id/:category`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(GetTxStore);
          let data = await uc.run({
            id: Req.params.id,
            category: Req.params.category,
            revision: Req.query.revision,
            accountContext: AccountContextHelper.getContext(Req)});
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof AccessForbiddenError) {
            sendErrorWrapper(res, 403, error.toString());
            return;
          }
          if (error instanceof ResourceNotFoundError) {
            sendErrorWrapper(res, 404, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/txstore/:id/:category/revisions`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(GetTxStoreRevisions);
          let data = await uc.run({id: Req.params.id, category: Req.params.category, accountContext: AccountContextHelper.getContext(Req)});
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof AccessForbiddenError) {
            sendErrorWrapper(res, 403, error.toString());
            return;
          }
          if (error instanceof ResourceNotFoundError) {
            sendErrorWrapper(res, 404, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
];
