import { Service, Inject } from 'typedi';
import { IAccountContext } from '@interfaces/IAccountContext';

@Service('outpointmonitorService')
export default class OutpointmonitorService {
  constructor(@Inject('outpointmonitorModel') private outpointmonitorModel, @Inject('logger') private logger) {}
 
  public async getAll(accountContext: IAccountContext): Promise<string[]> {
    return this.outpointmonitorModel.getAll(accountContext);
  }
}
