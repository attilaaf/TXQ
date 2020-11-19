import { Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { path } from '../index';
import ResourceNotFoundError from '../../../services/error/ResourceNotFoundError';
import { sendResponseWrapper } from '../../../util/sendResponseWrapper';
import { sendErrorWrapper } from '../../../util/sendErrorWrapper';
import GetTxoutgroupByName from '../../../services/use_cases/txoutgroup/GetTxoutgroupByName';
import AddGroupScriptIds from '../../../services/use_cases/txoutgroup/AddGroupScriptIds';
import DeleteGroupScriptIds from '../../../services/use_cases/txoutgroup/DeleteGroupScriptIds';
import GetTxoutgroupListByScriptid from '../../../services/use_cases/txoutgroup/GetTxoutgroupListByScriptid';
import { AccountContextHelper } from '../../account-context-helper';
import AccessForbiddenError from '../../../services/error/AccessForbiddenError';

export default [
  {
    path: `${path}/txoutgroup/scriptid/:scriptid`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(GetTxoutgroupListByScriptid);
          let data = await uc.run({
            scriptid: Req.params.scriptid,
            accountContext: AccountContextHelper.getContext(Req)
          });
          sendResponseWrapper(Req, res, 200, data.result);

        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            sendErrorWrapper(res, 404, error.toString());
            return;
          }
          if (error instanceof AccessForbiddenError) {
            sendErrorWrapper(res, 403, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/txoutgroup/:groupname`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(GetTxoutgroupByName);
          let data = await uc.run({
            groupname: Req.params.groupname,
            offset: Req.params.offset ? Req.params.offset : 0,
            limit: Req.params.limit ? Req.params.limit : 10000,
            accountContext: AccountContextHelper.getContext(Req)
          });
          sendResponseWrapper(Req, res, 200, data.result);

        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            sendErrorWrapper(res, 404, error.toString());
            return;
          }
          if (error instanceof AccessForbiddenError) {
            sendErrorWrapper(res, 403, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/txoutgroup/:groupname`,
    method: 'post',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(AddGroupScriptIds);
          let data = await uc.run({
            groupname: Req.params.groupname,
            items: Req.body.items,
            accountContext: AccountContextHelper.getContext(Req)
          });

          sendResponseWrapper(Req, res, 200, data.result);

        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            sendErrorWrapper(res, 404, error.toString());
            return;
          }
          if (error instanceof AccessForbiddenError) {
            sendErrorWrapper(res, 403, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  {
    path: `${path}/txoutgroup/:groupname`,
    method: 'delete',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(DeleteGroupScriptIds);
          let data = await uc.run({
            groupname: Req.params.groupname,
            scriptids: Req.body.scriptids,
            accountContext: AccountContextHelper.getContext(Req)
          });

          sendResponseWrapper(Req, res, 200, data.result);

        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            sendErrorWrapper(res, 404, error.toString());
            return;
          }
          if (error instanceof AccessForbiddenError) {
            sendErrorWrapper(res, 403, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
];
