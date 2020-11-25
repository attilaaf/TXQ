import { Service, Inject } from 'typedi';
import { UseCase } from '../../UseCase';
import { UseCaseOutcome } from '../../UseCaseOutcome';
import InvalidParamError from '../../../../services/error/InvalidParamError';
import { TxHelpers } from '../../../../services/helpers/TxHelpers';

@Service('getTxoutsByTxidArray')
export default class GetTxoutsByTxidArray extends UseCase {

  constructor(
    @Inject('txService') private txService,
    @Inject('electrumService') private electrumService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params: { txOutpoints: string, withSpends?: boolean }): Promise<UseCaseOutcome> {
    let split = params.txOutpoints.split(',');
    if (split.length > 400) {
      throw new InvalidParamError();
    }
    const TXOUTPOINT_REGEX = new RegExp(/^([0-9a-fA-F]{64})\_o(\d+)$/);
    let outMap = new Map();
    for (const o of split) {
      outMap.set(o, true);
    }
    let txoutsInBlocks = {};
    if (split.length) {
      // If there are outputs not found in mempool, then try blocks db
      if (outMap.size) {
        let remainingTxoutpoints = [];
        outMap.forEach((value, key, map) => {
          const match = TXOUTPOINT_REGEX.exec(key);
          if (!match) {
            throw new InvalidParamError(`Outpoint invalid ${key}. (Ex: "18c2a6eeddbb770e6ec57de933780dd51a0ad438d08c736bb4c55005a065a9e3_o0")`);
          }
          const txid = match[1];
          const parsed = parseInt(match[2]);
          remainingTxoutpoints.push({
            txid: txid,
            index: parsed,
          })
        });
        txoutsInBlocks = await this.txService.getTxouts(remainingTxoutpoints);
      }
    }

    if (params.withSpends) {
      const spends = await this.txService.getTxSpendStatusesOutpoint(split);
      for (const prop in spends) {
        if (!spends.hasOwnProperty(prop)) {
          continue;
        }
        if (txoutsInBlocks[prop] && spends[prop]) {
          txoutsInBlocks[prop].spend_txid = spends[prop].spend_txid;
          txoutsInBlocks[prop].spend_height = spends[prop].spend_height;
          // txoutsInBlocks[prop].spend_blockhash = spends[prop].spend_blockhash,
          txoutsInBlocks[prop].spend_index = spends[prop].spend_index;
        }
      }
    }
    const combinedMempoolBlocks =  { ...txoutsInBlocks }; // Blocks  supersede mempool
    return {
      success: true,
      result: TxHelpers.populateExtra(combinedMempoolBlocks)
    };
  }
}
