import { IAccountContext } from '@interfaces/IAccountContext';
import contextFactory from '../../../bootstrap/middleware/di/diContextFactory';
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';

@Service('getSystemStatus')
export default class GetSystemStatus extends UseCase {

  constructor(

    @Inject('logger') private logger) {
    super();
  }

  public async run(params?: {systemContext?: IAccountContext}): Promise<UseCaseOutcome> {

    return {
      success: true,
      result: contextFactory.getContexts(params.systemContext)
    };
  }
}
