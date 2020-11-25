import { Service, Inject } from 'typedi';
import { UseCase } from '../../UseCase';
import { UseCaseOutcome } from '../../UseCaseOutcome';
import { Address, Hash } from 'bsv';
import { TxHelpers } from '../../../helpers/TxHelpers';
import { isNull } from 'util';
import tx from 'api/v1/tx';

@Service('getTxoutsByScriptHashOrAddressArray')
export default class GetTxoutsByScriptHashOrAddressArray extends UseCase {

  constructor(
    @Inject('txService') private txService,
    @Inject('electrumService') private electrumService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params: { scripts: string,  limit?: number, offset?: number, order?: 'desc' | 'asc', withSpends: boolean}): Promise<UseCaseOutcome> {
    const scriptHashToAddress = {};
    const split = [...new Set(params.scripts.split(','))];
    let scripthashes = split.map(script => {
      if(script.match(/^[a-f\d]{64}$/i)!==null) {
        return script;
      }
      try {
        const buffer = Address.fromString(script).toTxOutScript().toBuffer();
        const scripthash = Hash.sha256(buffer).reverse().toString('hex');
        scriptHashToAddress[scripthash] = Address.fromString(script).toString();
        return scripthash;
      }
      catch (ex)  {
        ;// Not an address
      }
      return null; //return null if neither address nor script hash to filter out result
    }).filter(n => !isNull(n));

    let txoutsInBlocks = [];
    if (scripthashes.length) {
      txoutsInBlocks = await this.txService.getTxoutsByScriptHash(scripthashes, params);
    }

    if (params.withSpends) {
      const outpoints = txoutsInBlocks.map(o => {
        return o.txid+"_o"+o.index;
      });
      const spends = await this.txService.getTxSpendStatusesOutpoint(outpoints);
      for (let tx of txoutsInBlocks) {
        if (!spends[tx.txid + '_o' + tx.index]) {
          continue;
        }
        tx.spend_txid = spends[tx.txid + '_o' + tx.index].spend_txid;
        tx.spend_height = spends[tx.txid + '_o' + tx.index].spend_height;
        tx.spend_index = spends[tx.txid + '_o' + tx.index].spend_index;
        if (scriptHashToAddress[tx.scripthash]) {
          tx.address = scriptHashToAddress[tx.scripthash];
        }
      }
    }
    return {
      success: true,
      result: TxHelpers.populateExtraArray(txoutsInBlocks)
    };
  }
}
