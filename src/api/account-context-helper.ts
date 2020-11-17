import { IAccountContext } from "@interfaces/IAccountContext";
import contextFactory from "../bootstrap/middleware/di/diContextFactory";
import { Request } from "express";
import cfg from '../cfg';

export class AccountContextHelper {
    static getContext(req: Request): IAccountContext {
        const ctx = {
            projectId: req.headers.project_id || AccountContextHelper.getByHost(req) || 'default',
            apiKey: req.query.api_key || req.headers.api_key,
            serviceKey: req.query.service_key || req.headers.service_key,
            host: req.headers.host
        };
        return ctx;
    }

    static getByHost(req: Request): string {
        return contextFactory.getMatchedHost(req.headers.host);
    }
}