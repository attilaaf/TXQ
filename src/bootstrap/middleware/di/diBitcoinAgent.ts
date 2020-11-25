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

  public async start(params: {
    getConfig: () => Promise<{ startHeight: number, ctx: IAccountContext }>,
    open: (config: { startHeight: number, ctx: IAccountContext }) => Promise<{ kvstore?: any, db?: any }>,
    getKnownBlockHeaders: (kvstore: any, db: any, limit: number) => Promise<Array<{hash: string, height: number}>>,
    getBlock: (kvstore: any, db: any, b: string) => Promise<string>,
    getBeaconHeaders: (kvstore: any, db: any, height: number, limit: number) => Promise<Array<{ blockhash: string, hash: string, height: number }>>,
    onBlock: (kvstore: any, db: any, height: number, block: string) => any,
    onReorg: (kvstore: any, db: any, reorg: { lastCommonBlockHash: string, corrrespondingHeight: number }) => any,
  }) {
    if (this.started) {
      throw new Error("Already started");
    }
    this.started = true;
    this.eventLoop(params);
    return true;
  }
  public async eventLoop(params: {
    getConfig: () => Promise<{ startHeight: number, ctx: IAccountContext }>,
    open: (config: { startHeight: number, ctx: IAccountContext }) => Promise<{ kvstore?: any, db?: any }>,
    getKnownBlockHeaders: (kvstore: any, db: any, limit: number) => Promise<Array<{hash: string, height: number}>>,
    getBlock: (kvstore: any, db: any, b: string) => Promise<string>,
    getBeaconHeaders: (kvstore: any, db: any, height: number, limit: number) => Promise<Array<{ blockhash: string, hash: string, height: number }>>,
    onBlock: (kvstore: any, db: any, height: number, block: string) => any,
    onReorg: (kvstore: any, db: any, reorg: { lastCommonBlockHash: string, corrrespondingHeight: number }) => any,
  }) {
    const config = await params.getConfig();
    let nextBlockHeightToFetch = config.startHeight;

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
        console.log('while');
        const knownBlockHeader = await params.getKnownBlockHeaders(kvstore, db, reorgLimit);
        if (knownBlockHeader.length !== 0) {
          nextBlockHeightToFetch = knownBlockHeader[0].height + 1;
        }
        console.log('No beacdddon headers...');
        // Get the last N blockheaders so we can check where to continue from
        const beaconHeaders = await params.getBeaconHeaders(kvstore, db, nextBlockHeightToFetch, reorgLimit);
        // If there are no known headers, then just loop
        if (!beaconHeaders.length) {
          console.log('No beacon headers...');
          continue;
        }
        console.log('No beacon header3rs...');
        const rawblock = await params.getBlock(kvstore, db, beaconHeaders[0].hash);
        const block = bsv.Block.fromString(rawblock);
        console.log('No beacon hetdsaders...');
        // Validate that it matches the beacon header
        if (!block.hash || (block.hash !== beaconHeaders[0].hash)) {
          throw new Error('mismatch blockhash');
        }

        if (nextBlockHeightToFetch !== beaconHeaders[0].height) {
          throw new Error('Mismatch nextBlockHeightToFetch');
        }
        // Now we have a block
        await params.onBlock(kvstore, db, nextBlockHeightToFetch, block);
        console.log('inserted', nextBlockHeightToFetch);

        let commonAncestorBlock: { lastCommonBlockHash: string, corrrespondingHeight: number } = null;
        const updatedKnownBlockHeaders = await params.getKnownBlockHeaders(kvstore, db, reorgLimit);
        console.log('updatedKnownBlockHeaders', updatedKnownBlockHeaders);
        console.log('beaconHeaders', beaconHeaders);

        function checkHeader(beaconHeadersInner: any[], known) {
          for (const beacon of beaconHeadersInner) {
            if (known.height === beacon.height && known.hash === beacon.hash) {
              commonAncestorBlock = {
                lastCommonBlockHash: known.hash,
                corrrespondingHeight: known.height
              };
              return commonAncestorBlock;
            }
          }
          return null;
        }

        for (const known of updatedKnownBlockHeaders) {
          let ch = checkHeader(beaconHeaders, known);
          if (ch) {
            commonAncestorBlock = ch;
            break;
          }
        }
        console.log('commonAncestorBlock', commonAncestorBlock);

        if (!commonAncestorBlock && updatedKnownBlockHeaders.length){
          console.log('Fatal: If there is no ancestor block then we hit re-org limit', reorgLimit);
          exit(-1);
        }
        console.log('reorg point after commonAncestorBlock', commonAncestorBlock);

        if (commonAncestorBlock && updatedKnownBlockHeaders.length) {
          await params.onReorg(kvstore, db, commonAncestorBlock);
        }
        nextBlockHeightToFetch = commonAncestorBlock.corrrespondingHeight + 1;
      } catch (err) {
        console.log('err', err);
      } finally  {
        await sleeper(5);
      }
    }
  }
}

let bitcoinAgent = BitcoinAgent.getInstance();
export default bitcoinAgent;
