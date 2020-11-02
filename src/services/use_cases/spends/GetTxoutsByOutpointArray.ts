import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import InvalidParamError from '../../error/InvalidParamError';
import { TxFormatter } from '../../../services/helpers/TxFormatter';
import { IAccountContext } from '@interfaces/IAccountContext';
@Service('getTxoutsByOutpointArray')
export default class GetTxoutsByOutpointArray extends UseCase {

  constructor(
    @Inject('txoutService') private txoutService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params: { txOutpoints: string, script?: boolean, accountContext?: IAccountContext}): Promise<UseCaseOutcome> {
    let split = params.txOutpoints.split(',');
    const TXOUTPOINT_REGEX = new RegExp(/^([0-9a-fA-F]{64})\_o(\d+)$/);
    const outpoints: Array<{  txid: string, index: number }> = []
    for (const item of split) {
      const match = TXOUTPOINT_REGEX.exec(item);
      if (!match) {
        throw new InvalidParamError(`Outpoint invalid ${item}`);
      }
      const txid = match[1];
      const parsed = parseInt(match[2]);
      outpoints.push({
        txid: txid,
        index: parsed,
      })
    }
    let entities = await this.txoutService.getTxoutsByOutpointArray(params.accountContext, outpoints, params.script);
    return {
      success: true,
      result: TxFormatter.formatTxoutsWithEmbeddedStatusHeight(entities)
    };
  }
}
