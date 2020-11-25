import { Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { path } from './../index';
import GetTxout from '../../../services/use_cases/spends/GetTxout';
import GetTxoutsByScriptHash from '../../../services/use_cases/spends/GetTxoutsByScriptHash';
import GetTxoutsByAddress from '../../../services/use_cases/spends/GetTxoutsByAddress';
import GetUtxosByAddress from '../../../services/use_cases/spends/GetUtxosByAddress';
import GetUtxosByScriptHash from '../../../services/use_cases/spends/GetUtxosByScriptHash';
import ResourceNotFoundError from '../../../services/error/ResourceNotFoundError';
import { sendResponseWrapper } from '../../../util/sendResponseWrapper';
import { sendErrorWrapper } from '../../../util/sendErrorWrapper';
import GetTxoutsByOutpointArray from '../../../services/use_cases/spends/GetTxoutsByOutpointArray';
import GetTxoutsByGroup from '../../../services/use_cases/spends/GetTxoutsByGroup';
import GetUtxosByGroup from '../../../services/use_cases/spends/GetUtxosByGroup';
import GetBalanceByGroup from '../../../services/use_cases/spends/GetBalanceByGroup';
import GetBalanceByAddresses from '../../../services/use_cases/spends/GetBalanceByAddresses';
import GetBalanceByScriptHashes from '../../../services/use_cases/spends/GetBalanceByScriptHashes';
import { AccountContextHelper } from '../../account-context-helper';
import AccessForbiddenError from '../../../services/error/AccessForbiddenError';

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
            limit: Req.query.limit ? Req.query.limit: 100,
            offset: Req.query.offset,
            order: Req.query.order ? Req.query.order : 'desc'
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
          let uc = Container.get(GetTxHistoryByScriptHashOrAddressArray);
          let data = await uc.run({
            scripts: Req.params.addresses,
            limit: Req.query.limit ? Req.query.limit: 100,
            offset: Req.query.offset,
            order: Req.query.order ? Req.query.order : 'desc',
            fromblockheight: Req.query.fromblockheight ? Req.query.fromblockheight : null,
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
          let uc = Container.get(GetTxHistoryByScriptHashOrAddressArray);
          let data = await uc.run({
            scripts: Req.body.addresses || Req.body.addrs || Req.body.addr || Req.body.address,
            limit: Req.query.limit ? Req.query.limit: 100,
            offset: Req.query.offset,
            order: Req.query.order ? Req.query.order : 'desc'
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
            limit: Req.query.limit ? Req.query.limit: 100,
            offset: Req.query.offset,
            order: Req.query.order ? Req.query.order : 'desc'
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
            limit: Req.query.limit ? Req.query.limit: 100,
            offset: Req.query.offset,
            order: Req.query.order ? Req.query.order : 'desc',
            withSpends: Req.query.withSpends === 'true' || Req.query.withSpends === 1 ?  true : false,
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
            limit: Req.query.limit ? Req.query.limit: 100,
            offset: Req.query.offset,
            order: Req.query.order ? Req.query.order : 'desc',
            withSpends: Req.query.withSpends === 'false' || Req.query.withSpends === '0' ?  false : true,
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
            limit: Req.query.limit ? Req.query.limit: 100,
            offset: Req.query.offset,
            order: Req.params.order ? Req.params.order : 'desc'
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
            limit: Req.query.limit ? Req.query.limit : 100,
            offset: Req.query.offset,
            order: Req.query.order ? Req.query.order : 'desc',
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
          let uc = Container.get(GetTxHistoryByScriptHashOrAddressArray);
          let data = await uc.run({
            scripts: Req.params.scripthashes,
            limit: Req.query.limit ? Req.query.limit : 100,
            offset: Req.query.offset,
            order: Req.query.order ? Req.query.order : 'desc',
            fromblockheight: Req.query.fromblockheight ? Req.query.fromblockheight : null,
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
          let uc = Container.get(GetTxHistoryByScriptHashOrAddressArray);
          let data = await uc.run({
            scripts: Req.body.scripthashes || Req.body.scripthash,
            limit: Req.query.limit ? Req.query.limit : 100,
            offset: Req.query.offset,
            order: Req.query.order ? Req.query.order : 'desc',
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
            limit: Req.query.limit ? Req.query.limit: 100,
            offset: Req.query.offset,
            order: Req.query.order ? Req.query.order : 'desc',
            withSpends: Req.query.withSpends === 'false' || Req.query.withSpends === '0' ?  false : true,
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
            limit: Req.query.limit ? Req.query.limit: 100,
            offset: Req.query.offset,
            order: Req.query.order ? Req.query.order : 'desc',
            withSpends: Req.query.withSpends === 'false' || Req.query.withSpends === '0' ?  false : true,
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
            withSpends: Req.query.withSpends === 'false' || Req.query.withSpends === '0' ?  false : true,
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
            withSpends: Req.query.withSpends === 'false' || Req.query.withSpends === '0' ?  false : true,
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
    path: `${path}/spends/:txOutputs`,
    method: 'get',
    handler: [
    async (Req: Request, res: Response, next: NextFunction) => {
      try {
        let uc = Container.get(GetSpendsByTxidArray);
        let data = await uc.run({
          txOutpoints: Req.params.txOutputs
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
    ]
  },
  {
    path: `${path}/spends`,
    method: 'post',
    handler: [
    async (Req: Request, res: Response, next: NextFunction) => {
      try {
        let uc = Container.get(GetSpendsByTxidArray);
        let data = await uc.run({
          txOutpoints: Req.body.outputs
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
    ]
  },
];
