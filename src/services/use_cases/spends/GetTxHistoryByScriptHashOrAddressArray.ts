import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import { Address, Hash, Script } from 'bsv';
import * as bsv from 'bsv';
import { isNull } from 'util';
import { IAccountContext } from '@interfaces/IAccountContext';

@Service('getTxHistoryByScriptHashOrAddressArray')
export default class GetTxHistoryByScriptHashOrAddressArray extends UseCase {

  constructor(
    @Inject('txoutService') private txoutService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params: { scripts: string, limit?: any, offset?: any, order?: any, fromblockheight?: any, accountContext?: IAccountContext}): Promise<UseCaseOutcome> {
    const scriptHashToAddress = {};
    const split = [...new Set(params.scripts.split(','))];
    let scripthashes = split.map(script => {
      if(script.match(/^[a-f\d]{64}$/i)!==null) {
        return script;
      }
      try {
        const address = bsv.Address.fromString(script);
        const s = bsv.Script.fromAddress(address);
        const buffer = s.toBuffer();
        const scripthash = bsv.crypto.Hash.sha256(buffer).reverse().toString('hex');
        scriptHashToAddress[scripthash] = bsv.Address.fromString(script).toString();
       
        return scripthash;
      }
      catch (ex)  {
        console.log('ex', ex);
        ;// Not an address
      }
      return null; //return null if neither address nor script hash to filter out result
    }).filter(n => !isNull(n));
    console.log('scripthashes', scripthashes);
    const items = await this.txoutService.getTxHistoryByScriptHash(params.accountContext, scripthashes, params);

    for (const item of items) {
      if (scriptHashToAddress[item.scripthash]) {
        item.address = scriptHashToAddress[item.scripthash];
      }
    }

    return {
      success: true,
      result: items
    };
  }
}
