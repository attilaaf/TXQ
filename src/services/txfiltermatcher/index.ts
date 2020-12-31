 
import * as lru from './lru'
import { Inject, Service } from "typedi";
import { SSEHandler } from '../../services/helpers/SSEHandler';
const bsv = require('bsv')

@Service('txfiltermatcherService')
export class TxFilterMatcher {
	private baseFilterMapping;
	private sseSessionMapping;
	private outputFilterMapping;
	private newLru;
	private blockLru;

	constructor(@Inject('logger') private logger) {
		this.sseSessionMapping = new Map();
		this.baseFilterMapping = new Map();
		this.outputFilterMapping = new Map();
		this.newLru = new lru.LRUMap(10000, []);
		this.blockLru = new lru.LRUMap(100, []);
		this.garbageCollector();
	}

	public async createSession(sessionId, filter, resolvedOutputFilter, req, res) {
		this.logger.debug('createSession', { sessionId, filter });
		const newSession = new SSEHandler(['connected'], { sessionId: sessionId});
		let createdNewSession = false;
		let sessionMapping = this.sseSessionMapping.get(sessionId);
		if (!sessionMapping) {
			this.sseSessionMapping.set(sessionId, {
				sseHandler: newSession,
				baseFilter: filter,
				hasOutputfilter: !!resolvedOutputFilter && !!resolvedOutputFilter.length,
				lastConnectedTime: (new Date()).getTime(),
				messageHistory: [],
				lastId: 0
			});
			createdNewSession = true;
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

        this.logger.debug('SessionInit', { createdNewSession, lastId: sessionMapping.lastId} );
		// Initialize this connection with the associated session id
		if (createdNewSession) {
			newSession.init(req, res, sessionMapping.lastId, sessionMapping.messageHistory);
		} else {
			sessionMapping.sseHandler.init(req, res, sessionMapping.lastId, sessionMapping.messageHistory);
		}
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

	notifyAllHandlers(payload, sessionIdsObj) {
		for (const prop in sessionIdsObj) {
			if (!sessionIdsObj.hasOwnProperty(prop)) {
				continue;
			}
			const session = this.getSession(prop);
			if (session) {
				const time = this.getTime();
				session.lastId = session.lastId + 1;
				session.lastTime = time;
				const payloadWithTime = Object.assign({}, payload, { id: session.lastId, time: time } );
				session.messageHistory.push(payloadWithTime); // Save history of messages
				session.sseHandler.send(payloadWithTime, session.lastId);
				// start truncating once we have enough to buffer for reconnecting clients with last-event-id
				const checkLimit = 20000;
				const truncateMax = 10000;
				if (session.messageHistory.length > checkLimit) {
					session.messageHistory = session.messageHistory.slice(truncateMax)
				}
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

 	getTxPayload(tx) {
		const rawtx = tx.toString();
		let payload = {
			type: 'tx',
			h: tx.hash,
			rawtx: undefined,
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

		this.notifyAllHandlers(this.getTxPayload(tx), cleanedSessionIds);
		
		if (m.length && n.length && o.length) {
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
 