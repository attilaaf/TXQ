import { IAccountContext } from '@interfaces/IAccountContext';
import { TxFormatter } from '../../helpers/TxFormatter';
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import * as bsv from 'bsv';
import { isNull } from 'util';

@Service('getUnspentTxidsByScriptHash')
export default class GetUnspentTxidsByScriptHash extends UseCase {

  constructor(
    @Inject('txoutService') private txoutService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params: {
    scripts: string,
    accountContext?: IAccountContext
  }): Promise<UseCaseOutcome> {
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
 
    let entities = await this.txoutService.getUnspentTxidsByScriptHash(params.accountContext, scripthashes);
 
    return {
      success: true,
      result: entities
    };
  }
}
