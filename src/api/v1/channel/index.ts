import { Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { path } from './../index';
import { sendResponseWrapper } from '../../../util/sendResponseWrapper';
import GetTxsByChannel from '../../../services/use_cases/tx/GetTxsByChannel';
import ResourceNotFoundError from '../../../services/error/ResourceNotFoundError';
import { sendErrorWrapper } from '../../../util/sendErrorWrapper';
import { AccountContextHelper } from '../../account-context-helper';
import AccountContextForbiddenError from '../../../services/error/AccountContextForbiddenError';

export default [
  {
    path: `${path}/channel`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let getTxsByChannel = Container.get(GetTxsByChannel);
          let data = await getTxsByChannel.run({
            channel: '',
            id: Req.query.id ? Req.query.id : 0,
            limit: Req.query.limit ? Req.query.limit : 1000,
            rawtx: Req.query.rawtx === '1' ? true : false,
            accountContext: AccountContextHelper.getContext(Req)
          });
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            sendErrorWrapper(res, 404, error.toString());
            return;
          } else if (error instanceof AccountContextForbiddenError) {
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
          let getTxsByChannel = Container.get(GetTxsByChannel);
          let data = await getTxsByChannel.run({
            channel: Req.params.channel,
            id: Req.query.id ? Req.query.id : 0,
            limit: Req.query.limit ? Req.query.limit : 1000,
            rawtx: Req.query.rawtx === '1' ? true : false,
            accountContext: AccountContextHelper.getContext(Req)
          });
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            sendErrorWrapper(res, 404, error.toString());
            return;
          } else if (error instanceof AccountContextForbiddenError) {
            sendErrorWrapper(res, 403, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
];
