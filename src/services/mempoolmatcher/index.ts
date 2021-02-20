 
import * as lru from './lru'
import { Inject, Service } from "typedi";
import { SSEHandler } from '../helpers/SSEHandler';
import cfg from '../../cfg';
import { TxFormatter } from '../helpers/TxFormatter';
import * as bsv from 'bsv';
const ADDRESS_REGEX = new RegExp(/^[135nm][1-9A-Za-z][^OIl]{20,40}/); // added '.' wildcard to match testnet too
const uuidv4 = require('uuid/v4');

export interface IMempoolClientHandler {
	sessionId: string;
	baseFilter?: string;
	outputFilters?: string[];
	send: (data: any, id?: any) => void;
}
const isObject = (obj) => {
	return Object.prototype.toString.call(obj) === '[object Object]';
};

@Service('mempoolMatcherService')
export class MempoolMatcherService {
	private newLru;
	private clientHandlers = new Map();
 
	constructor(@Inject('logger') private logger, @Inject('mempoolfiltertxsService') private mempoolfiltertxsService) {
		this.newLru = new lru.LRUMap(10000, []);
		this.mempoolFilteredGarbageCollector()
	}

	public async connectClientFromSSE(filter, outputFilter, req, res) {
	    const resolvedOutputFilters = MempoolMatcherService.resolveOutputFilters(outputFilter)
		const sessionPre = MempoolMatcherService.createSessionKey(filter, resolvedOutputFilters);  
		const sessionPreBuffer = Buffer.from(sessionPre, 'utf8');
		const sessionId = bsv.crypto.Hash.sha256(sessionPreBuffer).toString('hex');
		this.logger.debug('MempoolMatcherService.connectClientFromSSE', {
			lastEventId: req.headers['last-event-id'], sessionPre, sessionId, filter: filter, resolvedOutputFilters
		});
		const newSseHandler = new SSEHandler(['connected'], {  });
		newSseHandler.init(req, res);
		const h = {
			sessionId,
			baseFilter: filter,
			outputFilters: resolvedOutputFilters,
			send: (data, id) => {
				newSseHandler.send(data, id);
			}
		};
		req['id'] = uuidv4();
		this.logger.debug("MempoolMatcherService.connectClientFromSSE", { reqId: req.id } );
		this.registerClientHandler(req.id, h);
		req.on('close', () => {
			this.logger.debug("MempoolMatcherService.connectClientFromSSE.close", { reqId: req.id } );
			// Remove only after some time in case the client reconnects, allowing the same tx's to still be saved to the db
			let expirySeconds = 3600;
			if (process.env.CLIENT_MEMPOOL_EXPIRY) {
				expirySeconds = parseInt(process.env.CLIENT_MEMPOOL_EXPIRY);
			}
			setTimeout(() => {
				this.removeClientHandler(req.id);
			}, expirySeconds * 1000);
		});

		const msgs = await this.getMissedMessages(sessionId, req.headers['last-event-id'], req.query.time);
		for (const m of msgs) {
			h.send(m, m.id);
		}
	} 

	public async connectClientFromWebSocket(filter, outputFilter, lastEventId, time, socket, req) {
		this.logger.debug('MempoolMatcherService.connectClientFromWebSocket', {
			filter, outputFilter, lastEventId, time,
		});
	    const resolvedOutputFilters = MempoolMatcherService.resolveOutputFilters(outputFilter)
		const sessionPre = MempoolMatcherService.createSessionKey(filter, resolvedOutputFilters);  
		const sessionPreBuffer = Buffer.from(sessionPre, 'utf8');
		const sessionId = bsv.crypto.Hash.sha256(sessionPreBuffer).toString('hex');
		this.logger.debug('MempoolMatcherService.connectClientFromWebSocket', {
			lastEventId, sessionPre, sessionId, filter: filter, resolvedOutputFilters
		});
		const h = {
			sessionId,
			baseFilter: filter,
			outputFilters: resolvedOutputFilters,
			send: (data, id) => {
				socket.send(JSON.stringify(data), id);
			}
		};
		req['id'] = uuidv4();
		this.logger.debug("MempoolMatcherService.connectClientFromWebSocket", { reqId: req.id   } );
		this.registerClientHandler(req.id, h);
	 
		socket.on('ping', () => {
			var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
			this.logger.debug('MempoolMatcherService.connectClientFromWebSocket.Ping', {
				lastEventId, sessionPre, sessionId, filter: filter, resolvedOutputFilters, ip
			});
			console.log('Received ping from:', ip, filter, outputFilter, lastEventId, time);
		});

	 	socket.on('message', async (data) => {
			try {
				this.logger.debug("onMessage.received", { data });
				const messageAction = JSON.parse(data);
				// Ensure we have filter, outputFilter and lastEventId or time
				let filter = messageAction.filter || undefined;
				let outputFilter = messageAction.outputFilter || undefined;
				let lastEventId = messageAction.lastEventId || undefined;
				let time = messageAction.time || undefined;
				if (!filter && !outputFilter) {
					return;
				}
				if (filter && filter.length < 3) {
					return;
				}
				if (outputFilter && outputFilter.length < 4) {
					return;
				}
				const resolvedOutputFilters = MempoolMatcherService.resolveOutputFilters(outputFilter)
				const sessionPre = MempoolMatcherService.createSessionKey(filter, resolvedOutputFilters);  
				const sessionPreBuffer = Buffer.from(sessionPre, 'utf8');
				const sessionId = bsv.crypto.Hash.sha256(sessionPreBuffer).toString('hex');
				if (messageAction.method === 'getMessages') {
					const msgs = await this.getMissedMessages(sessionId, lastEventId, time);
					for (const m of msgs) {
						h.send(m, m.id);
					}
					this.logger.debug("onMessage.getMessages", { sessionId, lastEventId, time });
				}  
			} catch (err) {
				this.logger.error("socket.Message.error", { data, err});
			}
		});
		socket.on('close', () => {
			this.logger.debug("MempoolMatcherService.connectClientFromWebSocket.close", { reqId: req.id } );
			// Remove only after some time in case the client reconnects, allowing the same tx's to still be saved to the db
			let expirySeconds = 7200;
			if (process.env.CLIENT_MEMPOOL_EXPIRY) {
				expirySeconds = parseInt(process.env.CLIENT_MEMPOOL_EXPIRY);
			}
			setTimeout(() => {
				this.removeClientHandler(req.id);
			}, expirySeconds * 1000);
		});
		const msgs = await this.getMissedMessages(sessionId, lastEventId, time);

		if (msgs.length) {
			this.logger.debug('MempoolMatcherService.connectClientFromWebSocket.MissedMessagesSent', {
				lastEventId, sessionPre, sessionId, filter: filter, resolvedOutputFilters, msgs: msgs.length
			});
		}
		for (const m of msgs) {
			h.send(m, m.id);
		}
	} 

	public async registerClientHandler(clientKey: string, client: IMempoolClientHandler) {
		if (!this.clientHandlers.get(clientKey)) {
			this.clientHandlers.set(clientKey, client);
		}
	}

	public async removeClientHandler(clientKey: string) {
		if (this.clientHandlers.get(clientKey)) {
			this.clientHandlers.delete(clientKey);
		}
	}

	public async notify(tx: bsv.Transaction) {
		// Do not notify if we processed it already recently
		// This is to handle the case where multiple bitcoind's are connected
		if (this.newLru.get(tx.hash)) {
			return;
		}
		this.newLru.set(tx.hash, true);
		this.filterAndSendNotifications(tx);
	}

	private mempoolFilteredGarbageCollector() {
		const CYCLE_TIME_SECONDS = 60;
		const DELETE_FROM_CREATED_AT_TIME_DB = cfg.filterMempoolStreams.cleanupOlderTransactionsTimeMinutes || 7200;
		setTimeout(async () => {
			try {
				this.logger.debug("mempoolFilteredGarbageCollector");
				await this.mempoolfiltertxsService.deleteExpiredOlderThan(DELETE_FROM_CREATED_AT_TIME_DB);
			} finally {
				this.mempoolFilteredGarbageCollector();
			}
		}, 1000 * CYCLE_TIME_SECONDS)
	}

	private async filterAndSendNotifications(tx: bsv.Transaction) {
		const sessionIds = {};
		const clientHandlers = []
		for (const [key, clientHandler] of this.clientHandlers) {
			let isMatchedBaseFilterMatched = false;
			let matchesOutputOrScripthashMatched = false;
			if (MempoolMatcherService.isMatchedBaseFilter(tx, clientHandler.baseFilter)) {
				isMatchedBaseFilterMatched = true;
			}
			if (MempoolMatcherService.matchesOutputOrScripthash(tx, clientHandler.outputFilters)) {
				matchesOutputOrScripthashMatched = true;
			}
			if (isMatchedBaseFilterMatched || matchesOutputOrScripthashMatched) {
				clientHandlers.push(clientHandler);
				sessionIds[clientHandler.sessionId] = clientHandler.sessionId;
				this.logger.debug('filterAndSendNotifications', { txid: tx.hash, isMatchedBaseFilterMatched, matchesOutputOrScripthashMatched });
				let eventIdsArr: Array<{ id: any, sessionId: string, created_at: number, created_time: string }> = [];
				let eventIdsMap: {  [sessionId: string] : { id: any, sessionId: string, created_at: number, created_time: string } } = {};
				// Save this transaction into mempool db cache if enabled
				eventIdsArr = await this.mempoolfiltertxsService.createForSessionIds(tx.hash, tx.toString(), sessionIds);
				eventIdsArr.map((item) => {
					eventIdsMap[item.sessionId] = item;
				});
				const prop = clientHandler.sessionId;
				const payloadWithTime = Object.assign({}, TxFormatter.getTxPayload(tx), {
					id: eventIdsMap[prop].id,
					time: eventIdsMap[prop] && eventIdsMap[prop].created_at ? eventIdsMap[prop].created_at : 0,
					created_at: eventIdsMap[prop] && eventIdsMap[prop].created_at ? eventIdsMap[prop].created_at : 0,
					created_time: eventIdsMap[prop] && eventIdsMap[prop].created_time ? eventIdsMap[prop].created_time : 0
				});
				clientHandler.send(payloadWithTime, eventIdsMap[prop].id);
			}
		}
	}

	getTime() {
		return Math.round((new Date()).getTime() / 1000);
	}

	static isMatchedBaseFilter(tx, filter: string) {
		if (!filter) {
			return false;
		}
		const filters = filter.split('|');
		const txBytes = tx.toString();
		for (const singleMatch of filters) {
			var re = new RegExp(singleMatch);
			if (txBytes.match(re)) {
				return true;
			}
		}
		return false;
	}

	static matchesOutputOrScripthash(tx, outputFilters: any[]): boolean {
		for (const output of tx.outputs) {
			const hex = output.script.toHex();
			const scriptHash = bsv.crypto.Hash.sha256(output.script.toBuffer()).reverse().toString('hex');
			for (const output of outputFilters) {
				if (output === scriptHash) {
					return true;
				}
				if (output === hex) {
					return true;
				}
			}
		}
		return false;
	}

	async getMissedMessages(sessionId: string, lastEventId: any, time: any): Promise<Array<{payloadWithTime: any, id: any}>> {
		this.logger.debug('sendMissedMessages.getMissedMessages', { sessionId, lastEventId, time } );
		const messages = await this.mempoolfiltertxsService.getMessagesSince(sessionId, lastEventId, time);
		const msgs = [];
		messages.map((message) => {
			const b = new bsv.Transaction(message.rawtx); 
			const payloadWithTime = Object.assign({}, TxFormatter.getTxPayload(b), {
				id: message.id,
				time: message.created_at,
				created_at: message.created_at,
				created_time: message.created_time,
			});
			msgs.push({
				...payloadWithTime,
				id: payloadWithTime.id
			});
 
		});
		return msgs;
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

	static resolveOutputFilters(outputFilter) {
		let outputFilterArr = [];
		const start = (new Date().getTime());
		if (outputFilter) {
			if (Array.isArray(outputFilter)) {
				outputFilterArr = MempoolMatcherService.getOutputFilterSanitize(outputFilter);
			} else if (outputFilter) {
				outputFilterArr = MempoolMatcherService.getOutputFilterSanitize(outputFilter.split(','));
			}
			return outputFilterArr;
		}
		return [];
	}

	// The session key is the filters, so we can determine what each session is responsible for
	static createSessionKey(filter, outputFilter) {
		return JSON.stringify({
			filter: filter,
			outputFilter: outputFilter
		});
	} 
}
 