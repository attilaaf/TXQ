import { IMerchantConfig, IMerchantApiEndpointConfig, IMerchantApiEndpointGroupConfig } from '@interfaces/IConfig';
import * as bsv from 'bsv';
import { MerchantapilogEventTypes } from '../merchantapilog';
import * as axios from 'axios';

/**
 * A policy interface for how to execute broadcasts against merchantapi endpoints
 */
// tslint:disable-next-line: max-classes-per-file
export class MapiGetRequestor {
  constructor(private merchantConfig: IMerchantApiEndpointGroupConfig, protected logger: any, protected responseSaver?: Function) {
  }

  execute(params: any): Promise<any> {
    throw new Error('Missing implementation');
  }

  logError(name, data) {
    if (this.logger) {
      this.logger.error(name, data);
    }
  }

  logInfo(name, data) {
    if (this.logger) {
      this.logger.info(name, data);
    }
  }
}

export class MapiSendRequestor {
  constructor(private merchantConfig: IMerchantApiEndpointGroupConfig, protected logger: any, protected responseSaver?: Function) {
  }

  execute(txid: string, contentType: string, rawtx: Buffer | string): Promise<any> {
    throw new Error('Missing implementation');
  }

  logError(name, data) {
    if (this.logger) {
      this.logger.error(name, data);
    }
  }

  logInfo(name, data) {
    if (this.logger) {
      this.logger.info(name, data);
    }
  }
}


const serialMultiSender = async (contentType: string, url: string, httpVerb: 'post' | 'get', eventType: MerchantapilogEventTypes, endpoints: any[], payload?: any, responseSaver?: Function) => {
  return new Promise(async (resolve, reject) => {
    let responseReturnList = [];
    let validResponseWithSuccessPayload = null;
    let firstValidResponseWithAnyPayload = null;
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < endpoints.length; i++) {
      try {
        let response = null;
        if (httpVerb === 'get') {
          response = await axios.default.get(`${endpoints[i].url}${url}`, {
            headers: {
            ...(endpoints[i].headers),
            'content-type': 'application/json',
            },
            maxContentLength: 52428890,
            maxBodyLength: 52428890
          });
        }
        if (httpVerb === 'post') {
          response = await axios.default.post(`${endpoints[i].url}${url}`, payload, {
            headers: {
              ...(endpoints[i].headers),
              'content-type': 'application/octet-stream',
              },
              maxContentLength: 52428890,
              maxBodyLength: 52428890
          });
        }
        if (responseSaver) {
          await responseSaver(endpoints[i].name, eventType, response.data);
        }
        if (typeof response.data.payload === 'string') {
          response.data.payload = JSON.parse(response.data.payload);
        }
        if (response && response.data && response.data.payload && response.data.payload.returnResult === 'success') {
          const toSave = {...(response.data), mapiName: endpoints[i].name, mapiEndpoint: endpoints[i].url, mapiStatusCode: 200};
          responseReturnList.push(toSave);
          validResponseWithSuccessPayload = toSave;
          if (!firstValidResponseWithAnyPayload) {
            firstValidResponseWithAnyPayload = toSave;
          }
          // Do not break, this ensures all endpoints are sent to
          // break;
        } else if (response && response.data && response.data.payload) {
          const toSave = {...(response.data), mapiName: endpoints[i].name, mapiEndpoint: endpoints[i].url, mapiStatusCode: 200};
          responseReturnList.push(toSave);
          if (!firstValidResponseWithAnyPayload) {
            firstValidResponseWithAnyPayload = toSave;
          }
        } else {
          const toSave = { error: JSON.stringify(response.data), mapiName: endpoints[i].name, mapiEndpoint: endpoints[i].url, mapiStatusCode: 200};
          responseReturnList.push(toSave);
        }
      } catch (err) {
        let code = err && err.response && err.response.status ? err.response.status : 500;
        if (responseSaver) {
          await responseSaver(endpoints[i].name, eventType, { error: err.toString(), stack: err.stack });
        }
        responseReturnList.push({error: err.toString(), mapiName: endpoints[i].name, mapiEndpoint: endpoints[i].url, mapiStatusCode: code});
      }
    }

    const formattedResponse = {
      ...(validResponseWithSuccessPayload || firstValidResponseWithAnyPayload || responseReturnList[0]),
      mapiResponses: responseReturnList
    };
    if (validResponseWithSuccessPayload || firstValidResponseWithAnyPayload) {
      return resolve(formattedResponse);
    } else {
      return reject(formattedResponse);
    }
  });
};

const parallelRaceMultiSender = async (contentType: string, url: string, httpVerb: 'post' | 'get', eventType: MerchantapilogEventTypes, endpoints: any[], payload?: any, responseSaver?: Function) => {
  let responseReturnList = [];
  let validResponseWithSuccessPayload = null;
  let firstValidResponseWithAnyPayload = null;
  const promises = [];
  return new Promise(async (masterResolve, masterReject) => {
    let succeededAtLeastOne = false;
    for (let i = 0; i < endpoints.length; i++) {
      const newPromise = new Promise(async (resolve, reject) => {
        try {
        let response = null;
          if (httpVerb === 'get') {
            response = await axios.default.get(`${endpoints[i].url}${url}`, {
              headers: {
              ...(endpoints[i].headers),
              'content-type': contentType,
              },
              maxContentLength: 52428890,
              maxBodyLength: 52428890
            });
          }
          if (httpVerb === 'post') {
            response = await axios.default.post(`${endpoints[i].url}${url}`, payload, {
              headers: {
                ...(endpoints[i].headers),
                'content-type': contentType,
                },
                maxContentLength: 52428890,
                maxBodyLength: 52428890
            });
          }
          if (responseSaver) {
            await responseSaver(endpoints[i].name, eventType, response.data);
          }
          const sleeper = (async (sec) => {
            return new Promise((resolve, reject) => {
              setTimeout(()=> {
                resolve();
              }, sec * 1000);
            });
          });

          if (typeof response.data.payload === 'string') {
            response.data.payload = JSON.parse(response.data.payload);
          }
          if (response && response.data && response.data.payload && response.data.payload.returnResult === 'success') {
            const toSave = {...(response.data), mapiName: endpoints[i].name, mapiEndpoint: endpoints[i].url, mapiStatusCode: 200};
            responseReturnList.push(toSave);
            validResponseWithSuccessPayload = toSave;
            if (!firstValidResponseWithAnyPayload) {
              firstValidResponseWithAnyPayload = toSave;
              succeededAtLeastOne = true;
              // Do not break, this ensures all endpoints are sent to
              masterResolve(firstValidResponseWithAnyPayload);
            }
            return resolve(toSave);
          } else if (response && response.data && response.data.payload) {
            const toSave = {...(response.data), mapiName: endpoints[i].name, mapiEndpoint: endpoints[i].url, mapiStatusCode: 200};
            responseReturnList.push(toSave);
            if (!firstValidResponseWithAnyPayload) {
              firstValidResponseWithAnyPayload = toSave;
            }
            return resolve(toSave);
          } else {
            const toSave = { error: JSON.stringify(response.data), mapiName: endpoints[i].name, mapiEndpoint: endpoints[i].url, mapiStatusCode: 200};
            responseReturnList.push(toSave);
            return reject(toSave);
          }
        } catch (err) {
          return reject(err);
        }
      });
      promises.push(newPromise);
    }
  
    let promiseSettled =  null;
    Promise.allSettled(promises).then((r) => {
      for (const item of r) {
        if (item.status === 'fulfilled' && item.value && item.value.payload && item.value.payload.result === 'success') {
          return masterResolve(item.value);
        }
      }
      for (const item of r) {
        if (item.status === 'fulfilled' && item.value && item.value.payload && item.value.payload.result !== 'success') {
          return masterResolve(item.value);
        }
      }
      for (const item of r) {
        if (item.status === 'rejected') {
          return masterReject(item.reason);
        }
      }
    });
    return promiseSettled;
  });
};

const backupMultiSender = async (contentType: string, url: string, httpVerb: 'post' | 'get', eventType: MerchantapilogEventTypes, endpoints: any[], payload?: any, responseSaver?: Function) => {
  return new Promise(async (resolve, reject) => {
    let responseReturnList = [];
    let validResponseWithSuccessPayload = null;
    let validResponseWithAnyPayload = null;
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < endpoints.length; i++) {
      try {
        let response = null;
        if (httpVerb === 'get') {
          response = await axios.default.get(`${endpoints[i].url}${url}`, {
            headers: {
              ...(endpoints[i].headers),
              'content-type': contentType,
              },
              maxContentLength: 52428890,
              maxBodyLength: 52428890
          });
        }
        if (httpVerb === 'post') {
          response = await axios.default.post(`${endpoints[i].url}${url}`, payload, {
            headers: {
              ...(endpoints[i].headers),
              'content-type': contentType,
              },
              maxContentLength: 52428890,
              maxBodyLength: 52428890
          });
        }

        if (responseSaver) {
          await responseSaver(endpoints[i].name, eventType, response.data);
        }
        if (typeof response.data.payload === 'string') {
          response.data.payload = JSON.parse(response.data.payload);
        }
        if (response && response.data && response.data.payload && response.data.payload.returnResult === 'success') {
          const toSave = {...(response.data), mapiName: endpoints[i].name, mapiEndpoint: endpoints[i].url, mapiStatusCode: 200};
          responseReturnList.push(toSave);
          validResponseWithSuccessPayload = toSave;
          break;
        } else if (response && response.data && response.data.payload) {
          const toSave = {...(response.data), mapiName: endpoints[i].name, mapiEndpoint: endpoints[i].url, mapiStatusCode: 200};
          validResponseWithAnyPayload = toSave;
          responseReturnList.push(toSave);
        } else {
          const toSave = { error: JSON.stringify(response.data), mapiName: endpoints[i].name, mapiEndpoint: endpoints[i].url, mapiStatusCode: 200};
          responseReturnList.push(toSave);
        }
      } catch (err) {
        let code = err && err.response && err.response.status ? err.response.status : 500;
        if (responseSaver) {
          await responseSaver(endpoints[i].name, eventType, { error: err.toString(), stack: err.stack });
        }
        responseReturnList.push({error: err.toString(), mapiName: endpoints[i].name, mapiEndpoint: endpoints[i].url, mapiStatusCode: code});
      }
    }

    const formattedResponse = {
      ...(validResponseWithSuccessPayload || validResponseWithAnyPayload || responseReturnList[0]),
      mapiResponses: responseReturnList
    };
    if (validResponseWithSuccessPayload || validResponseWithAnyPayload) {
      return resolve(formattedResponse);
    } else {
      return reject(formattedResponse);
    }
  });
};

const backupMultiSenderFeeQuote = async (url: string, httpVerb: 'post' | 'get', eventType: MerchantapilogEventTypes, endpoints: any[], payload?: { rawtx?: string }, responseSaver?: Function) => {
  return new Promise(async (resolve, reject) => {
    let responseReturnList = [];
    let validResponseWithSuccessPayload = null;
    let validResponseWithAnyPayload = null;
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < endpoints.length; i++) {
      try {
        let response = null;
        if (httpVerb === 'get') {
          response = await axios.default.get(`${endpoints[i].url}${url}`, {
            headers: {
              ...(endpoints[i].headers),
              'content-type': 'application/json',
              },
              maxContentLength: 52428890,
              maxBodyLength: 52428890
          });
        }
        if (httpVerb === 'post') {
           
          response = await axios.default.post(`${endpoints[i].url}${url}`, payload, {
            headers: {
              ...(endpoints[i].headers),
              'content-type': 'application/json',
              },
              maxContentLength: 52428890,
              maxBodyLength: 52428890
          });
        }
        if (responseSaver) {
          await responseSaver(endpoints[i].name, eventType, response.data);
        }
        if (typeof response.data.payload === 'string') {
          response.data.payload = JSON.parse(response.data.payload);
        }
        if (response && response.data && response.data.payload && response.data.payload.returnResult !== 'failure') {
          const toSave = {...(response.data), mapiName: endpoints[i].name, mapiEndpoint: endpoints[i].url, mapiStatusCode: 200};
          responseReturnList.push(toSave);
          validResponseWithSuccessPayload = toSave;
          break;
        } else if (response && response.data && response.data.payload) {
          const toSave = {...(response.data), mapiName: endpoints[i].name, mapiEndpoint: endpoints[i].url, mapiStatusCode: 200};
          validResponseWithAnyPayload = toSave;
          responseReturnList.push(toSave);
        } else {
          const toSave = { error: JSON.stringify(response.data), mapiName: endpoints[i].name, mapiEndpoint: endpoints[i].url, mapiStatusCode: 200};
          responseReturnList.push(toSave);
        }
      } catch (err) {
        let code = err && err.response && err.response.status ? err.response.status : 500;
        if (responseSaver) {
          await responseSaver(endpoints[i].name, eventType, { error: err.toString(), stack: err.stack });
        }
        responseReturnList.push({error: err.toString(), mapiName: endpoints[i].name, mapiEndpoint: endpoints[i].url, mapiStatusCode: code});
      }
    }

    const formattedResponse = {
      ...(validResponseWithSuccessPayload || validResponseWithAnyPayload || responseReturnList[0]),
      mapiResponses: responseReturnList
    };
    if (validResponseWithSuccessPayload || validResponseWithAnyPayload) {
      return resolve(formattedResponse);
    } else {
      return reject(formattedResponse);
    }
  });
};

/**
 * Does a sequential loop over all merchantapi's until 1 is successful
 */
// tslint:disable-next-line: max-classes-per-file
export class MapiSendPolicySerialBackup extends MapiSendRequestor {

  constructor(private network: string, private endpointConfigGroup: IMerchantApiEndpointGroupConfig, logger: any, responseSaver?: Function) {
    super(endpointConfigGroup, logger, responseSaver);
  }
  /**
   * Execute this policy for broadcasting
   * @param rawtx Tx to broadcast
   */
  execute(txid: string, contentType: string, rawtx: Buffer | string): Promise<any> {
    let dataPayload: any = { rawtx: rawtx };
    if (contentType === 'application/octet-stream') {
      dataPayload = rawtx;
    }
    return backupMultiSender(contentType, `/mapi/tx`, 'post', MerchantapilogEventTypes.PUSHTX, this.endpointConfigGroup[this.network], dataPayload, (miner, evt, res) => {
        return this.responseSaver(miner, evt, res, txid);
    });
  }
}

/**
 * Does a sequential loop over all merchantapi's until 1 is successful
 */
// tslint:disable-next-line: max-classes-per-file
export class MerchantRequestorFeeQuotePolicySerialBackup extends MapiGetRequestor {
  constructor(private network: string, private endpointConfigGroup: IMerchantApiEndpointGroupConfig, logger: any, responseSaver?: Function) {
    super(endpointConfigGroup, logger, responseSaver);
  }
  execute(): Promise<any> {
    return backupMultiSenderFeeQuote('/mapi/feeQuote', 'get', MerchantapilogEventTypes.FEEQUOTE, this.endpointConfigGroup[this.network], null, (miner, evt, res) => {
      return this.responseSaver(miner, evt, res);
    });
  }
}

/**
 * Does a sequential loop over all merchantapi's until 1 is successful
 */
// tslint:disable-next-line: max-classes-per-file
export class MerchantRequestorStatusPolicySerialBackup extends MapiGetRequestor {
  constructor(private network: string, private endpointConfigGroup: IMerchantApiEndpointGroupConfig, logger: any, responseSaver?: Function) {
    super(endpointConfigGroup, logger, responseSaver);
  }

  /**
   * Execute this policy for broadcasting
   * @param rawtx Tx to broadcast
   */
  execute(txid: string): Promise<any> {
    
    return backupMultiSender('application/octet-stream', `/mapi/tx/${txid}`, 'get', MerchantapilogEventTypes.STATUSTX, this.endpointConfigGroup[this.network], null, (miner, evt, res) => {
      return this.responseSaver(miner, evt, res, txid);
    });
  }
}


/**
 * Sends Status API requests in parallel, logs them async (if enabled), but it returns client response immediately after first reply
 *
 * From the client it will appear as this behaves like a single merchant-api (albet might return different miner id info)
 */
// tslint:disable-next-line: max-classes-per-file
export class MerchantRequestorStatusPolicyRaceToFinishSuccess extends MapiGetRequestor {
  constructor(private network: string, private endpointConfigGroup: IMerchantApiEndpointGroupConfig, logger: any, responseSaver?: Function) {
    super(endpointConfigGroup, logger, responseSaver);
  }
  /**
   * Execute this policy for broadcasting
   * @param rawtx Tx to broadcast
   */
  execute(txid: string): Promise<any> {
    return parallelRaceMultiSender('application/json', `/mapi/tx/${txid}`, 'get', MerchantapilogEventTypes.STATUSTX, this.endpointConfigGroup[this.network], null , (miner, evt, res) => {
      return this.responseSaver(miner, evt, res, txid);
    });
  }
}

/**
 * Sends API requests in parallel, logs them (if enabled) and then returns the authorative result by priority ordering
 *
 * From the client it will appear as this behaves like a single merchant-api (albet might return different miner id info)
 */
// tslint:disable-next-line: max-classes-per-file
export class MapiSendPolicySendAllTakeFirstPrioritySuccess extends MapiSendRequestor {
  constructor(private network: string, private endpointConfigGroup: IMerchantApiEndpointGroupConfig, logger: any, responseSaver?: Function) {
    super(endpointConfigGroup, logger, responseSaver);
  }
  /**
   * Execute this policy for broadcasting
   * @param rawtx Tx to broadcast
   */
  execute(txid: string, contentType: string, rawtx: Buffer | string): Promise<any> {
    let dataPayload: any = { rawtx: rawtx };
    if (contentType === 'application/octet-stream') {
      dataPayload = rawtx;
    }
    return serialMultiSender(contentType, `/mapi/tx`, 'post', MerchantapilogEventTypes.PUSHTX, this.endpointConfigGroup[this.network], dataPayload, (miner, evt, res) => {
      return this.responseSaver(miner, evt, res, txid);
    });
  }
}


/**
 * Sends API requests in parallel, logs them async (if enabled), but it returns client response immediately after first reply
 *
 * From the client it will appear as this behaves like a single merchant-api (albet might return different miner id info)
 */
// tslint:disable-next-line: max-classes-per-file
export class MapiSendPolicySendRaceToFinishSuccess extends MapiSendRequestor {
  constructor(private network: string, private endpointConfigGroup: IMerchantApiEndpointGroupConfig, logger: any, responseSaver?: Function) {
    super(endpointConfigGroup, logger, responseSaver);
  }
  /**
   * Execute this policy for broadcasting
   * @param rawtx Tx to broadcast
   */
  execute(txid: string, contentType: string, rawtx: Buffer | string): Promise<any> {
    let dataPayload: any = { rawtx: rawtx };
    if (contentType === 'application/octet-stream') {
      dataPayload = rawtx;
    }
    return parallelRaceMultiSender(contentType, `/mapi/tx`, 'post', MerchantapilogEventTypes.PUSHTX, this.endpointConfigGroup[this.network], dataPayload, (miner, evt, res) => {
      return this.responseSaver(miner, evt, res, txid);
    });
  }
}
 

// tslint:disable-next-line: max-classes-per-file
export class MapiPolicyFactory {

  static getSendPolicy(network: string, config: IMerchantConfig, logger: any, responseSaver?: Function): MapiSendRequestor {

    if (config.sendPolicy === 'ALL_FIRST_PRIORITY_SUCCESS') {
      return new MapiSendPolicySendAllTakeFirstPrioritySuccess(network, config.endpoints, logger, responseSaver);
    }

    if (config.sendPolicy === 'RACE_FIRST_SUCCESS') {
      return new MapiSendPolicySendRaceToFinishSuccess(network, config.endpoints, logger, responseSaver);
    }

    if (config.sendPolicy === undefined || config.sendPolicy === 'SERIAL_BACKUP') {
      // do nothing as it is the default
    }

    // Default
    return new MapiSendPolicySerialBackup(network, config.endpoints, logger, responseSaver);
  }

  static getStatusPolicy(network: string, config: IMerchantConfig, logger: any, responseSaver?: Function): MapiGetRequestor {
    // Only 1 policy supported now
    if (config.statusPolicy === undefined || config.statusPolicy === 'SERIAL_BACKUP') {
      // do nothing as it is the default
    }

    if (config.statusPolicy === 'RACE_FIRST_SUCCESS') {
      return new MerchantRequestorStatusPolicyRaceToFinishSuccess(network, config.endpoints, logger, responseSaver);
    }

    // Default
    return new MerchantRequestorStatusPolicySerialBackup(network, config.endpoints, logger, responseSaver);
  }

  static getFeeQuotePolicy(network: string, config: IMerchantConfig, logger: any, responseSaver?: Function): MapiGetRequestor {
    // Only 1 policy supported now
    if (config.statusPolicy === undefined || config.statusPolicy === 'SERIAL_BACKUP') {
      // do nothing as it is the default
    }
    // Default
    return new MerchantRequestorFeeQuotePolicySerialBackup(network, config.endpoints, logger, responseSaver);
  }
}

// tslint:disable-next-line: max-classes-per-file
export class MerchantRequestor {
  private sendPolicy;
  private statusPolicy;
  private feeQuotePolicy;

  constructor(private network: string, private config: IMerchantConfig, private logger: any, private responseSaver: Function) {
    this.config.sendPolicy = this.config.sendPolicy || 'SERIAL_BACKUP';
    this.config.statusPolicy = this.config.statusPolicy || 'SERIAL_BACKUP';
    this.sendPolicy = this.sendPolicy || MapiPolicyFactory.getSendPolicy(network, this.config, this.logger, this.responseSaver);
    this.statusPolicy = this.statusPolicy || MapiPolicyFactory.getStatusPolicy(network, this.config, this.logger, this.responseSaver);
    this.feeQuotePolicy = this.feeQuotePolicy || MapiPolicyFactory.getFeeQuotePolicy(network, this.config, this.logger, this.responseSaver);
  }

  public async pushTx(rawtx: string | Buffer, contentType: 'application/json' | 'application/octet-stream' = 'application/json'): Promise<any> {
    let tx = new bsv.Transaction(rawtx);
    return new Promise(async (resolve, reject) => {
      this.sendPolicy.execute(tx.hash, contentType, rawtx)
      .then((result) => {
        resolve(result);
      }).catch((err) => {
        reject(err);
      });
    });
  }

  public async statusTx(txid: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      this.statusPolicy.execute(txid)
      .then((result) => {
        resolve(result);
      }).catch((err) => {
        reject(err);
      });
    });
  }

  public async feeQuote(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      this.feeQuotePolicy.execute()
      .then((result) => {
        resolve(result);
      }).catch((err) => {
        reject(err);
      });
    });
  }
}

