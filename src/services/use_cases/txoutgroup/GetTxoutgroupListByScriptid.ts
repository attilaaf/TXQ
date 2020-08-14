import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';

@Service('getTxoutgroupListByScriptid')
export default class GetTxoutgroupListByScriptid extends UseCase {

  constructor(
    @Inject('txoutgroupService') private txoutgroupService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params: { scriptid: string }): Promise<UseCaseOutcome> {
    let entities = await this.txoutgroupService.getTxoutgroupNamesByScriptIds(params.scriptid.split(','));
    return {
      success: true,
      result: entities
    };
  }
}
