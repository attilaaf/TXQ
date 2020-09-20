import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import { TxFormatter } from '../../../services/helpers/TxFormatter';
@Service('getUtxosByScriptHash')
export default class GetUtxosByScriptHash extends UseCase {

  constructor(
    @Inject('txoutService') private txoutService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params: { scripthash: string, script?: boolean, limit: any, offset: any }): Promise<UseCaseOutcome> {
    let entities = await this.txoutService.getTxoutByScriptHash(params.scripthash, params.offset, params.limit, params.script, true);
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
