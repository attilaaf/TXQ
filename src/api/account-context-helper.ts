import { IAccountContext } from "@interfaces/IAccountContext";
import { Request } from "express";
import cfg from '../cfg';
export class AccountContextHelper {
    static getContext(req: Request): IAccountContext {
        // If a default context is provided, then check for it and set it
        if (cfg.enableDefault && !req.headers.project_id && !req.headers.api_key && !req.headers.service_key) {
            return {
                projectId: 'default',
                host: req.headers.host
            };
        }
        return {
            apiKey: req.headers.api_key,
            projectId: req.headers.project_id,
            serviceKey: req.headers.service_key,
            host: req.headers.host
        };
    }
}
