import { IAccountContext } from '@interfaces/IAccountContext';
import { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import contextFactory, { ContextFactory } from '../../../bootstrap/middleware/di/diContextFactory';

@Service('checkAndUpgradeDbs')
export default class CheckAndUpgradeDbs extends UseCase {
  constructor(
    @Inject('db') private db: ContextFactory,
    @Inject('logger') private logger) {
    super();
  }

  private async doUpgrade(ctx) {
    const client = await this.db.getClient(ctx);
    let highestVersionResult: any = await client.query(`SELECT * from versions order by version DESC LIMIT 1`);
 
    if (!highestVersionResult || !highestVersionResult.rows || !highestVersionResult.rows[0]) {
      return undefined;
    }

   
    let v = parseInt(highestVersionResult.rows[0].version);
    if (v !== 202012080000) {
      console.log('does not match, skipping', v);
      return undefined;
    }

    let updateSchema: any = await client.query(`
      ALTER TABLE txfilter ADD COLUMN groupname varchar NULL;
      CREATE INDEX idx_txfilter_groupname ON txfilter USING btree (groupname);
      -- Insert versions bootstrap
      INSERT INTO versions(version) VALUES ('202101260000');
    `);
 
    console.log('upgraded', v, ctx);
 
    return v;
  } 

  public async run(params?: {accountContext?: IAccountContext}): Promise<UseCaseOutcome> {
    const results = [];
    const contexts = contextFactory.getContextsConfig();
    for (const projectId in contexts) {
      if (!contexts.hasOwnProperty(projectId)) {
        continue;
      }
 
      if (!contexts[projectId].enabled) {
        continue;
      }
      if (!contexts[projectId].hosts) {
        continue;
      }
 
      const r = await this.doUpgrade({
        projectId,
        apiKey: contexts[projectId].apiKeys ? contexts[projectId].apiKeys[0] : [],
        host: contexts[projectId].hosts[0],
        dbConnection: contexts[projectId].dbConnection
      });
      results.push(r);
    }
 
    return {
      success: true,
      result: results
    };
  }
}
