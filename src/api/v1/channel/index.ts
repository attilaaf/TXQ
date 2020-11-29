import { Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { path } from './../index';
import { sendResponseWrapper } from '../../../util/sendResponseWrapper';
import GetTxsByChannel from '../../../services/use_cases/tx/GetTxsByChannel';
import ResourceNotFoundError from '../../../services/error/ResourceNotFoundError';
import { sendErrorWrapper } from '../../../util/sendErrorWrapper';
import { AccountContextHelper } from '../../account-context-helper';
import AccessForbiddenError from '../../../services/error/AccessForbiddenError';

export default [
  {
    path: `${path}/channel`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(GetTxsByChannel);
          let data = await uc.run({
            channel: '',
            id: Req.query.id ? Req.query.id : 0,
            // tags: Req.query.tags,
            limit: Req.query.limit ? Req.query.limit : 1000,
            rawtx: Req.query.rawtx === '1' ? true : false,
            status: Req.query.status || 'all',
            accountContext: AccountContextHelper.getContext(Req)
          });
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            sendErrorWrapper(res, 404, error.toString());
            return;
          } else if (error instanceof AccessForbiddenError) {
            sendErrorWrapper(res, 403, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/channel/:channel`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(GetTxsByChannel);
          let data = await uc.run({
            channel: Req.params.channel,
            id: Req.query.id ? Req.query.id : 0,
            // tags: Req.query.tags,
            limit: Req.query.limit ? Req.query.limit : 1000,
            rawtx: Req.query.rawtx === '1' ? true : false,
            status: Req.query.status || 'all',
            accountContext: AccountContextHelper.getContext(Req)
          });
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            sendErrorWrapper(res, 404, error.toString());
            return;
          } else if (error instanceof AccessForbiddenError) {
            sendErrorWrapper(res, 403, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  /*{
    path: `${path}/tags/:tags`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(GetTxsByTags);
          let data = await uc.run({
            id: Req.query.id ? Req.query.id : 0,
            tags: Req.params.tags,
            limit: Req.query.limit ? Req.query.limit : 1000,
            rawtx: Req.query.rawtx === '1' ? true : false,
            accountContext: AccountContextHelper.getContext(Req)
          });
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            sendErrorWrapper(res, 404, error.toString());
            return;
          } else if (error instanceof AccessForbiddenError) {
            sendErrorWrapper(res, 403, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  }*/
];
