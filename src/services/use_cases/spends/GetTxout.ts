import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import ResourceNotFoundError from '../../error/ResourceNotFoundError';
import { TxFormatter } from '../../../services/helpers/TxFormatter';
import { IAccountContext } from '@interfaces/IAccountContext';
@Service('getTxout')
export default class GetTxout extends UseCase {

  constructor(
    @Inject('txoutService') private txoutService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params: { txid: string, index: any, script?: boolean, accountContext?: IAccountContext}): Promise<UseCaseOutcome> {
    let entity = await this.txoutService.getTxout(params.accountContext, params.txid, params.index, params.script);
    if (!entity) {
      throw new ResourceNotFoundError();
    }
    return {
      success: true,
      result: [
        {
          ...(TxFormatter.formatTxoutWithEmbeddedStatusHeight(entity))
        }
      ]
    };
  }
}
