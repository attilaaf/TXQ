import { EventEmitter } from "events";

/**
 * Server-Sent Event instance class
 * @extends EventEmitter
 */
export class SSEHandler extends EventEmitter {
    initial;
    options;
  /**
   * Creates a new Server-Sent Event instance
   * @param [array] initial Initial value(s) to be served through SSE
   * @param [object] options SSE options
   */
  constructor(initial, options) {
    super();

    if (initial) {
      this.initial = Array.isArray(initial) ? initial : [initial];
    } else {
      this.initial = [];
    }

    if (options) {
      this.options = options;
    } else {
      this.options = { isSerialized: true };
    }

    this.init = this.init.bind(this);
  }

  /**
   * The SSE route handler
   */
  async init(req, res, lastGlobalId: number, messageHistoryCallback?: Function) {
    req.socket.setTimeout(0);
    req.socket.setNoDelay(true);
    req.socket.setKeepAlive(true);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');
    if (req.httpVersion !== '2.0') {
      res.setHeader('Connection', 'keep-alive');
    }
    if (this.options.isCompressed) {
      res.setHeader('Content-Encoding', 'deflate');
    }

    // Increase number of event listeners on init
    this.setMaxListeners(this.getMaxListeners() + 2);

    const dataListener = data => {
        if (data.id) {
            res.write(`id: ${data.id}\n`);
        } else {
            res.write(`id: -1\n`);
        }
        res.write(`data: ${JSON.stringify(data.data)}\n\n`);
        res.flush();
    };

    const serializeListener = data => {
      const serializeSend = data.reduce((all, msg) => {
        all += `id: -1\ndata: ${JSON.stringify(msg)}\n\n`;
        return all;
      }, '');
      res.write(serializeSend);
    };

    this.on('data', dataListener);
    this.on('serialize', serializeListener);

    let lastEventId = req.headers['last-event-id'] || 0;
    if (lastEventId) {
        lastEventId = parseInt(lastEventId);
        if (lastEventId <= lastGlobalId && messageHistoryCallback) {
          await messageHistoryCallback(lastEventId, lastGlobalId, (messages) => {
            messages.map((message) => {
              this.send(message, message.id);
            });
          });
        }
    } else {
      // Flush down cached mempool >= time
      let time = req.query.time;
      if (time) {
        time = parseInt(time);
        if (time && messageHistoryCallback) {
          await messageHistoryCallback(lastEventId, lastGlobalId, (messages) => {
            messages.map((message) => {
              this.send(message, message.id);
            });
          });

          await messageHistoryCallback(lastEventId, lastGlobalId, (messages) => {
            messages.map((message) => {
              if (message.time && message.time >= time) {
                this.send(message, message.id);
              }
            });
          });
        }
      }
    }
 
    if (this.initial) {
      if (this.options.isSerialized) {
        this.serialize(this.initial);
      } else if (this.initial.length > 0) {
        this.send(this.initial, -1);
      }
    }

    // Remove listeners and reduce the number of max listeners on client disconnect
    req.on('close', () => {
      this.removeListener('data', dataListener);
      this.removeListener('serialize', serializeListener);
      this.setMaxListeners(this.getMaxListeners() - 2);
    });
  }

  /**
   * Update the data initially served by the SSE stream
   * @param {array} data array containing data to be served on new connections
   */
  updateInit(data) {
    this.initial = Array.isArray(data) ? data : [data];
  }

  /**
   * Empty the data initially served by the SSE stream
   */
  dropInit() {
    this.initial = [];
  }

  /**
   * Send data to the SSE
   * @param {(object|string)} data Data to send into the stream
   * @param [string] event Event name
   * @param [(string|number)] id Custom event ID
   */
  send(data, id) {
    this.emit('data', { data, id });
  }

  /**
   * Send serialized data to the SSE
   * @param {array} data Data to be serialized as a series of events
   */
  serialize(data) {
    if (Array.isArray(data)) {
        this.emit('serialize', data);
    } else {
        this.send(data, -2);
    }
  }
}
