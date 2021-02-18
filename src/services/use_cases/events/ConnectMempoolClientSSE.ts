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
		@Inject('mempoolMatcherService') private mempoolMatcherService,
		@Inject('logger') private logger) {
		super();
	}
	public async run(params: {
		filter: any,
		outputFilter: any;
		req: Request,
		res: Response,
		accountContext?: IAccountContext
	}): Promise<UseCaseOutcome> {
		this.logger.debug("ConnectMempoolClientSSE", {filter: params.filter, outputFilter: params.outputFilter })
		
		if (!params.filter && !params.outputFilter) {
			throw new InvalidParamError('Require base filter or output filters');
		}
		if (params.filter && params.filter.length < 3) {
			throw new InvalidParamError('Base filter too short');
		}
		if (params.outputFilter && params.outputFilter.length < 4) {
			throw new InvalidParamError('Output filter too short');
		}
		this.mempoolMatcherService.connectClientFromSSE(params.filter, params. outputFilter, params.req, params.res);
		return {
			success: true,
			result: true
		};
  	}
  
}
