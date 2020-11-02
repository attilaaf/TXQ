import { IAccountContext } from '@interfaces/IAccountContext';
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
@Service('getBalanceByScriptHashes')
export default class GetBalanceByScriptHashes extends UseCase {

  constructor(
    @Inject('txoutService') private txoutService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params: { scripthash: string, accountContext?: IAccountContext }): Promise<UseCaseOutcome> {
    let balance = await this.txoutService.getBalanceByScriptHashes(params.accountContext, params.scripthash.split(','));
    return {
      success: true,
      result: balance
    };
  }
}
