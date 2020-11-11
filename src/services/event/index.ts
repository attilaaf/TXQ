import { Service, Inject } from 'typedi';
import { Response, Request } from 'express';
import { SSEHandler } from '../../services/helpers/SSEHandler';
import { IAccountContext } from '@interfaces/IAccountContext';
import contextFactory from '../../bootstrap/middleware/di/diContextFactory';

export enum EventTypes {
  updatetx = 'updatetx',
  newtx = 'newtx',
}

export interface ISessionSSEPayload {
  id: number;
  data: any;
}

export interface ISessionSSEHandler {
  time: number,
  handler: any,
}

export interface ISessionSSEData {
    largestId: number;  // track the most recent event id
    time: number; // Track last used time (to be used to delete sseHandlers when expired)
    sseHandlers: ISessionSSEHandler[]; // All SSE sessions for this channel
    events: ISessionSSEPayload[]; // Events buffered to serve for last-event-id and history
}

@Service('eventService')
export default class EventService {
  private initialized;
  private channelMapEvents: Map<string, ISessionSSEData> = new Map();
  constructor(
    @Inject('logger') private logger) {

    this.initialize();
  }

  /**
   * Push an event to the queue channel
   * @param channel Channel to push event to
   * @param event Event must be an object with property 'id'. 'id' is used in the `last-event-id` and `id` field
   */
  public pushChannelEvent(accountContext: IAccountContext, channel: string, event: { eventType: string, entity: any }, id = -1) {
    const projectId = contextFactory.getValidatedProjectId(accountContext);
    this.initChannel(projectId, channel);
    const channelData = this.getChannelData(projectId, channel);
    const nextChannelStreamId = id !== -1 ? id : channelData.largestId + 1;
    channelData.events.push({
        id: nextChannelStreamId, // Take the id of the underlying stream, not the object
        data: event,
    });
    channelData.largestId = Math.max(channelData.largestId, nextChannelStreamId);
    for (const sseHandler of channelData.sseHandlers) {
      sseHandler.handler.send(event, nextChannelStreamId);
    }
    this.removeOldChannelEvents(projectId, channel);
  }

  /**
   * Connect SSE socket to listen for queue channel events
   */
  public async handleSSEChannelEvents(accountContext: IAccountContext, channel: string, req: Request, res: Response) {
    const projectId = contextFactory.getValidatedProjectId(accountContext);
    const sseHandler = new SSEHandler(['connected'], {});
    this.logger.info('handleSSEChannelEvents', {
      projectId,
      message: 'new_sse_channel_session',
      channel,
    });
    const largestId = this.getChannelEventLargestId(projectId, channel);
    await sseHandler.init(req, res, largestId, async (lastEventId: number, largestChannelEventId, cb?: Function) => {
      this.logger.info('handleSSEChannelEvents', {
        projectId,
        lastEventId,
        largestChannelEventId,
      });
      if (cb) {
        cb(this.getChannelMissedMessages(projectId, channel, lastEventId, largestChannelEventId));
      }
    });
    this.getChannelData(projectId, channel);

    let channelStr = channel;
    if (!channel) {
      channelStr = '';
    }
    channelStr = projectId + channelStr;

    this.getChannelMapEvents(projectId, channel).sseHandlers.push({
      time: (new Date()).getTime(),
      handler: sseHandler
    });
  }

  private getChannelMapEvents(projectId: string, channel: string) {
    let channelStr = projectId + channel;
    return this.channelMapEvents.get(channelStr);
  }

  private setChannelMapEvents(projectId: string, channel: string, payload: any) {
    let channelStr = projectId + channel;
    this.channelMapEvents.set(channelStr, payload);
  }

  private getChannelEventLargestId(projectId: string, channel: string) {
    const channelData = this.getChannelData(projectId, channel);
    return channelData.largestId;
  }

  private getChannelMissedMessages(projectId: string, channel: string, lastEventId: number, largestChannelEventId: number) {
    const missedMessages = [];
    const channelData = this.getChannelData(projectId, channel);
    if (lastEventId !== 0 && lastEventId <= largestChannelEventId && channelData.events.length) {
      for (let i = 0; i < channelData.events.length; i++) {
          if (channelData[i].id && channelData[i].id >= lastEventId) {
            missedMessages.push(channelData[i]);
          }
      }
    }
    this.logger.error('debug', {
      method: 'getChannelMissedMessages',
      messagesMissed: missedMessages.length,
    });
    return missedMessages;
  }

  private initChannel(projectId: string, channel: string) {
    const channelData = this.getChannelMapEvents(projectId, channel);
    if (!channelData) {
      this.setChannelMapEvents(projectId, channel, {
          largestId: 0,
          time: (new Date()).getTime(),
          sseHandlers: [],
          events: [],
        });
    }
  }

  /**
   * Remove old events. If a client wants old events they can query with the API for anything else.
   * @param channel Channel to prune old events
   */
  private removeOldChannelEvents(projectId: string, channel: string) {
    const channelData = this.getChannelData(projectId, channel);
    // start truncating once in a while only
    const checkLimit = 15000;
    const truncateMax = 10000;
    if (channelData.events.length > checkLimit) {
      channelData.events = channelData.events.slice(truncateMax);
    }
  }

  private getChannelData(projectId: string, channel: string): ISessionSSEData {
    let channelData = this.getChannelMapEvents(projectId, channel);
    if (!channelData) {
        this.setChannelMapEvents(projectId, channel, {
          largestId: 0,
          time: (new Date()).getTime(),
          sseHandlers: [],
          events: [],
        });
        channelData = this.getChannelMapEvents(projectId, channel);
    }
    return channelData;
  }

  private initialize() {
    if (this.initialized) {
      return;
    }
    this.garbageCollector();
    this.initialized = true;
  }

  /**
   * Clean up old sessions
   */
  private garbageCollector() {
		const GARBAGE_CYCLE_TIME_SECONDS = 60;
		setTimeout(() => {
			try {
				this.cleanExpiredFromMaps();
			} finally {
				this.garbageCollector();
			}
		}, 1000 * GARBAGE_CYCLE_TIME_SECONDS);
  }

  /**
   * Delete any old expired sessions and handlers
   */
  private cleanExpiredFromMaps() {
    this.logger.info('cleanExpiredFromMaps', {
      map: this.channelMapEvents
    });
		const AGE_SECONDS = 3600 * 3; // 3 hours
	  this.channelMapEvents.forEach((value, key, map) => {
			if (value.time < (new Date()).getTime() - (1000 * AGE_SECONDS)) {
        // Only delete channel if there are no sse handlers non-expired
				if (!value.sseHandlers.length) {
          map.delete(key);
        }
			}
    });
    // Delete only old/expired sse handlers
		this.channelMapEvents.forEach((value, key, map) => {
      const cleanedHandlers = [];
			for (const handler of value.sseHandlers) {
				if (handler.time < (new Date()).getTime() - (1000 * AGE_SECONDS)) {
          ; // Do nothing, skip because it's expired
          continue;
        }
        cleanedHandlers.push(handler);
			}
			if (cleanedHandlers.length !== value.sseHandlers.length) {
        this.logger.info('cleanExpiredFromMaps', {
          cleanedHandlers: cleanedHandlers.length,
          sseHandlers: value.sseHandlers.length,
        });
        value.sseHandlers = cleanedHandlers;
			}
		});
  }
}
