import { IAccountContext } from '@interfaces/IAccountContext';
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';

@Service('updateTxDlq')
export default class UpdateTxDlq extends UseCase {
  constructor(
    @Inject('txsyncService') private txsyncService,
    @Inject('logger') private logger
  ) {
    super();
  }

  public async run(params: {
    txid: string;
    dlq: string;
    accountContext?: IAccountContext
  }): Promise<UseCaseOutcome> {
    await this.txsyncService.updateDlq(params.accountContext,
      params.txid,
      params.dlq,
    );
    return {
      success: true
    }
  }
}
