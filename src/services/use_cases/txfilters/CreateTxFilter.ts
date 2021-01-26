import { IAccountContext } from '@interfaces/IAccountContext';
import contextFactory from '../../../bootstrap/middleware/di/diContextFactory';
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import * as bsv from 'bsv';

@Service('createTxFilter')
export default class CreateTXFilter extends UseCase {

  constructor(
    @Inject('txfilterService') private txfilterService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params?: { accountContext?: IAccountContext, 
    name: string,
    payload?: string,
    enabled?: boolean,
    groupname?: string,
  }): Promise<UseCaseOutcome> {
    // try to convert from address
    try {
      const address = bsv.Address.fromString(params.payload);
      const s = bsv.Script.fromAddress(address);
      params.payload = s.toBuffer().toString('hex');
    }
    catch (ex)  {
      console.log('ex', ex.stack);
    }

    let result = await this.txfilterService.create(params.accountContext, params);
    return {
      success: true,
      result: result
    };
  }
}
