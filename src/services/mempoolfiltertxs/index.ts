import { Service, Inject } from 'typedi';
 
@Service('mempoolfiltertxsService')
export default class MempoolfiltertxsService {
  constructor(@Inject('mempoolfiltertxsModel') private mempoolfiltertxsModel) {}
 
  public async createForSessionIds(txid: string, rawtx: string, sessionIds: any): Promise<any> {
    const mempoolRecords = [];
     for (const p in sessionIds) {
      if (!sessionIds.hasOwnProperty(p)) {
        continue;
      }
      mempoolRecords.push({
        txid, 
        rawtx,
        sessionId: p
      });
     }
    return this.mempoolfiltertxsModel.createBatch(mempoolRecords);
  }

  public deleteExpiredOlderThan(olderThanSeconds: number): Promise<any> {
    return this.mempoolfiltertxsModel.deleteExpiredOlderThan(olderThanSeconds);
  }

  public getMessagesSince(sessionId: string, lastEventId: any, time: any): Promise<any> {
    return this.mempoolfiltertxsModel.getMessagesSince(sessionId, lastEventId, time);
  }

}
 