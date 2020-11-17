import { IAccountContext } from '@interfaces/IAccountContext';
import Container, { Service, Inject } from 'typedi';
import { UseCase } from '../UseCase';
import { UseCaseOutcome } from '../UseCaseOutcome';
import contextFactory from '../../../bootstrap/middleware/di/diContextFactory';
import EnqInitialTxsForSync from './EnqInitialTxsForSync';

@Service('enqInitialTxsForSyncAllProjects')
export default class EnqInitialTxsForSyncAllProjects extends UseCase {

  constructor(
    @Inject('logger') private logger) {
    super();
  }

  public async run(): Promise<UseCaseOutcome> {
    const contexts = contextFactory.getContextsConfig();
    for (const projectId in contexts) {
      if (!contexts.hasOwnProperty(projectId)) {
        continue;
      }
      if (!contexts[projectId].enabled) {
        continue;
      }
      if (contexts[projectId].queue.nosync) {
        continue;
      }
      if (!contexts[projectId].hosts) {
        continue;
      }
      // Just use the first account context to enque
      const queueAccountContext: IAccountContext = {
        projectId,
        apiKey: contexts[projectId].apiKeys ? contexts[projectId].apiKeys[0] : [],
        host: contexts[projectId].hosts[0]
      };
      let enqInitialTxsForSync = Container.get(EnqInitialTxsForSync);
      enqInitialTxsForSync.run({ accountContext: queueAccountContext});
    }
    return {
      success: true,
      result: {}
    };
  }
}
