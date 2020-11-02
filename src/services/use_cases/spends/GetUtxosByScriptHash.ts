import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import { TxFormatter } from '../../../services/helpers/TxFormatter';
import { IAccountContext } from '@interfaces/IAccountContext';
@Service('getUtxosByScriptHash')
export default class GetUtxosByScriptHash extends UseCase {

  constructor(
    @Inject('txoutService') private txoutService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params: { scripthash: string, script?: boolean, limit: any, offset: any, accountContext?: IAccountContext}): Promise<UseCaseOutcome> {
    let entities = await this.txoutService.getTxoutByScriptHash(params.accountContext, params.scripthash, params.offset, params.limit, params.script, true);
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
