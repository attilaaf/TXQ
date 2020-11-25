import { Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { path } from '../index';
import { sendResponseWrapper } from '../../../util/sendResponseWrapper';
import { sendMapiErrorWrapper } from '../../../util/sendMapiErrorWrapper';
import AccessForbiddenError from '../../../services/error/AccessForbiddenError';
import GetTxFilters from '../../../services/use_cases/txfilters/GetTxFilters';
import { AccountContextHelper } from '../../account-context-helper';
import CreateTxFilter from '../../../services/use_cases/txfilters/CreateTxFilter';
import InvalidParamError from '../../../services/error/InvalidParamError';
import DeleteTxFilter from '../../../services/use_cases/txfilters/DeleteTxFilter';

export default [
  {
    path: `${path}/txfilter`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(GetTxFilters);
          const data = await uc.run({accountContext: AccountContextHelper.getContext(Req)});
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
    path: `${path}/txfilter/:name`,
    method: 'post',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(CreateTxFilter);
          const data = await uc.run({accountContext: AccountContextHelper.getContext(Req),
            name: Req.params.name,
            payload: Req.body.payload ? Req.body.payload : 0,
            enabled: Req.body.enabled && Req.body.enabled === true ? Req.body.enabled : false,
          });
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof AccessForbiddenError) {
            sendMapiErrorWrapper(res, 403, error.toString());
            return;
          }
          if (error instanceof InvalidParamError) {
            sendMapiErrorWrapper(res, 422, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/txfilter/:name`,
    method: 'delete',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(DeleteTxFilter);
          const data = await uc.run({accountContext: AccountContextHelper.getContext(Req),
            name: Req.params.name,
          });
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof AccessForbiddenError) {
            sendMapiErrorWrapper(res, 403, error.toString());
            return;
          }
          if (error instanceof InvalidParamError) {
            sendMapiErrorWrapper(res, 422, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  }
];
