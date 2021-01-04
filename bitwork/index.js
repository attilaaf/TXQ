const { Peer, Messages, Inventory, Bitcore } = require('b2p2p');
const bsv = require('bsv');
const es = require('event-stream');
const fs = require('fs');
const ts = require('tail-stream');
const BatchStream = require('batch-stream');
const Stream = require('stream');
const engine = { bpu: require('bpu'), txo: require('txo') };
const RpcClient = require('bitcoind-rpc');
class Bitwork {
	constructor(gene) {
		this.request = { type: [], mempool: new Set() }; // request stub
		this.response = {}; // response stub

		if (!gene || !gene.rpc || !gene.rpc.user || !gene.rpc.pass) {
			console.log("Error: please pass 'rpc.user' and 'rpc.pass' attributes when initializing");
			process.exit(1);
		}

		if (gene.chain) {
			this.chain = gene.chain;
			this.chainPath = this.chain.path ? this.chain.path : process.cwd() + '/chain';
			if (!fs.existsSync(this.chainPath)) fs.mkdirSync(this.chainPath, { recursive: true });
		}

		// RPC
		const rpcconfig = Object.assign(
			{
				protocol: 'http',
				host: '127.0.0.1',
				port: '8332',
			},
			gene && gene.rpc ? gene.rpc : {}
		);
		this.rpc = new RpcClient(rpcconfig);

		// PEER
		let m = new Messages({
			Block: bsv.Block,
			BlockHeader: bsv.BlockHeader,
			Transaction: bsv.Transaction,
			MerkleBlock: bsv.MerkleBlock,
			network: gene.peer && gene.peer.network === 'testnet' ? Bitcore.Networks.testnet : bsv.Networks.defaultNetwork, // gene.peer && gene.peer.network && gene.peer.network === 'testnet' ? bsv.Networks.testnet : bsv.Networks.defaultNetwork,
		});
		let g = Object.assign({
			host: gene.peer.host ? gene.peer.host : '127.0.0.1',
			messages: m,
			port: gene.peer.port ? gene.peer.port : 8333,
			network: gene.peer && gene.peer.network === 'testnet' ? Bitcore.Networks.testnet : undefined,
		}, {});
		this.peer = new Peer(g);
		this.peer.on('disconnect', (e) => {
			console.log('peer disconnected', e);
			setTimeout(() => {
				console.log('Attempting to reconnect peer', gene.peer);
				this.peer.connect();
			}, 15000);
		});
		this.peer.on('error', function (e) {
			console.log('Err', e);
		});
		this.peer.on('notfound', function (e) {
			console.log('notfound', e);
		});
		this.peer.on('reject', function (e) {
			console.log('reject', e);
		});
		this.peer.on('block', async (e) => {
			let header = e.block.header.toObject();
			if (this.onblock) {
				if (this.request.type.includes('block')) {
					let index = this.request.type.indexOf('block');
					if (index > -1) this.request.type.splice(index, 1);
					header.height = this.current_block.height;
				} else if (this.request.type.includes('onblock')) {
					header.height = await this.height(header.hash);
				}
				if (this.parse) {
					let options = {
						i: header.height,
						h: header.hash,
						t: header.time,
					};
					if (gene.chain) {
						this.stream(
							e.block.transactions,
							header.height,
							this.chainPath + '/' + header.height + '.tx',
							header,
							options
						);
					} else {
						let processed = await this.process(e.block.transactions, options);
						this.onblock({ header: header, tx: processed, block: e.block });
					}
				} else {
					this.onblock({ header: header, tx: e.block.transactions, block: e.block });
				}
			}
		});
		this.peer.on('headers', (message) => {
			if (message.headers.length > 0) {
				let headers = message.headers.map((header) => {
					return header.toObject();
				});
				this.response.header = this.response.header.concat(headers);
				let lastHeader = headers[headers.length - 1];
				let nextHash = lastHeader.hash;
				if (this.request.header.at) this.sendHeader(this.response.header);
				else if (typeof this.request.header.to !== 'undefined')
					this.sendHeader(this.response.header);
				else this.header({ from: nextHash }, true);
			} else {
				this.sendHeader(this.response.header);
			}
			let index = this.request.type.indexOf('header');
			if (index > -1) this.request.type.splice(index, 1);
		});
		this.peer.on('tx', async (message) => {
			if (this.request.mempool.has(message.transaction.hash)) {
				if (this.request.type.includes('mempool') && this.response.complete) {
					this.response.mempool.push(message.transaction);
					if (this.onmempool && this.response.mempool.length >= this.mempoolCounter) {
						if (this.parse) {
							if (gene.chain) {
								this.stream(this.response.mempool, 'mempool', this.chainPath + '/mempool.tx');
							} else {
								let processed = await this.process(this.response.mempool);
								this.onmempool({ tx: processed });
								this.onmempool = null;
							}
						} else {
							this.onmempool({ tx: this.response.mempool });
							this.onmempool = null;
						}
						let index = this.request.type.indexOf('mempool');
						if (index > -1) this.request.type.splice(index, 1);
					}
				} else if (this.request.type.includes('onmempool')) {
					if (this.parse) {
						let processed = await this.process([message.transaction]);
						if (processed.length > 0) this.onmempool(processed[0]);
					} else {
						this.onmempool(message.transaction);
					}
				}
			}
		});
		this.peer.on('inv', (message) => {
			if (
				message.inventory[0].type === Inventory.TYPE.TX &&
				this.request.type.includes('mempool')
			) {
				if (!this.response.complete) {
					this.getinv(message);
					this.response.complete = true;
				}
			}
			if (
				message.inventory[0].type === Inventory.TYPE.TX &&
				this.request.type.includes('onmempool')
			) {
				this.getinv(message);
			}
			if (
				message.inventory[0].type === Inventory.TYPE.BLOCK &&
				this.request.type.includes('onblock')
			) {
				this.peer.sendMessage(this.peer.messages.GetData(message.inventory));
			}
		});
		this.peer.connect();
	}
	getinv(message) {
		this.request.mempool = new Set();
		this.mempoolCounter = message.inventory.length;
		message.inventory.forEach((i) => {
			let hash = i.hash.toString('hex').match(/.{2}/g).reverse().join('');
			this.request.mempool.add(hash);
		});
		this.peer.sendMessage(this.peer.messages.GetData(message.inventory));
	}
	process(items, options) {
		return new Promise((resolve, reject) => {
			let p = es.readArray(items).pipe(
				es.map((data, cb) => {
					this.parse(data, options).then((parsed) => {
						cb(null, parsed);
					});
				})
			);
			if (this.filter) p = p.pipe(es.filterSync(this.filter));
			if (this.map)
				p = p.pipe(
					es.mapSync((e) => {
						let mapped = this.map(e);
						let res = Object.assign({ $: mapped }, { tx: e.tx });
						if (e.blk) res.blk = e.blk;
						return res;
					})
				);
			p.pipe(
				es.writeArray(function (err, array) {
					resolve(array);
				})
			);
		});
	}
	invalidate(query) {
		// Invalidate the bitwork chain
		//
		//  query := {
		//    from: <from height>,
		//    to: <to height>,
		//    at: <at height>
		//  }
		//
		return new Promise((resolve, reject) => {
			if (query) {
				let files = [];
				if (query.at) {
					this.resolve(query.at).then(() => {
						let fpath = this.chainPath + '/' + this.current_block.height;
						console.log('fpath = ', fpath);
						if (fs.existsSync(fpath + '.tx')) fs.unlinkSync(fpath + '.tx');
						if (fs.existsSync(fpath + '.json')) fs.unlinkSync(fpath + '.json');
						resolve();
					});
				} else {
					if (query.from) {
						this.resolve(query.from).then(() => {
							let from_height = this.current_block.height;
							if (query.to) {
								this.resolve(query.to).then(() => {
									let to_height = this.current_block.height;
									for (let i = from_height; i <= to_height; i++) {
										let fpath = this.chainPath + '/' + i;
										if (fs.existsSync(fpath + '.tx')) fs.unlinkSync(fpath + '.tx');
										if (fs.existsSync(fpath + '.json')) fs.unlinkSync(fpath + '.json');
									}
									resolve();
								});
							} else {
								fs.readdir(this.chainPath, (err, items) => {
									let blocks = items.filter((item) => {
										return /[0-9]+\.tx/.test(item);
									});
									let heights = blocks.map((b) => {
										return parseInt(b.split(',')[0]);
									});
									let to_height = Math.max.apply(null, heights);
									for (let i = from_height; i <= to_height; i++) {
										let fpath = this.chainPath + '/' + i;
										if (fs.existsSync(fpath + '.tx')) fs.unlinkSync(fpath + '.tx');
										if (fs.existsSync(fpath + '.json')) fs.unlinkSync(fpath + '.json');
									}
									resolve();
								});
							}
						});
					}
				}
			} else {
				reject(`The query must look like this:

  query :=
    | { at: <at height> }
    | { from: <from height> }
    | { from: <from height>, to: <to height> }

        `);
			}
		});
	}
	// For garbage collecting outdated block chainfiles
	// which have just expired out of the chain size
	prune(p) {
		let counter = p ? p : this.chain.prune;
		if (counter) {
			fs.readdir(this.chainPath, (err, items) => {
				let blocks = items.filter((item) => {
					return /[0-9]+\.tx/.test(item);
				});
				if (blocks.length > counter) {
					// find files to delete
					blocks.sort((a, b) => {
						let aa = parseInt(a.split(',')[0]);
						let bb = parseInt(b.split(',')[0]);
						return aa - bb;
					});
					blocks.slice(0, blocks.length - counter).forEach((item) => {
						fs.unlinkSync(this.chainPath + '/' + item);
						fs.unlinkSync(this.chainPath + '/' + item.split('.')[0] + '.json');
					});
				}
			});
		} else {
			console.log(
				"pass the prune count or, must set the 'chain.prune' attribute when initializing"
			);
		}
	}
	state(name, state) {
		fs.writeFile(this.chainPath + '/' + name + '.json', JSON.stringify(state, null, 2), (err) => {
			if (err) console.log('state update error', err);
		});
	}
	// Parse, filter, map
	// Chunk into arrays if "size" is specified.
	// Otherwise return a raw object stream
	transformer(source, name, filename, options) {
		return (size) => {
			let readStream;
			readStream = fs.createReadStream(filename);
			this.state(name, { sync: true }); // update header
			//      // Since the function is not immediately invoked,
			//      // the source stream (chain file) may have already closed
			//      // by the time this function is called.
			//      // Therefore check if it's already closed
			//      // If already closed, create a normal stream
			//      // If stil open (still writing, in case of a large file), create a tailstream
			//      if (!source || source.writableFinished) {
			//        readStream = fs.createReadStream(filename);
			//        this.state(name, { sync: true }) // update header
			//      } else {
			//        readStream = ts.createReadStream(filename, { waitForCreate: true })
			//        source.on("close", () => {
			//          this.state(name, { sync: true }) // update header
			//          readStream.on("eof", () => { readStream.end() }) // close tail stream
			//        })
			//      }
			let stx = readStream.pipe(es.split()).pipe(
				es.map((item, cb) => {
					this.parse(item, options).then((data) => {
						cb(null, data);
					});
				})
			);
			if (this.filter) stx = stx.pipe(es.filterSync(this.filter));
			if (this.map)
				stx = stx.pipe(
					es.mapSync((e) => {
						let mapped = this.map(e);
						let res = Object.assign({ $: mapped }, { tx: e.tx });
						if (e.blk) res.blk = e.blk;
						return res;
					})
				);
			// If 'size' is specified, create a batch stream
			if (size) {
				let batch = new BatchStream({ size: size });
				stx = stx.pipe(batch);
			}
			return stx;
		};
	}
	stream(txs, name, filename, header, options) {
		if (fs.existsSync(filename)) fs.unlinkSync(filename);
		this.state(name, { sync: false }); // update header
		let fileStream = fs.createWriteStream(filename);
		es.readArray(txs)
			.pipe(es.mapSync((data) => data.toString('hex')))
			.pipe(es.join('\n'))
			.pipe(fileStream);
		fileStream.on('close', () => {
			if (header) {
				this.onblock({ header: header, tx: this.transformer(fileStream, name, filename, options) });
			} else {
				this.onmempool({ tx: this.transformer(fileStream, name, filename, options) });
				this.onmempool = null;
			}
		});
	}
	getPeer() {
		return this.peer;
	}
	async sendHeader(res) {
		try {
			let height = await this.height(res[0].hash);
			res.forEach((header, index) => {
				header.height = height + index;
			});
			this.onheader(res);
		} catch (e) {
			throw e;
		}
	}
	height(hash) {
		return new Promise((resolve, reject) => {
			this.rpc.getBlockHeader(hash, function (err, res) {
				if (err) reject(err);
				else resolve(res.result.height);
			});
		});
	}
	hash(height) {
		return new Promise((resolve, reject) => {
			this.rpc.getBlockHash(height, function (err, res) {
				if (err) reject(err);
				else resolve(res.result);
			});
		});
	}
	blockHeader(hash) {
		return new Promise((resolve, reject) => {
			this.rpc.getBlockHeader(hash, function (err, res) {
				if (err) reject(err);
				else resolve(res.result);
			});
		});
	}
	info() {
		return new Promise((resolve, reject) => {
			this.rpc.getBlockchainInfo(function (err, res) {
				if (err) reject(err);
				else resolve(res.result);
			});
		});
	}
	previous(id) {
		return new Promise(async (resolve, reject) => {
			try {
				let hash = await this.resolve(id);
				let h = await this.blockHeader(hash);
				resolve(h.previousblockhash);
			} catch (e) {
				reject(e);
			}
		});
	}
	on(e, cb) {
		if (e === 'ready') {
			this.peer.on('ready', cb);
		} else if (e === 'mempool') {
			if (!this.request.type.includes('onmempool')) this.request.type.push('onmempool');
			this.onmempool = cb;
		} else if (e === 'block') {
			if (!this.request.type.includes('onblock')) this.request.type.push('onblock');
			this.onblock = cb;
		}
	}
	use(name, lambda, arg) {
		if (name === 'parse') {
			if (typeof lambda === 'function') {
				this.parse = lambda;
			} else {
				if (lambda === 'hex') {
					this.parse = async (r) => {
						return r.toString();
					};
				} else if (lambda === 'txo') {
					this.parse = (r, blk) => {
						return engine.txo.fromTx(r.toString(), { h: true }).then(async (t) => {
							if (blk) t.blk = blk;
							return t;
						});
					};
				} else if (lambda === 'bpu' && arg) {
					this.parse = (r, blk) => {
						return engine.bpu.parse(arg(r.toString())).then(async (t) => {
							if (blk) t.blk = blk;
							return t;
						});
					};
				} else if (lambda === 'bob') {
					this.parse = (r, blk) => {
						return engine.bpu
							.parse({
								tx: { r: r.toString() },
								transform: (o, c) => {
									if (c.buf && c.buf.byteLength > 512) {
										o.ls = o.s;
										o.lb = o.b;
										delete o.s;
										delete o.b;
									}
									return o;
								},
								split: [{ token: { s: '|' } }, { token: { op: 106 }, include: 'l' }],
							})
							.then(async (t) => {
								if (blk) t.blk = blk;
								return t;
							});
					};
				}
			}
		} else if (name === 'map') {
			this.map = lambda;
		} else if (name === 'filter') {
			this.filter = lambda;
		}
	}
	mempool() {
		return new Promise((resolve, reject) => {
			if (!this.request.type.includes('mempool')) this.request.type.push('mempool');
			this.response.complete = null;
			this.onmempool = resolve;
			this.response.mempool = [];
			this.peer.sendMessage(this.peer.messages.MemPool());
		});
	}
	resolve(id) {
		return new Promise(async (resolve, reject) => {
			try {
				if (typeof id === 'number') {
					let hash = await this.hash(id);
					let header = await this.blockHeader(hash);
					this.current_block = header;
					resolve(hash);
				} else if (typeof id === 'object') {
					this.current_block = id;
					resolve(id.hash);
				} else {
					this.blockHeader(id)
						.then((header) => {
							this.current_block = header;
							resolve(id);
						})
						.catch((ex) => {
							reject(ex);
						});
				}
			} catch (e) {
				reject(e);
			}
		});
	}

	block(id) {
		return new Promise((resolve, reject) => {
			this.resolve(id)
				.then((hash) => {
					// if chain exists, and already synced, use the chain file
					let blockPathPrefix = this.chainPath + '/' + this.current_block.height;
					if (
						this.chain &&
						fs.existsSync(blockPathPrefix + '.json') &&
						fs.existsSync(blockPathPrefix + '.tx')
					) {
						// read state
						let state = require(blockPathPrefix + '.json');
						if (state.sync) {
							console.log('fetching from bitwork', this.current_block.height);
							let stream = this.transformer(
								null,
								'' + this.current_block.height,
								blockPathPrefix + '.tx',
								{
									i: this.current_block.height,
									h: this.current_block.hash,
									t: this.current_block.time,
								}
							);
							resolve({ header: this.current_block, tx: stream });
							return;
						}
					}
					// if no chain, use P2P
					if (!this.request.type.includes('block')) this.request.type.push('block');
					this.onblock = resolve;
					this.peer.sendMessage(this.peer.messages.GetData.forBlock(hash));
				})
				.catch((e) => {
					reject(e);
				});
		});
	}

	blockoriginal(id) {
		return new Promise((resolve, reject) => {
			this.resolve(id)
				.then((hash) => {
					// if chain exists, and already synced, use the chain file
					let blockPathPrefix = this.chainPath + '/' + this.current_block.height;
					if (
						this.chain &&
						fs.existsSync(blockPathPrefix + '.json') &&
						fs.existsSync(blockPathPrefix + '.tx')
					) {
						// read state
						let state = require(blockPathPrefix + '.json');
						if (state.sync) {
							console.log('fetching from bitwork', this.current_block.height);
							let stream = this.transformer(
								null,
								'' + this.current_block.height,
								blockPathPrefix + '.tx',
								{
									i: this.current_block.height,
									h: this.current_block.hash,
									t: this.current_block.time,
								}
							);
							resolve({ header: this.current_block, tx: stream });
							return;
						}
					}
					console.log('fetching from bitcoin');
					// if no chain, use P2P
					if (!this.request.type.includes('block')) this.request.type.push('block');
					this.onblock = resolve;
					this.peer.sendMessage(this.peer.messages.GetData.forBlock(hash));
				})
				.catch((e) => {
					reject(e);
				});
		});
	}
	header(g, continued) {
		return new Promise(async (resolve, reject) => {
			try {
				if (!continued) {
					this.onheader = resolve;
					this.request.header = g;
					if (!this.request.type.includes('header')) this.request.type.push('header');
					this.response.header = [];
				}
				if (typeof g.at !== 'undefined') {
					let currenthash = await this.resolve(g.at);
					let header = await this.blockHeader(currenthash);
					resolve(header);
				} else if (typeof g.from !== 'undefined') {
					if (continued) {
						let from = await this.resolve(g.from);
						if (typeof g.to !== 'undefined') {
							let to = await this.resolve(g.to);
							this.peer.sendMessage(this.peer.messages.GetHeaders({ starts: [from], stop: to }));
						} else {
							this.peer.sendMessage(this.peer.messages.GetHeaders({ starts: [g.from] }));
						}
					} else {
						let from = await this.previous(g.from);
						if (typeof g.to !== 'undefined') {
							let h = await this.resolve(g.to);
							console.log('from = ', from);
							console.log('h = ', h);
							this.peer.sendMessage(this.peer.messages.GetHeaders({ starts: [from], stop: h }));
						} else {
							this.peer.sendMessage(this.peer.messages.GetHeaders({ starts: [from] }));
						}
					}
				}
			} catch (e) {
				reject(e);
			}
		});
	}
	get(type, ...args) {
		if (type === 'mempool') {
			return this.mempool(...args);
		} else if (type === 'block') {
			return this.block(...args);
		} else if (type === 'header') {
			return this.header(...args);
		} else if (type === 'info') {
			return this.info(...args);
		} else if (type === 'rpc') {
			return new Promise((resolve, reject) => {
				let name = args[0];
				let a = args.length > 1 ? args.slice(1) : [];
				if (this.rpc[name]) {
					this.rpc[name].apply(
						this.rpc,
						a.concat((err, res) => {
							if (err) reject(err);
							else resolve(res.result);
						})
					);
				} else {
					reject('No such JSON-RPC method exists');
				}
			});
		} else {
			console.log('No such method exist', type);
		}
	}
}
module.exports = Bitwork;
