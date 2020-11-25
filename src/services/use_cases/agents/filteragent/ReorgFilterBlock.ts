import { Service, Inject } from 'typedi';
import { UseCase } from '../../UseCase';
import { UseCaseOutcome } from '../../UseCaseOutcome';

@Service('reorgFilterBlock')
export default class ReorgFilterBlock extends UseCase {
  constructor(
    @Inject('txfiltermanagerService') private txfiltermanagerService,
    @Inject('logger') private logger) {
    super();
  }
  public async run(params?: {
    height: number,
    db: any,
  }): Promise<UseCaseOutcome> {
    this.logger.debug("reorgFilterBlock", {  height: params.height });
    const start = (new Date()).getTime();
    const projects: any = await this.txfiltermanagerService.getAllProjects();
    const results = await this.txfiltermanagerService.processReorg(projects, params);
    const end = (new Date()).getTime();
    const duration = (end - start) / 1000;
    this.logger.debug("reorgFilterBlock", {  height: params.height, duration });
    return {
      success: true,
      result: {
        results,
        duration: (end - start) / 1000
      }
    };
  }
}
