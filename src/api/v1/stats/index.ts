import { Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { path } from '../index';
import { sendResponseWrapper } from '../../../util/sendResponseWrapper';
import { sendMapiErrorWrapper } from '../../../util/sendMapiErrorWrapper';
import AccessForbiddenError from '../../../services/error/AccessForbiddenError';
import { AccountContextHelper } from '../../account-context-helper';
import GetStats from '../../../services/use_cases/stats/GetStats';

export default [
  {
    path: `${path}/stats`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(GetStats);
          const data = await uc.run({
            accountContext: AccountContextHelper.getContext(Req),
            from: Number(Req.query.from),
            to: Number(Req.query.to)
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
