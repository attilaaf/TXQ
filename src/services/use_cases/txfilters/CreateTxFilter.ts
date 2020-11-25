import { IAccountContext } from '@interfaces/IAccountContext';
import contextFactory from '../../../bootstrap/middleware/di/diContextFactory';
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';

@Service('createTxFilter')
export default class CreateTXFilter extends UseCase {

  constructor(
    @Inject('txfilterService') private txfilterService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params?: { accountContext?: IAccountContext, 
    name: string,
    match_location: number,
    match_type: number,
    payload: string,
    enabled: boolean
  }): Promise<UseCaseOutcome> {
    let result = await this.txfilterService.create(params.accountContext, params);
    return {
      success: true,
      result: result
    };
  }
}
