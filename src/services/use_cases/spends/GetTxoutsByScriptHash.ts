import { IAccountContext } from '@interfaces/IAccountContext';
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
@Service('getTxoutsByScriptHash')
export default class GetTxoutsByScriptHash extends UseCase {

  constructor(
    @Inject('txoutService') private txoutService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params: {
    scripthash: string,
    offset: any,
    script?: boolean,
    limit: any,
    accountContext?: IAccountContext,
    unspent?: boolean}): Promise<UseCaseOutcome> {
    let entities = await this.txoutService.getTxoutByScriptHash(params.accountContext, params.scripthash, params.offset, params.limit, params.script, params.unspent);
    return {
      success: true,
      result: entities
    };
  }
}
