import { Service, Inject } from 'typedi';
import { UseCase } from '../../UseCase';
import { UseCaseOutcome } from '../../UseCaseOutcome';
import { Address, Hash } from 'bsv';
import { TxHelpers } from '../../../helpers/TxHelpers';
import { isNull } from 'util';
@Service('getBalanceByScriptHashOrAddressArray')
export default class GetBalanceByScriptHashOrAddressArray extends UseCase {

  constructor(
    @Inject('txService') private txService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params: { scripts: string }): Promise<UseCaseOutcome> {
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

    const balances = await this.txService.getBalanceByScriptHash(scripthashes, params);

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
