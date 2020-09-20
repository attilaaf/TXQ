import { Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { mapiPath } from '../index';
import GetMapiTxStatus from '../../../services/use_cases/proxy/GetMapiTxStatus';
import PushMapiTx from '../../../services/use_cases/proxy/PushMapiTx';
import { sendMapiResponseWrapper } from '../../../util/sendMapiResponseWrapper';
import MapiServiceError from '../../../services/error/MapiServiceError';
import { sendMapiErrorWrapper } from '../../../util/sendMapiErrorWrapper';
import GetMapiTxFeeQuote from '../../../services/use_cases/proxy/GetMapiTxFeeQuote';

export default [
  {
    path: `${mapiPath}/tx/:txid`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(GetMapiTxStatus);
          let data = await uc.run({ txid: Req.params.txid});
          sendMapiResponseWrapper(Req, res, data.result.mapiStatusCode ? data.result.mapiStatusCode : 200, data.result);
        } catch (error) {
          if (error instanceof MapiServiceError) {
            sendMapiErrorWrapper(res, 500, error.toString());
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
          let uc = Container.get(PushMapiTx);
          let data = await uc.run({ rawtx: Req.body.rawtx, headers: Req.headers});
          sendMapiResponseWrapper(Req, res, data.result.mapiStatusCode ? data.result.mapiStatusCode : 200, data.result);
        } catch (error) {
          if (error instanceof MapiServiceError) {
            sendMapiErrorWrapper(res, 500, error.toString());
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
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(GetMapiTxFeeQuote);
          let data = await uc.run();
          sendMapiResponseWrapper(Req, res, data.result.mapiStatusCode ? data.result.mapiStatusCode : 200, data.result);
        } catch (error) {
          if (error instanceof MapiServiceError) {
            sendMapiErrorWrapper(res, 500, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  }
];
