import { Request } from "express";
import AccessForbiddenError from "../services/error/AccessForbiddenError";
import cfg from '../cfg';
import { ISystemContext } from "@interfaces/ISystemContext";

export class SystemContextHelper {
    static getContext(req: Request): ISystemContext {
        const ctx = {
            host: req.headers.host,
            systemKey: req.query.system_key || req.headers.system_key,
        };
        if (ctx.systemKey === cfg.systemKey) {
            return ctx;
        }
        throw new AccessForbiddenError();
    }
}
