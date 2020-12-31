import { Service, Inject } from 'typedi';
import InvalidParamError from '../error/InvalidParamError';

import { IAccountContext } from '@interfaces/IAccountContext';
import { ISummaryStats } from '@interfaces/ISummaryStats';

@Service('statsService')
export default class StatsService {
  constructor(@Inject('txfilterModel') private txfilterModel, @Inject('logger') private logger) {}
  
  public async getSummaryStats(accountContext: IAccountContext) {

    const summaryStats: ISummaryStats = {
      summary: {
        from: 0,
        to: 0,
        transactionData: {
          txCount: 0,
          txSize:  0,
          confirmed:  0,
          unconfirmed:  0,
          expired: 0,
          orphaned: 0,
        }
      }
    };
 
    return summaryStats;
  }
}
