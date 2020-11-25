import { Pool } from 'pg';
import { Service, Inject } from 'typedi';
 
@Service('blockheaderService')
export default class BlockheaderService {
  constructor(@Inject('blockheaderModel') private blockheaderModel, @Inject('logger') private logger) {}

  public async getBlockHeaders(db: Pool, limit: number = 20): Promise<any> {
    return this.blockheaderModel.getBlockHeaders(db, limit);
  }
}
