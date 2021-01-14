 
import * as lru from './lru'
import { Inject, Service } from "typedi";
import { SSEHandler } from '../../services/helpers/SSEHandler';
import cfg from '../../cfg';
 
const bsv = require('bsv')

@Service('txfiltermatcherService')
export class TxFilterMatcher {
	private baseFilterMapping;
	private sseSessionMapping;
	private outputFilterMapping;
	private newLru;
	private blockLru;

	constructor(@Inject('logger') private logger, @Inject('mempoolfiltertxsService') private mempoolfiltertxsService) {
		this.sseSessionMapping = new Map();
		this.baseFilterMapping = new Map();
		this.outputFilterMapping = new Map();
		this.newLru = new lru.LRUMap(10000, []);
		this.blockLru = new lru.LRUMap(100, []);
		this.garbageCollector();
		if (process.env.ENABLE_MEMPOOL_ROUTES) {
			this.mempoolFilteredGarbageCollector();
		}
	}

	public async createSession(sessionId, filter, resolvedOutputFilter, req, res) {
		this.logger.debug('createSession', { sessionId, filter });
		let hasNewSessionMapping = false;
		let sessionMapping = this.sseSessionMapping.get(sessionId);
		if (!sessionMapping) {
			const newSseHandler = new SSEHandler(['connected'], { sessionId: sessionId});
			this.sseSessionMapping.set(sessionId, {
				sseHandler: newSseHandler,
				baseFilter: filter,
				lastId: 0,
				hasOutputfilter: !!resolvedOutputFilter && !!resolvedOutputFilter.length,
				lastConnectedTime: (new Date()).getTime()
			});
			hasNewSessionMapping = true;
 
			sessionMapping = this.sseSessionMapping.get(sessionId);
		} else {
			sessionMapping.lastConnectedTime = (new Date()).getTime();
		}

		if (resolvedOutputFilter && resolvedOutputFilter.length) {
			this.addOutputFilter(resolvedOutputFilter, sessionId);
		} else if (!filter) {
			this.addBaseFilterForSession(undefined, sessionId);
		}
		if (filter) {
			this.addBaseFilterForSession(filter, sessionId);
		}
 
        this.logger.debug('createSession.sessionInit', { hasNewSessionMapping, lastId: sessionMapping.lastId} );
		// Initialize this connection with the associated session id
		// Note, we still must send down the history if the user requested with last-event-id or the query time param
		sessionMapping.sseHandler.init(req, res);
		await this.sendMissedMessages(sessionMapping.sseHandler, sessionId, req.headers['last-event-id'], req.query.time);
	}

	async sendMissedMessages(sseHandler, sessionId: string, lastEventId: any, time: any) {
		const messages = await this.mempoolfiltertxsService.getMessagesSince(sessionId, lastEventId, time);
		messages.map((message) => {
			sseHandler.send(message, message.id);
		});
	}

 
	removeSession(sessionId) {
		if (this.sseSessionMapping.get(sessionId)) {
			this.sseSessionMapping.delete(sessionId)
		}
	}

	getSession(sessionId) {
		return this.sseSessionMapping.get(sessionId);
	}

	getTime() {
		return Math.round((new Date()).getTime() / 1000);
	}

 
	async notifyAllHandlers(payload: { type: string, h: string, rawtx?: any, tx: string} | any, sessionIdsObj) {
		// Create all the events in the mempool
		let eventIdsArr: Array<{ id: any, sessionId: string }> = [];
		let eventIdsMap: {  [sessionId: string] : { id: any, sessionId: string } } = {};
		// Save this transaction into mempool db cache if enabled
		if (cfg.enableMempoolDbCache) {
			eventIdsArr = await this.mempoolfiltertxsService.createForSessionIds(payload.h, payload.rawtx, sessionIdsObj);
		}
		eventIdsArr.map((item) => {
			eventIdsMap[item.sessionId] = item;
		});
 
		for (const prop in sessionIdsObj) {
			if (!sessionIdsObj.hasOwnProperty(prop)) {
				continue;
			}
			const session = this.getSession(prop);
			if (session) {
				const time = this.getTime();
 
				session.lastId = Math.max(session.lastId, eventIdsMap[prop] && eventIdsMap[prop].id ? eventIdsMap[prop].id : 0) + 1,
				session.lastTime = time;
				const payloadWithTime = Object.assign({}, payload, { id: session.lastId, time: time } );
				session.sseHandler.send(payloadWithTime, session.lastId);
			}
		}
	};

	addBaseFilterForSession(filter, sessionId) {
		let mapping = this.baseFilterMapping.get(filter);
		if (!mapping) {
			this.baseFilterMapping.set(filter, new Map());
			mapping = this.baseFilterMapping.get(filter);
		}
		mapping.set(sessionId, (new Date()).getTime());
	}

	addOutputFilter(outputFilters, sessionId) {
		const arrOutputFilters = outputFilters;
		for (const o of arrOutputFilters) {
			let mapping = this.outputFilterMapping.get(o);
			if (!mapping) {
				this.outputFilterMapping.set(o, new Map());
			    mapping = this.outputFilterMapping.get(o);
			}
			mapping.set(sessionId, (new Date()).getTime());
		}
	}

	getBlockPayload(blockheader) {
		return  {
			type: 'blockheader',
			blockheader: blockheader
		};
	}


 	getTxPayload(tx) : { type: string, h: string, rawtx?: any, tx: string} {

		const rawtx = tx.toString();
		let payload = {
			type: 'tx',
			h: tx.hash,
			rawtx: rawtx,
			tx: '/api/v1/tx/' + tx.hash + '?rawtx=1'
		}
		if (rawtx.length <= 10000) {
			payload.rawtx = rawtx;
		}
		return payload;
	}

	static isMatchedFilter(tx, filter){
		if (!filter) {
			return true;
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

	static async matchesOutputAddress(tx, map) {
		let sessionIds = [];
		for (const out of tx.outputs) {
			const hex = out.script.toHex();
			if (hex.length > 128) {
				continue;
			}
			const sessionIdsMap = map.get(out.script.toHex());
			if (sessionIdsMap) {
				sessionIds = sessionIds.concat([ ...sessionIdsMap.keys() ]);
			}
		}
		return sessionIds;
	}

	static async matchesTxoMap(tx, map) {
		let sessionIds = [];
		for (const input of tx.inputs) {
			const sessionIdsMap = map.get(input.prevTxId.toString('hex') + '-' + input.outputIndex);
			if (sessionIdsMap) {
				sessionIds = sessionIds.concat([ ...sessionIdsMap.keys() ]);
			}
		}
		return sessionIds;
	}

	async dedupSessionMatches(toNotifyBaseFilterSessionIds, outputFilterMatchSessionIds){
		const finalToNotifySessionIds = {};
		// For all sessions that matched the base filter
		// Only notify those sessions that do not have an output filter
		for (const sessionId in toNotifyBaseFilterSessionIds) {
			if (!toNotifyBaseFilterSessionIds.hasOwnProperty(sessionId)) {
				continue;
			}
			finalToNotifySessionIds[sessionId] = true;
		}
		for (const sessionId in outputFilterMatchSessionIds) {
			if (!outputFilterMatchSessionIds.hasOwnProperty(sessionId)) {
				continue;
			}
			finalToNotifySessionIds[sessionId] = true;
		}
		return finalToNotifySessionIds;
	}

	static async matchesOutputTxidScriptHash(tx, map): Promise<any> {
		if (map.get(tx.hash)) {
			return true;
		}
		let sessionIds = [];
		for (const input of tx.inputs) {
			const sessionIdsMap = map.get(input.prevTxId.toString('hex'));
			if (sessionIdsMap) {
				sessionIds = sessionIds.concat([ ...sessionIdsMap.keys() ]);
			}
		}
		for (const output of tx.outputs) {
			const scriptHash = bsv.crypto.Hash.sha256(output.script.toBuffer()).reverse().toString('hex');
			const sessionIdsMap = map.get(scriptHash);
			if (sessionIdsMap) {
				sessionIds = sessionIds.concat([ ...sessionIdsMap.keys() ]);
			}
		}
		return sessionIds;
	}

	// Notify all sse handlers needed for this tx
	public async notify(tx) {
		// Do not notify if we processed it already recently
		// This is to handle the case where multiple bitcoind's are connected
		if (this.newLru.get(tx.hash)) {
			return;
		}
		this.newLru.set(tx.hash, true);

		let toNotifyBaseFilterSessionIds = {};
		for (const filter of this.baseFilterMapping.keys()) {
			if (TxFilterMatcher.isMatchedFilter(tx, filter)) {
				this.baseFilterMapping.get(filter).forEach((value, key) => {
					toNotifyBaseFilterSessionIds[key] = true;
				})
			}
		}
		let outputFilterMatchSessionIds = {};
		const m = await TxFilterMatcher.matchesOutputAddress(tx, this.outputFilterMapping);
		const n = await TxFilterMatcher.matchesTxoMap(tx, this.outputFilterMapping);
		const o = await TxFilterMatcher.matchesOutputTxidScriptHash(tx, this.outputFilterMapping);

		m.forEach((item) => {
			outputFilterMatchSessionIds[item] = true;
		});
		n.forEach((item) => {
			outputFilterMatchSessionIds[item] = true;
		});
		o.forEach((item) => {
			outputFilterMatchSessionIds[item] = true;
		});
		 
		// Remove the sessions to notify that have a filter set and an outputFilter but both do not match
		// This behaves same way as the bitcoinfiles api block filter.
		// When a filter (hex) is set and the outputFilter is set then both must match (AND)
		const cleanedSessionIds = await this.dedupSessionMatches(toNotifyBaseFilterSessionIds, outputFilterMatchSessionIds);
		let c = 0;
		for (const p in cleanedSessionIds) {
			if (!cleanedSessionIds.hasOwnProperty(p)) {
				continue;
			}
			c++;
		}
		if (c) {
			this.notifyAllHandlers(this.getTxPayload(tx), cleanedSessionIds);
		}
		if (c && (m.length || n.length || o.length)) {
			this.logger.debug('notifyTx', { txid: tx.hash, m, n, o });
			this.logger.debug('cleanedSessionIds', { cleanedSessionIds });
		}
	}

	notifyBlockHeader(header) {
		// Do not send duplicates
		if (this.blockLru.get(header)) {
			return;
		}
		this.blockLru.set(header, true);

		const toNotifySessionIds = {};
		for (const filter of this.baseFilterMapping.keys()) {
			this.baseFilterMapping.get(filter).forEach((item) => {
				toNotifySessionIds[item] = true;
			})
		}
		for (const outputFilter of this.outputFilterMapping.keys()) {
			this.outputFilterMapping.get(outputFilter).forEach((item) => {
				toNotifySessionIds[item] = true;
			})
		}
		this.notifyAllHandlers(this.getBlockPayload(header), toNotifySessionIds);
	}

	mempoolFilteredGarbageCollector() {
		const CYCLE_TIME_SECONDS = 60;
		const DELETE_FROM_CREATED_AT_TIME_DB = 60 * 60; // 1 hour
		setTimeout(async () => {
			try {
				this.logger.debug("mempoolFilteredGarbageCollector");
				await this.mempoolfiltertxsService.deleteExpiredOlderThan(DELETE_FROM_CREATED_AT_TIME_DB);
				this.cleanExpiredFromMaps();
			} finally {
				this.mempoolFilteredGarbageCollector();
			}
		}, 1000 * CYCLE_TIME_SECONDS)
	}

	garbageCollector() {
		const GARBAGE_CYCLE_TIME_SECONDS = 60 * 60;
		setTimeout(() => {
			try {
				this.cleanExpiredFromMaps();
			} finally {
				this.garbageCollector();
			}
		}, 1000 * GARBAGE_CYCLE_TIME_SECONDS)
	}

	cleanExpiredFromMaps() {
		const AGE_SECONDS = 3600 * 24;// 24 hours
 
	    this.sseSessionMapping.forEach((value, key, map) => {
			if (value.lastConnectedTime < (new Date()).getTime() - (1000 * AGE_SECONDS)) {
				this.logger.debug('cleanExpiredFromMaps.sseSessionMapping', { key });
				map.delete(key);
			}
		});

		this.baseFilterMapping.forEach((value, key, map) => {
			value.forEach((innerValue, innerKey, innerMap) => {
				if (innerValue < (new Date()).getTime() - (1000 * AGE_SECONDS)) {
					this.logger.debug('cleanExpiredFromMaps.baseFilterMapping', { innerKey });
					innerMap.delete(innerKey);
				}
			});
			if (!value.size) {
				this.logger.debug('cleanExpiredFromMaps.baseFilterMapping.value.size', { key });
				map.delete(key);
			}
		});

		this.outputFilterMapping.forEach((value, key, map) => {
			value.forEach((innerValue, innerKey, innerMap) => {
				if (innerValue < (new Date()).getTime() - (1000 * AGE_SECONDS)) {
					this.logger.debug('cleanExpiredFromMaps.outputFilterMapping', { innerKey } );
					innerMap.delete(innerKey);
				}
			});
			if (!value.size) {
				this.logger.debug('cleanExpiredFromMaps.outputFilterMapping.value.size', { key } );
				map.delete(key);
			}
		});
	}
}
 