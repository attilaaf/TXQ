 
import * as bitwork from 'bitwork';
 
export default class BitworkFactory {
  	constructor( ) {}

	  static getBitworks() {
		let instances = 1;
		if (process.env.BITCOIND_HOST_COUNT  && parseInt(process.env.BITCOIND_HOST_COUNT) > 1) {
			instances = parseInt(process.env.BITCOIND_HOST_COUNT);
		}
		const bitworks = [];
		bitworks.push(new bitwork({
			rpc: {
				host: process.env.BITCOIND_HOST,
				user: process.env.BITCOIND_RPC_USER,
				pass: process.env.BITCOIND_RPC_PASS,
				port: process.env.BITCOIND_RPC_PORT,
			},
			peer: {
				host: process.env.BITCOIND_HOST,
				port: process.env.BITCOIND_PEER_PORT,
				network: process.env.NETWORK && process.env.NETWORK === 'testnet' ? 'testnet' : undefined
			},
		}));
		for (let i = 1; i < instances; i++) {
			bitworks.push(new bitwork({
				rpc: {
					host: process.env['BITCOIND_HOST_' + (i + 1) ],
					user: process.env['BITCOIND_RPC_USER_' + (i + 1) ],
					pass: process.env['BITCOIND_RPC_PASS_' + (i + 1) ],
					port: process.env['BITCOIND_RPC_PORT_' + (i + 1) ],
				},
				peer: {
					host: process.env['BITCOIND_HOST_' + (i + 1) ],
					port: process.env['BITCOIND_PEER_PORT' + (i + 1) ],
					network: process.env.NETWORK && process.env.NETWORK === 'testnet' ? 'testnet' : undefined
				},
			}));
		}
		return bitworks;
	}

 	/*public static async getBitworks(bitcoinds: IBitcoind[]): Promise<any> { 
		const bitworks = [];
		for (const bitcoind of bitcoinds) {
			bitworks.push(new bitwork({
				rpc: {
					host: bitcoind.host,
					user: bitcoind.user,
					pass: bitcoind.password,
					port: bitcoind.port
				},
				peer: {
					host: bitcoind.host,  
					port: bitcoind.peerPort, // process.env.BITCOIND_PEER_PORT,
					network: bitcoind.network //process.env.NETWORK && process.env.NETWORK === 'testnet' ? 'testnet' : undefined
				},
			}));
		}
		return bitworks;
    }*/
}

