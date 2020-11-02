import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import { sync_state } from '../../../core/txsync';
import { IAccountContext } from '@interfaces/IAccountContext';

@Service('getTxsBySyncState')
export default class gGtTxsBySyncState extends UseCase {

  constructor(
    @Inject('txsyncService') private txsyncService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params: { offset?: any, limit?: any, accountContext?: IAccountContext, syncState?: any | 'pending' | 'failure' | 'success' | 'none'}): Promise<UseCaseOutcome> {
    let syncState = 1;
    if (params.syncState === 'failure') {
      syncState = sync_state.sync_fail;
    }
    if (params.syncState === 'pending') {
      syncState = sync_state.sync_pending;
    }
    if (params.syncState === 'success') {
      syncState = sync_state.sync_success;
    }
    if (params.syncState === 'none') {
      syncState = sync_state.sync_none;
    }
    let txs = await this.txsyncService.getTxsBySyncState(params.accountContext, 
      params.offset ? params.offset : 0,
      params.limit ? params.limit : 10000,
      syncState
      );
    return {
      success: true,
      result: txs
    };
  }
}
