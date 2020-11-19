import { Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { path } from './../index';
import { sendResponseWrapper } from '../../../util/sendResponseWrapper';
import { sendMapiErrorWrapper } from '../../../util/sendMapiErrorWrapper';
import GetSystemStatus from '../../../services/use_cases/system/GetSystemStatus';
import { SystemContextHelper } from '../../system-context-helper';
import AccessForbiddenError from '../../../services/error/AccessForbiddenError';

export default [
  {
    path: `${path}/status`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(GetSystemStatus);
          const data = await uc.run({systemContext: SystemContextHelper.getContext(Req)});
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
