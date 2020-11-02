import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import { TxFormatter } from '../../../services/helpers/TxFormatter';
import { IAccountContext } from '@interfaces/IAccountContext';
@Service('getUtxosByGroup')
export default class GetUtxosByGroup extends UseCase {

  constructor(
    @Inject('txoutService') private txoutService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params: { groupname: string, script?: boolean, limit: any, offset: any, accountContext?: IAccountContext}): Promise<UseCaseOutcome> {
    let entities = await this.txoutService.getTxoutsByGroup(params.accountContext, { ...params, unspent: true});
    let utxoFormatted = [];
    utxoFormatted = entities.map((e) => {
      return TxFormatter.formatTxoutWithEmbeddedStatusHeight(e);
    })
    return {
      success: true,
      result: utxoFormatted
    };
  }
}
