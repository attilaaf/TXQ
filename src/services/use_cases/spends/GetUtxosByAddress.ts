import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import { ITxOut } from '@interfaces/ITxOut';
import { TxFormatter } from '../../../services/helpers/TxFormatter';
import { IAccountContext } from '@interfaces/IAccountContext';

@Service('getUtxosByAddress')
export default class GetUtxosByAddress extends UseCase {

  constructor(
    @Inject('txoutService') private txoutService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params: { address: string, limit: any, script?: boolean, offset: any, accountContext?: IAccountContext}): Promise<UseCaseOutcome> {
    let entities = await this.txoutService.getTxoutByAddress(params.accountContext, params.address, params.offset, params.limit, params.script, true);
    let utxoFormatted: ITxOut[] = [];
    utxoFormatted = entities.map((e) => {
      return TxFormatter.formatTxoutWithEmbeddedStatusHeight(e);
    })
    return {
      success: true,
      result: utxoFormatted
    };
  }
}
