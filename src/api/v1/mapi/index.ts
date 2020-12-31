import { Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { mapiPath } from '../index';
import GetMapiTxStatus from '../../../services/use_cases/proxy/GetMapiTxStatus';
import PushMapiTx from '../../../services/use_cases/proxy/PushMapiTx';
import { sendMapiResponseWrapper } from '../../../util/sendMapiResponseWrapper';
import MapiServiceError from '../../../services/error/MapiServiceError';
import { sendMapiErrorWrapper } from '../../../util/sendMapiErrorWrapper';
import GetMapiTxFeeQuote from '../../../services/use_cases/proxy/GetMapiTxFeeQuote';
import { AccountContextHelper } from '../../account-context-helper';
import AccessForbiddenError from '../../../services/error/AccessForbiddenError';

export default [
  {
    path: `${mapiPath}/tx/:txid`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(GetMapiTxStatus);
          let data = await uc.run({ txid: Req.params.txid, accountContext: AccountContextHelper.getContext(Req) });
          let statusCode = data && data.result && data.result.mapiStatusCode ? data.result.mapiStatusCode : 200;
          sendMapiResponseWrapper(Req, res, statusCode, data.result);
        } catch (error) {
          if (error instanceof MapiServiceError) {
            sendMapiErrorWrapper(res, 500, error, AccountContextHelper.getContext(Req));
            return;
          } else if (error instanceof AccessForbiddenError) {
            sendMapiErrorWrapper(res, 403, error, AccountContextHelper.getContext(Req));
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${mapiPath}/tx`,
    method: 'post',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          const checkStatus = (req) => {
            if (req.headers['checkstatus'] === 'true' || req.headers['checkStatus'] === 'true') {
              return true;
            }
            if (req.query.checkStatus === 'true' || req.query.checkstatus === 'true') {
              return true;
            }
            if (req.body.checkStatus === 'true' || req.body.checkstatus === 'true') {
              return true;
            }
            if (req.body.checkStatus === true) {
              return true;
            }
            return false;
          }
          let uc = Container.get(PushMapiTx);
          let data = null;
          if (Req.headers['content-type'] === 'application/octet-stream') {
            data = await uc.run({ rawtx: Req.body, headers: Req.headers, checkStatus: checkStatus(Req), accountContext: AccountContextHelper.getContext(Req)});
          } else {
            data = await uc.run({ rawtx: Req.body.rawtx, headers: Req.headers, checkStatus: checkStatus(Req), accountContext: AccountContextHelper.getContext(Req)});
          }
          let statusCode = data && data.result && data.result.mapiStatusCode ? data.result.mapiStatusCode : 200;
          sendMapiResponseWrapper(Req, res, statusCode, data.result);
        } catch (error) {
          if (error instanceof MapiServiceError) {
            sendMapiErrorWrapper(res, 500, error, AccountContextHelper.getContext(Req));
            return;
          } else if (error instanceof AccessForbiddenError) {
            sendMapiErrorWrapper(res, 403, error, AccountContextHelper.getContext(Req));
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${mapiPath}/feeQuote`,
    method: 'get',
    handler: [
      async (Req: Request | any, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(GetMapiTxFeeQuote);
          // tslint:disable-next-line: no-string-literal
          let data = await uc.run({ accountContext: AccountContextHelper.getContext(Req) });
          let statusCode = data && data.result && data.result.mapiStatusCode ? data.result.mapiStatusCode : 200;
          sendMapiResponseWrapper(Req, res, statusCode, data.result);
        } catch (error) {
          if (error instanceof MapiServiceError) {
            sendMapiErrorWrapper(res, 500, error, AccountContextHelper.getContext(Req));
            return;
          } else if (error instanceof AccessForbiddenError) {
            sendMapiErrorWrapper(res, 403, error, AccountContextHelper.getContext(Req));
            return;
          }
          next(error);
        }
      },
    ],
  }
];
