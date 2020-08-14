import { Service, Inject } from 'typedi';
import { Response, Request } from 'express';
import { SSEHandler } from '../../services/helpers/SSEHandler';

export enum EventTypes {
  updatetx = 'updatetx',
  newtx = 'newtx',
}

export interface SessionSSEPayload {
  id: number,
  data: any,
};

export interface SessionSSEHandler {
  time: number,
  handler: any,
};

export interface SessionSSEData {
    largestId: number;  // track the most recent event id
    time: number; // Track last used time (to be used to delete sseHandlers when expired)
    sseHandlers: SessionSSEHandler[]; // All SSE sessions for this channel
    events: Array<SessionSSEPayload> // Events buffered to serve for last-event-id and history
};

@Service('eventService')
export default class EventService {
  private initialized;
  private channelMapEvents: Map<string, SessionSSEData> = new Map();
  constructor(
    @Inject('logger') private logger) {

    this.initialize();
  }

  public initialize() {
    if (this.initialized) {
      return;
    }
    this.garbageCollector();
    this.initialized = true;
  }

  /**
   * Push an event to the queue channel
   * @param channel Channel to push event to
   * @param event Event must be an object with property 'id'. 'id' is used in the `last-event-id` and `id` field
   */
  public pushChannelEvent(channel: string, event: { eventType: string, entity: any }, id = -1) {
    let channelStr = this.initChannel(channel);
    const channelData = this.getChannelData(channel);
    const nextChannelStreamId = id !== -1 ? id : channelData.largestId + 1;
    channelData.events.push({
        id: nextChannelStreamId, // Take the id of the underlying stream, not the object
        data: event,
    });
    channelData.largestId = Math.max(channelData.largestId, nextChannelStreamId);
    for (const sseHandler of channelData.sseHandlers) {
      sseHandler.handler.send(event, nextChannelStreamId);
    }
    this.removeOldChannelEvents(channelStr);
  }

  /**
   * Remove old events. If a client wants old events they can query with the API for anything else.
   * @param channel Channel to prune old events
   */
  public removeOldChannelEvents(channel: string) {
    const channelData = this.getChannelData(channel);
    // start truncating once in a while only
    const checkLimit = 15000;
    const truncateMax = 10000;
    if (channelData.events.length > checkLimit) {
      channelData.events = channelData.events.slice(truncateMax)
    }
  }

  public getChannelEventLargestId(channel: string) {
    const channelData = this.getChannelData(channel);
    return channelData.largestId;
  }

  public getChannelMissedMessages(channel: string, lastEventId: number, largestChannelEventId: number) {
    const missedMessages = [];
    const channelData = this.getChannelData(channel);
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

  /**
   * Connect SSE socket to listen for queue channel events
   */
  public async handleSSEChannelEvents(channel: string, req: Request, res: Response) {
    const sseHandler = new SSEHandler(['connected'], {});
    this.logger.info('handleSSEChannelEvents', {
      message: 'new_sse_channel_session',
      channel: channel,
    });
    const largestId = this.getChannelEventLargestId(channel);
    await sseHandler.init(req, res, largestId, async (lastEventId: number, largestChannelEventId, cb?: Function) => {
      this.logger.info('handleSSEChannelEvents', {
        lastEventId: lastEventId,
        largestChannelEventId: largestChannelEventId,
      });
      cb && cb(this.getChannelMissedMessages(channel, lastEventId, largestChannelEventId));
    });
    this.getChannelData(channel);
    this.channelMapEvents.get(channel).sseHandlers.push({
      time: (new Date()).getTime(),
      handler: sseHandler
    });
  }

  private initChannel(channel: string): string {
    let channelStr = channel;
    if (!channel) {
      channelStr = '';
    }
    const channelData = this.channelMapEvents.get(channelStr);
    if (!channelData) {
        this.channelMapEvents.set(channelStr, {
          largestId: 0,
          time: (new Date()).getTime(),
          sseHandlers: [],
          events: [],
        });
    }
    return channelStr;
  }

  private getChannelData(channel: string): SessionSSEData {
    let channelStr = channel;
    if (!channel) {
      channelStr = '';
    }
    let channelData = this.channelMapEvents.get(channelStr);
    if (!channelData) {
        this.channelMapEvents.set(channelStr, {
          largestId: 0,
          time: (new Date()).getTime(),
          sseHandlers: [],
          events: [],
        });
        channelData = this.channelMapEvents.get(channelStr);
    }
    return channelData;
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
		}, 1000 * GARBAGE_CYCLE_TIME_SECONDS)
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
