import { IAccountContext } from '@interfaces/IAccountContext';
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';

@Service('incrementTxRetries')
export default class IncrementTxRetries extends UseCase {
  constructor(
    @Inject('txsyncService') private txsyncService,
    @Inject('logger') private logger
  ) {
    super();
  }

  public async run(params: {
    txid: string,
    accountContext?: IAccountContext
  }): Promise<UseCaseOutcome> {
    await this.txsyncService.incrementRetries(
      params.accountContext,
      params.txid
    );
    return {
      success: true
    }
  }
}
