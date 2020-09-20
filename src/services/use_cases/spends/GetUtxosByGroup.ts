import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import { TxFormatter } from '../../../services/helpers/TxFormatter';
@Service('getUtxosByGroup')
export default class GetUtxosByGroup extends UseCase {

  constructor(
    @Inject('txoutService') private txoutService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params: { groupname: string, script?: boolean, limit: any, offset: any }): Promise<UseCaseOutcome> {
    let entities = await this.txoutService.getTxoutsByGroup({ ...params, unspent: true});
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
