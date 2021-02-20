import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import { Response, Request } from 'express';
import { IAccountContext } from '@interfaces/IAccountContext';
import * as bsv from 'bsv'
import InvalidParamError from '../../error/InvalidParamError';
const ADDRESS_REGEX = new RegExp(/^[135nm][1-9A-Za-z][^OIl]{20,40}/); // added '.' wildcard to match testnet too

function getJsonFromUrl(url) {
	if(!url) url = location.href;
	var question = url.indexOf("?");
	var hash = url.indexOf("#");
	if(hash==-1 && question==-1) return {};
	if(hash==-1) hash = url.length;
	var query = question==-1 || hash==question+1 ? url.substring(hash) : 
	url.substring(question+1,hash);
	var result = {};
	query.split("&").forEach(function(part) {
	  if(!part) return;
	  part = part.split("+").join(" "); // replace every + with space, regexp-free version
	  var eq = part.indexOf("=");
	  var key = eq>-1 ? part.substr(0,eq) : part;
	  var val = eq>-1 ? decodeURIComponent(part.substr(eq+1)) : "";
	  var from = key.indexOf("[");
	  if(from==-1) result[decodeURIComponent(key)] = val;
	  else {
		var to = key.indexOf("]",from);
		var index = decodeURIComponent(key.substring(from+1,to));
		key = decodeURIComponent(key.substring(0,from));
		if(!result[key]) result[key] = [];
		if(!index) result[key].push(val);
		else result[key][index] = val;
	  }
	});
	return result;
  }

@Service('connectMempoolClientWebSocket')
export default class ConnectMempoolClientWebSocket extends UseCase {
	constructor(
		@Inject('mempoolMatcherService') private mempoolMatcherService,
		@Inject('logger') private logger) {
		super();
	}
	public async run(params: {
		req: Request,
		socket: any
	}): Promise<UseCaseOutcome> {
		const extractFilterRegex = new RegExp('(\/sse)?\/mempool\/(.+)\\?');
		const matches = params.req.url.match(extractFilterRegex);
		let filter = null;
		if (matches.length && matches[1]) {
			filter = matches[1];
		} else {
			// Try it when there is no ? at the end
			const extractFilterRegexWithoutQ = new RegExp('(\/sse)?\/mempool\/(.+)$');
			const matches = params.req.url.match(extractFilterRegexWithoutQ);
			if (matches.length && matches[1]) {
				filter = matches[1];
			} 
		}
		const urlParams: any = getJsonFromUrl(params.req.url);
		this.logger.debug("ConnectMempoolClientWebSocket", {url: params.req.url, urlParams});
		if (urlParams.filter) {
			filter = urlParams.filter;
		}
		if (!filter && !urlParams.outputFilter) {
			throw new InvalidParamError('Require base filter or output filters');
		}
		if (filter && filter.length < 3) {
			throw new InvalidParamError('Base filter too short');
		}
		if (urlParams.outputFilter && urlParams.outputFilter.length < 4) {
			throw new InvalidParamError('Output filter too short');
		} 
		this.mempoolMatcherService.connectClientFromWebSocket(
			filter || null,
			urlParams.outputFilter || null, 
			params.req.headers['last-event-id'], 
			urlParams.time || null, 
			params.socket,
			params.req);
		return {
			success: true,
			result: true
		};
  	}
}
