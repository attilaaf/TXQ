import { IAccountContext } from '@interfaces/IAccountContext';
import * as bsv from 'bsv';
import { exit } from 'process';

export class BitcoinAgent {
  /**
   * The static method that controls the access to the singleton instance.
   *
   * This implementation let you subclass the Singleton class while keeping
   * just one instance of each subclass around.
   */
  public static getInstance(): BitcoinAgent {
    if (!BitcoinAgent.instance) {
      BitcoinAgent.instance = new BitcoinAgent();
      BitcoinAgent.instance.initialize();
    }
    return BitcoinAgent.instance;
  }
  // tslint:disable-next-line: member-ordering
  private static instance: BitcoinAgent;
  private started = false;
  /**
   * The Singleton's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */
  private constructor() {
  }
  public async initialize() {
    //
  }

  public validateBlockAndBeaconHeadersMatch(blockToVerify: { hash?: string, height?: number }, beaconHeaders: any[]) {
    if (!blockToVerify || isNaN(blockToVerify.height) || !beaconHeaders || !beaconHeaders.length) {
      return false;
    }
    if (blockToVerify.hash === beaconHeaders[0].hash && blockToVerify.height === beaconHeaders[0].height) {
      return true;
    }
    return false;
  }

  public async start(params: {
    getConfig: () => Promise<any>,
    open: (config: { startHeight: number, ctx: IAccountContext }) => Promise<any>,
    getBlockByHeight: (params: any, config: { startHeight: number, ctx: IAccountContext}) => Promise<any>;
    getKnownBlockHeaders: (params: any, config: { startHeight: number, ctx: IAccountContext }) => Promise<Array<{hash: string, height: number}>>,
    getBlock: (params: any, config: { startHeight: number, ctx: IAccountContext }) => Promise<string>,
    getBeaconHeaders: (params: any, config: { startHeight: number, ctx: IAccountContext }) => Promise<Array<{ blockhash: string, hash: string, height: number }>>,
    onBlock: (params: any, config: { startHeight: number, ctx: IAccountContext }) => any,
    onReorg: (params: any, config: { startHeight: number, ctx: IAccountContext }) => any,
  }) {
    if (this.started) {
      throw new Error("Already started");
    }
    this.started = true;
    this.eventLoop(params);
    return true;
  }
  public async eventLoop(params: {
    getConfig: () => Promise<any>,
    open: (config: { startHeight: number, ctx: IAccountContext }) => Promise<any>,
    getBlockByHeight: (params: any, config: { startHeight: number, ctx: IAccountContext}) => Promise<any>;
    getKnownBlockHeaders: (params: any, config: { startHeight: number, ctx: IAccountContext }) => Promise<Array<{hash: string, height: number}>>,
    getBlock: (params: any, config: { startHeight: number, ctx: IAccountContext }) => Promise<string>,
    getBeaconHeaders: (params: any, config: { startHeight: number, ctx: IAccountContext }) => Promise<Array<{ blockhash: string, hash: string, height: number }>>,
    onBlock: (params: any, config: { startHeight: number, ctx: IAccountContext }) => any,
    onReorg: (params: any, config: { startHeight: number, ctx: IAccountContext }) => any,
  }) {
    const config = await params.getConfig();
    // let nextBlockHeightToFetch = config.startHeight;
    let blockToVerify: { hash?: string, height?: number } = {};

    const sleeper = (time: number) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, time * 1000);
      });
    };
    const reorgLimit = 4;
    const { kvstore, db } = await params.open(config);
    while (true) {
      try {
        const knownBlockHeaders = await params.getKnownBlockHeaders({kvstore, db, reorgLimit}, config);
        if (knownBlockHeaders.length === 0) {
          blockToVerify.height = null;
          blockToVerify.hash = null;
          const firstRawBlock = await params.getBlockByHeight(config.startHeight, config);
          const firstBlock = bsv.Block.fromString(firstRawBlock)
          await params.onBlock({kvstore, db, height: config.startHeight, block: firstBlock }, config);
          console.log('inserted initial block', config.startHeight);
          continue;
        } else {
          // nextBlockHeightToFetch = knownBlockHeaders[0].height + 1;
          blockToVerify.height = knownBlockHeaders[0].height;
          blockToVerify.hash = knownBlockHeaders[0].hash;
        }
        // Get the last N blockheaders so we can check where to continue from
        const beaconHeaders = await params.getBeaconHeaders({ kvstore, db, height: blockToVerify.height, reorgLimit, limit: 20}, config);
        // If there are no known headers, then just loop
        if (!beaconHeaders.length) {
          console.log('No beacon headers...');
          continue;
        }
        let reorgPoint = null;
        if (!this.validateBlockAndBeaconHeadersMatch(blockToVerify, beaconHeaders)) {
          console.log('Potential reorg detected', blockToVerify, beaconHeaders);
          // The header does not match...find out why
          let lastHeight = beaconHeaders[0].height;
          for (let i = 0; i < beaconHeaders.length; i++) {
            if (blockToVerify.height === beaconHeaders[i].height && blockToVerify.hash !== beaconHeaders[i].hash) {
              reorgPoint =  {
                height: beaconHeaders[i].height
              };
            }
            if (lastHeight < beaconHeaders[i].height) {
              console.log('Beacon header is not in decreasing order', reorgPoint, beaconHeaders);
              throw new Error('Beacon header is not in decreasing order');
            }
            lastHeight = beaconHeaders[i].height;
          }
          if (!reorgPoint) {
            console.log('Reorg failure fatal', reorgPoint, beaconHeaders);
            continue;
          }
        }
        if (reorgPoint) {
          console.log('Reorg detected', reorgPoint);
          await params.onReorg({kvstore, db, reorgPoint}, config);
          continue;
        }

        // Get the next block if available to proceed
        let rawblock = null;
        const nextBlockToFetch = beaconHeaders[0].height + 1;
        try {
          console.log('inserted', nextBlockToFetch);
          rawblock = await params.getBlockByHeight(nextBlockToFetch, config);
        } catch (err) {
            if (err.response && err.response.status === 404) {
              console.log('rawblock 404, trying again later...', nextBlockToFetch);
            } else {
              console.log('rawblock err', err, nextBlockToFetch);
            }
          console.log('contnue getBlockByHeight');
          continue;
        }
        const block = bsv.Block.fromString(rawblock);
        // Now we have a block
        await params.onBlock({kvstore, db, height: nextBlockToFetch, block}, config);
        console.log('inserted done', nextBlockToFetch);
      } catch (err) {
        console.log('err', err);
      } finally  {
        await sleeper(15);
      }
    }
  }
}

let bitcoinAgent = BitcoinAgent.getInstance();
export default bitcoinAgent;
