import { IAccountContext } from '@interfaces/IAccountContext';
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import { Address, Hash } from 'bsv';
import { TxHelpers } from '../../helpers/TxHelpers';
import { isNull } from 'util';
import * as bsv from 'bsv';

@Service('getBalanceByScriptHashes')
export default class GetBalanceByScriptHashes extends UseCase {

  constructor(
    @Inject('txoutService') private txoutService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params: { scripts: string, accountContext?: IAccountContext }): Promise<UseCaseOutcome> {
    console.log('run get balance by scripthashes', params.accountContext);
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
        console.log('ex', ex.stack);
      }
      return null; //return null if neither address nor script hash to filter out result
    }).filter(n => !isNull(n));

    console.log('balanaces', scripthashes);
    const balances = await this.txoutService.getBalanceByScriptHashes(params.accountContext, scripthashes);
    console.log('balanace 2s', balances);
    for (const balance of balances) {
      if (scriptHashToAddress[balance.scripthash]) {
        balance.address = scriptHashToAddress[balance.scripthash];
      }
    }
    return {
      success: true,
      result: balances
    };
 
  }
}
