import { Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { ssePath } from './../index';
import ConnectChannelClientSSE from '../../../services/use_cases/events/ConnectChannelClientSSE';
import { AccountContextHelper } from '../../account-context-helper';

export default [
  {
    path: `${ssePath}/merchantapilogs`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let connectChannelClientSSE = Container.get(ConnectChannelClientSSE);
          connectChannelClientSSE.run({ channel: 'merchantapilogs', req: Req, res, accountContext: AccountContextHelper.getContext(Req)});
        } catch (error) {
          next(error);
        }
      },
    ],
  },
  {
    path: `${ssePath}/channel/inserts`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let connectChannelClientSSE = Container.get(ConnectChannelClientSSE);
          connectChannelClientSSE.run({ channel: '', req: Req, res, accountContext: AccountContextHelper.getContext(Req)});
        } catch (error) {
          next(error);
        }
      },
    ],
  },
  {
    path: `${ssePath}/channel/inserts/:channel`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let connectChannelClientSSE = Container.get(ConnectChannelClientSSE);
          connectChannelClientSSE.run({ channel: Req.params.channel, req: Req, res, accountContext: AccountContextHelper.getContext(Req)});
        } catch (error) {
          next(error);
        }
      },
    ],
  },
  {
    path: `${ssePath}/channel/updates`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let connectChannelClientSSE = Container.get(ConnectChannelClientSSE);
          connectChannelClientSSE.run({ channel: 'updatelogs-', req: Req, res, accountContext: AccountContextHelper.getContext(Req)});
        } catch (error) {
          next(error);
        }
      },
    ],
  },
  {
    path: `${ssePath}/channel/updates/:channel`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let connectChannelClientSSE = Container.get(ConnectChannelClientSSE);
          connectChannelClientSSE.run({ channel: 'updatelogs-' + Req.params.channel, req: Req, res, accountContext: AccountContextHelper.getContext(Req)});
        } catch (error) {
          next(error);
        }
      },
    ],
  },
  {
    path: `${ssePath}/txout/address/:address`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let connectChannelClientSSE = Container.get(ConnectChannelClientSSE);
          connectChannelClientSSE.run({ channel: 'address-' + Req.params.address, req: Req, res, accountContext: AccountContextHelper.getContext(Req)});
        } catch (error) {
          next(error);
        }
      },
    ],
  },
  {
    path: `${ssePath}/txout/scripthash/:scripthash`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let connectChannelClientSSE = Container.get(ConnectChannelClientSSE);
          connectChannelClientSSE.run({ channel: 'scripthash-' + Req.params.scripthash, req: Req, res, accountContext: AccountContextHelper.getContext(Req)});
        } catch (error) {
          next(error);
        }
      },
    ],
  },
  {
    path: `${ssePath}/txout/group/:groupname`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let connectChannelClientSSE = Container.get(ConnectChannelClientSSE);
          connectChannelClientSSE.run({ channel: 'groupby-' + Req.params.groupname, req: Req, res, accountContext: AccountContextHelper.getContext(Req)});
        } catch (error) {
          next(error);
        }
      },
    ],
  }
];
