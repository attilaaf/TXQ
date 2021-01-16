import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import { Response, Request } from 'express';
import { IAccountContext } from '@interfaces/IAccountContext';

import * as bsv from 'bsv'
import InvalidParamError from '../../../services/error/InvalidParamError';

const ADDRESS_REGEX = new RegExp(/^[135nm][1-9A-Za-z][^OIl]{20,40}/); // added '.' wildcard to match testnet too

@Service('connectMempoolClientSSE')
export default class ConnectMempoolClientSSE extends UseCase {
  constructor(
    @Inject('eventService') private eventService,
    @Inject('txfiltermatcherService') private txfiltermatcherService,
    @Inject('logger') private logger) {
    super();
  }
  static getOutputFilterSanitize(outputFilter) {
		const arr = outputFilter;
		const listSanitize = [];
		arr.forEach((item) => {
			if (ADDRESS_REGEX.test(item)) {
				try {
					listSanitize.push(bsv.Script.fromAddress(item).toHex());
					return;
				} catch (err) {
					// skip
				}
				return;
			} else {
				listSanitize.push(item);
			}
		});
		return listSanitize;
	}

	async resolveOutputFilters(outputFilter) {
		let outputFilterArr = [];
		const start = (new Date().getTime());
		if (outputFilter) {
			if (Array.isArray(outputFilter)) {
				outputFilterArr = ConnectMempoolClientSSE.getOutputFilterSanitize(outputFilter);
			} else if (outputFilter) {
				outputFilterArr = ConnectMempoolClientSSE.getOutputFilterSanitize(outputFilter.split(','));
			}
			return outputFilterArr;
		}
		return [];
  }
 
  public async run(params: {
    filter: any,
    outputFilter: any;
    req: Request,
    res: Response,
    accountContext?: IAccountContext
  }): Promise<UseCaseOutcome> {
	this.logger.debug("connectMempoolClient", {filter: params.filter, outputFilter: params.outputFilter })
	if (!params.filter && !params.outputFilter) {
		throw new InvalidParamError('Require base filter or output filters');
	}
	if (params.filter && params.filter.length < 3) {
		throw new InvalidParamError('Base filter too short');
	}
	if (params.outputFilter && params.outputFilter.length < 4) {
		throw new InvalidParamError('Output filter too short');
	}
	if (params.outputFilter && params.outputFilter.length < 4) {
		throw new InvalidParamError('Output filter too short');
	}
	 
	this.logger.debug("connectMempoolClient.resolveOutputFilters", {filter: params.filter, outputFilter: params.outputFilter })
    const session = this.resolveOutputFilters(params.outputFilter)
	.then((resolvedOutputFilter) => {
		this.logger.debug("connectMempoolClient.resolveOutputFilters.resolved", {resolvedOutputFilter})
		const sessionPre = this.createSessionKey(params.filter, params.outputFilter);  
		const sessionPreBuffer = Buffer.from(sessionPre, 'utf8');
		const sessionId = bsv.crypto.Hash.sha256(sessionPreBuffer).toString('hex');
		this.logger.debug('connectMempoolClient.sessionId', { sessionPre, sessionId, filter: params.filter, resolvedOutputFilter });
		return this.txfiltermatcherService.createSession(sessionId, params.filter, resolvedOutputFilter, params.req, params.res);
	})
	.catch((err) => {
		this.logger.error("connectMempoolClient.Error", { err })
		params.res.status(500).json({
			success: false,
			code: 500,
			message: err.toString(),
			stack: err.stack,
		})
	});
    return {
      success: true,
      result: session
    };
  }
 
  // The session key is the filters, so we can determine what each session is responsible for
  private createSessionKey(filter, outputFilter) {
    return JSON.stringify({
      filter: filter,
      outputFilter: outputFilter
    });
  }
 
}
