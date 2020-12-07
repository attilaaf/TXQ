import { IAccountContext } from '@interfaces/IAccountContext';
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';

@Service('getTxsByChannel')
export default class GetTxsDlq extends UseCase {

  constructor(
    @Inject('txmetaService') private txmetaService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params: {
    channel: string | undefined | null,
    id: any,
    limit: any,
    rawtx: boolean,
    status: any,
    accountContext?: IAccountContext,
    addresses: string[],
    scripthashes: string[],
    txids: string[],
  }): Promise<UseCaseOutcome> {
    let txs = await this.txmetaService.getTxsByChannel(params.accountContext, params.channel, params.id, params.limit, params.status, params.addresses, params.scripthashes, params.txids, params.rawtx);
    return {
      success: true,
      result: txs
    };
  }
}
