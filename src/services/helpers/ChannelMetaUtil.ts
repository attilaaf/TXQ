import { Request } from "express";

export class ChannelMetaUtil {
    static getChannnelMeta(userReq: Request): { channel: string, metadata: any, tags: any } {
        return ChannelMetaUtil.getChannnelMetaData(userReq.headers);
    }

    static getChannnelMetaData(userReqHeaders): { channel: string, metadata: any, tags: any } {
      let channel = undefined;
      let metadata = undefined;
      let tags = undefined;
      if (userReqHeaders && userReqHeaders.channel) {
        channel = userReqHeaders.channel;
      }
      if (userReqHeaders && userReqHeaders.metadata) {
        try {
          let tmpMetadata: any = userReqHeaders.metadata;
          metadata = JSON.parse(tmpMetadata);
        } catch (ex) {
        }
      }
      if (userReqHeaders && userReqHeaders.tags) {
        try {
          let tmpTags: any = userReqHeaders.tags;
          tags = JSON.parse(tmpTags);
        } catch (ex) {
        }
      }
      return {
        channel,
        metadata,
        tags
      };
  }
}