import { Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { path } from '../index';
import ResourceNotFoundError from '../../../services/error/ResourceNotFoundError';
import { sendResponseWrapper } from '../../../util/sendResponseWrapper';
import { sendErrorWrapper } from '../../../util/sendErrorWrapper';
import GetUtxosByScriptHashOrAddressArray from '../../../services/use_cases/assets/GetUtxosByScriptHashOrAddressArray';
import GetBalanceByScriptHashOrAddressArray from '../../../services/use_cases/assets/GetBalanceByScriptHashOrAddressArray';
import GetTxoutsByTxidArray from '../../../services/use_cases/assets/GetTxoutsByTxidArray';
import InvalidParamError from '../../../services/error/InvalidParamError';
import GetTxoutsByScriptHashOrAddressArray from '../../../services/use_cases/assets/GetTxoutsByScriptHashOrAddressArray';
import GetAssetHistoryByScriptHashOrAddressArray from '../../../services/use_cases/assets/GetAssetHistoryByScriptHashOrAddressArray';

function checkWithSpends(Req: any): boolean {
  return Req.query.withSpends === 'true' || Req.query.withSpends === '1' ?  true : false;
}

export default [
  {
    path: `${path}/asset/sa/:assetid/address/utxo/:addresses`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(GetUtxosByScriptHashOrAddressArray);
          let data = await uc.run({
            scripts: Req.params.addresses,
            limit: Req.query.limit ? Number(Req.query.limit) : 100,
            offset: Number(Req.query.offset),
            order: Req.query.order !== 'asc' ? 'desc' : 'asc'
          });
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            sendErrorWrapper(res, 404, error.toString());
            return;
          }
          if (error instanceof InvalidParamError) {
            sendErrorWrapper(res, 422, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/asset/sa/:assetid/address/balance/:addresses`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(GetBalanceByScriptHashOrAddressArray);
          let data = await uc.run({
            scripts: Req.params.addresses,
          });
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            sendErrorWrapper(res, 404, error.toString());
            return;
          }
          if (error instanceof InvalidParamError) {
            sendErrorWrapper(res, 422, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/asset/sa/:assetid/address/history/:addresses`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(GetAssetHistoryByScriptHashOrAddressArray);
          let data = await uc.run({
            scripts: Req.params.addresses,
            limit: Req.query.limit ? Number(Req.query.limit) : 100,
            offset: Number(Req.query.offset),
            order: Req.query.order !== 'asc' ? 'desc' : 'asc',
            fromblockheight: Req.query.fromblockheight ? Number(Req.query.fromblockheight) : null,
          });
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            sendErrorWrapper(res, 404, error.toString());
            return;
          }
          if (error instanceof InvalidParamError) {
            sendErrorWrapper(res, 422, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/asset/sa/:assetid/address/history`,
    method: 'post',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(GetAssetHistoryByScriptHashOrAddressArray);
          let data = await uc.run({
            scripts: Req.body.addresses || Req.body.addrs || Req.body.addr || Req.body.address,
            limit: Req.query.limit ? Number(Req.query.limit) : 100,
            offset: Number(Req.query.offset),
            order: Req.query.order !== 'asc' ? 'desc' : 'asc'
          });
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            sendErrorWrapper(res, 404, error.toString());
            return;
          }
          if (error instanceof InvalidParamError) {
            sendErrorWrapper(res, 422, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/asset/sa/:assetid/address/utxo`,
    method: 'post',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(GetUtxosByScriptHashOrAddressArray);
          let data = await uc.run({
            scripts: Req.body.addresses || Req.body.addrs || Req.body.addr || Req.body.address,
            limit: Req.query.limit ? Number(Req.query.limit) : 100,
            offset: Number(Req.query.offset),
            order: Req.query.order !== 'asc' ? 'desc' : 'asc'
          });
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            sendErrorWrapper(res, 404, error.toString());
            return;
          }
          if (error instanceof InvalidParamError) {
            sendErrorWrapper(res, 422, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/asset/sa/:assetid/address/:addresses`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(GetTxoutsByScriptHashOrAddressArray);
          let data = await uc.run({
            scripts: Req.params.addresses,
            limit: Req.query.limit ? Number(Req.query.limit) : 100,
            offset: Number(Req.query.offset),
            order: Req.query.order !== 'asc' ? 'desc' : 'asc',
            withSpends: Req.query.withSpends === 'true' || Req.query.withSpends === '1' ?  true : false,
          });
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            sendErrorWrapper(res, 404, error.toString());
            return;
          }
          if (error instanceof InvalidParamError) {
            sendErrorWrapper(res, 422, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/asset/sa/:assetid/address`,
    method: 'post',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(GetTxoutsByScriptHashOrAddressArray);
          let data = await uc.run({
            scripts: Req.body.addresses || Req.body.addrs || Req.body.addr || Req.body.address,
            limit: Req.query.limit ? Number(Req.query.limit) : 100,
            offset: Number(Req.query.offset),
            order: Req.query.order !== 'asc' ? 'desc' : 'asc',
            withSpends: Req.query.withSpends === 'true' || Req.query.withSpends === '1' ?  true : false,
          });
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            sendErrorWrapper(res, 404, error.toString());
            return;
          }
          if (error instanceof InvalidParamError) {
            sendErrorWrapper(res, 422, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/asset/sa/:assetid/scripthash/utxo/:scripthashes`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(GetUtxosByScriptHashOrAddressArray);
          let data = await uc.run({
            scripts: Req.params.scripthashes,
            limit: Req.query.limit ? Number(Req.query.limit) : 100,
            offset: Number(Req.query.offset),
            order: Req.query.order !== 'asc' ? 'desc' : 'asc',

          });
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            sendErrorWrapper(res, 404, error.toString());
            return;
          }
          if (error instanceof InvalidParamError) {
            sendErrorWrapper(res, 422, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/asset/sa/:assetid/scripthash/utxo`,
    method: 'post',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(GetUtxosByScriptHashOrAddressArray);
          let data = await uc.run({
            scripts: Req.body.scripthashes || Req.body.scripthash,
            limit: Req.query.limit ? Number(Req.query.limit) : 100,
            offset: Number(Req.query.offset),
            order: Req.query.order !== 'asc' ? 'desc' : 'asc',

          });
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            sendErrorWrapper(res, 404, error.toString());
            return;
          }
          if (error instanceof InvalidParamError) {
            sendErrorWrapper(res, 422, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/asset/sa/:assetid/scripthash/history/:scripthashes`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(GetAssetHistoryByScriptHashOrAddressArray);
          let data = await uc.run({
            scripts: Req.params.scripthashes,
            limit: Req.query.limit ? Number(Req.query.limit) : 100,
            offset: Number(Req.query.offset),
            order: Req.query.order !== 'asc' ? 'desc' : 'asc',
            fromblockheight: Req.query.fromblockheight ? Number(Req.query.fromblockheight) : null,
          });
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            sendErrorWrapper(res, 404, error.toString());
            return;
          }
          if (error instanceof InvalidParamError) {
            sendErrorWrapper(res, 422, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/asset/sa/:assetid/scripthash/history`,
    method: 'post',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(GetAssetHistoryByScriptHashOrAddressArray);
          let data = await uc.run({
            scripts: Req.body.scripthashes || Req.body.scripthash,
            limit: Req.query.limit ? Number(Req.query.limit) : 100,
            offset: Number(Req.query.offset),
            order: Req.query.order !== 'asc' ? 'desc' : 'asc',
          });
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            sendErrorWrapper(res, 404, error.toString());
            return;
          }
          if (error instanceof InvalidParamError) {
            sendErrorWrapper(res, 422, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/asset/sa/:assetid/scripthash/balance/:scripthash`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(GetBalanceByScriptHashOrAddressArray);
          let data = await uc.run({
            scripts: Req.params.scripthash
          });
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            sendErrorWrapper(res, 404, error.toString());
            return;
          }
          if (error instanceof InvalidParamError) {
            sendErrorWrapper(res, 422, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/asset/sa/:assetid/scripthash/:scripthashes`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(GetTxoutsByScriptHashOrAddressArray);
          let data = await uc.run({
            scripts: Req.params.scripthashes,
            limit: Req.query.limit ? Number(Req.query.limit) : 100,
            offset: Number(Req.query.offset),
            order: Req.query.order !== 'asc' ? 'desc' : 'asc',
            withSpends: checkWithSpends(Req)
          });
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            sendErrorWrapper(res, 404, error.toString());
            return;
          }
          if (error instanceof InvalidParamError) {
            sendErrorWrapper(res, 422, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/asset/sa/:assetid/scripthash`,
    method: 'post',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(GetTxoutsByScriptHashOrAddressArray);
          let data = await uc.run({
            scripts: Req.body.scripthashes || Req.body.scripthash,
            limit: Req.query.limit ? Number(Req.query.limit) : 100,
            offset: Number(Req.query.offset),
            order: Req.query.order !== 'asc' ? 'desc' : 'asc',
            withSpends: Req.query.withSpends === 'true' || Req.query.withSpends === '1' ?  true : false,
          });
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            sendErrorWrapper(res, 404, error.toString());
            return;
          }
          if (error instanceof InvalidParamError) {
            sendErrorWrapper(res, 422, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/asset/sa/:assetid/:txOutputs`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(GetTxoutsByTxidArray);
          let data = await uc.run({
            txOutpoints: Req.params.txOutputs,
            withSpends: checkWithSpends(Req)
          });
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            sendErrorWrapper(res, 404, error.toString());
            return;
          }
          if (error instanceof InvalidParamError) {
            sendErrorWrapper(res, 422, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/asset/sa/:assetid`,
    method: 'post',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(GetTxoutsByTxidArray);
          let data = await uc.run({
            txOutpoints: Req.body.outputs,
            withSpends: checkWithSpends(Req)
          });
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            sendErrorWrapper(res, 404, error.toString());
            return;
          }
          if (error instanceof InvalidParamError) {
            sendErrorWrapper(res, 422, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
];
