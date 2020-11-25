import { Service, Inject } from 'typedi';
import { UseCase } from '../../UseCase';
import { UseCaseOutcome } from '../../UseCaseOutcome';
import * as bsv from 'bsv';
import { ITxFilterRequest, ITxFilterResultSet } from '@interfaces/ITxFilterSet';

@Service('ingestFilterBlock')
export default class IngestFilterBlock extends UseCase {

  constructor(
    @Inject('txfiltermanagerService') private txfiltermanagerService,
    @Inject('logger') private logger) {
    super();
  }

  public async run(params?: {
    db: any,
    height: number, 
    block: bsv.Block 
  }): Promise<UseCaseOutcome> {
    const start = (new Date()).getTime();
    this.logger.debug("ingestFilterBlock", { start, height: params.height, blockhash: params.block.hash });
    const txFilterSet: ITxFilterRequest = await this.txfiltermanagerService.getAllFilters();
    const filterResultSet: ITxFilterResultSet = await this.txfiltermanagerService.filterBlock(txFilterSet, params.height, params.block);
    const results = await this.txfiltermanagerService.processUpdatesForFilteredBlock(filterResultSet, params);
    const end = (new Date()).getTime();
    const duration = (end - start) / 1000;
    this.logger.debug("ingestFilterBlock.FINISHED", { duration, height: params.height, blockhash: params.block.hash });
    return {
      success: true,
      result: {
        results,
        duration: (end - start) / 1000
      }
    };
  }
}
