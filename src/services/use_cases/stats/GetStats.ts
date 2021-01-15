import { IAccountContext } from '@interfaces/IAccountContext';
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';

@Service('getStats')
export default class GetStats extends UseCase {

  constructor(
    @Inject('statsService') private statsService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params?: {accountContext?: IAccountContext, from?: any, to?: any}): Promise<UseCaseOutcome> {
    let result = await this.statsService.getSummaryStats(params.accountContext, params.from, params.to);
    return {
      success: true,
      result: result
    };
  }
}