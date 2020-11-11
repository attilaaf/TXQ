import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import { Response, Request } from 'express';
import { IAccountContext } from '@interfaces/IAccountContext';

@Service('connectChannelClientSSE')
export default class ConnectChannelClientSSE extends UseCase {

  constructor(
    @Inject('eventService') private eventService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params: {
    channel: string,
    req: Request,
    res: Response,
    accountContext?: IAccountContext
  }): Promise<UseCaseOutcome> {

    const session = this.eventService.handleSSEChannelEvents(params.accountContext, params.channel, params.req, params.res);

    return {
      success: true,
      result: session
    };
  }
}
