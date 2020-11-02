import { IAccountContext } from '@interfaces/IAccountContext';
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';

@Service('getTxoutsByAddress')
export default class GetTxoutsByAddress extends UseCase {

  constructor(
    @Inject('txoutService') private txoutService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params: { address: string, offset: any, script?: boolean, limit: any, unspent?: boolean, accountContext?: IAccountContext}): Promise<UseCaseOutcome> {
    let entities = await this.txoutService.getTxoutByAddress(params.accountContext, params.address, params.offset, params.limit, params.script, params.unspent);
    return {
      success: true,
      result: entities
    };
  }
}
