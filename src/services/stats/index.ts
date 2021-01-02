import { Service, Inject } from 'typedi';
import { IAccountContext } from '@interfaces/IAccountContext';
import { ISummaryStats } from '@interfaces/ISummaryStats';

@Service('statsService')
export default class StatsService {
  constructor(@Inject('txModel') private txModel, @Inject('logger') private logger) {}
  
  public async getSummaryStats(accountContext: IAccountContext, from?: number, to?: number) {
    if (!from) {
      from = 0;
    }
    if (!to) {
      to = Math.floor((new Date().getTime()) / 1000) + (60 * 10); // Arbitrary date in future if not set
    }
    const txStats: {
      txCount: number,
      txSize: number,
      confirmed: number,
      unconfirmed: number,
      expired: number,
      orphaned: number,
      totalSize: number,
      totalTx: number,
    } = await this.txModel.getTxStats(accountContext, from, to);
    const summaryStats: ISummaryStats = {
      summary: {
        from,
        to,
        transactionData: txStats
      },
      meta: (await this.txModel.getGlobalStats(accountContext))
    };
    return summaryStats;
  }
}
