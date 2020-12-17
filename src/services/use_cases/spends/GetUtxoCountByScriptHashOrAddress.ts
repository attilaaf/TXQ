import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import { TxFormatter } from '../../helpers/TxFormatter';
import { IAccountContext } from '@interfaces/IAccountContext';
import * as bsv from 'bsv';
import { isNull } from 'util';
import InvalidParamError from '../../../services/error/InvalidParamError';

@Service('getUtxoCountByScriptHashOrAddress')
export default class GetUtxoCountByScriptHashOrAddress extends UseCase {

  constructor(
    @Inject('txoutService') private txoutService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params: { scripts: string, accountContext?: IAccountContext}): Promise<UseCaseOutcome> {
    const scriptHashToAddress = {};
    if (!params.scripts) {
      throw new InvalidParamError();
    }
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

    let counter = await this.txoutService.getTxoutCountByScriptHashOrAddress(params.accountContext, scripthashes, true);
    return {
      success: true,
      result: {
        count: Number(counter)
      }
    };
  }
}
