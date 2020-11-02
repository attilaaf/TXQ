import * as Minercraft from 'minercraft';
import { IMerchantConfig, IMerchantApiEndpointConfig, IMerchantApiEndpointGroupConfig } from '@interfaces/IConfig';
import * as bsv from 'bsv';
import { MerchantapilogEventTypes } from '../merchantapilog';
import { MerchantEndpointNetworkSelector } from './MerchantEndpointNetworkSelector';

/**
 * A policy interface for how to execute broadcasts against merchantapi endpoints
 */
// tslint:disable-next-line: max-classes-per-file
export class MerchantRequestorPolicy {
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

  get endpoints(): IMerchantApiEndpointConfig[] {
    return MerchantEndpointNetworkSelector.selectEndpoints(this.merchantConfig, process.env.NETWORK);
  }

  logInfo(name, data) {
    if (this.logger) {
      this.logger.info(name, data);
    }
  }
}

/**
 * Does a sequential loop over all merchantapi's until 1 is successful
 */
// tslint:disable-next-line: max-classes-per-file
export class MerchantRequestorSendPolicySerialBackup extends MerchantRequestorPolicy {

  constructor(private endpointConfigGroup: IMerchantApiEndpointGroupConfig, logger: any, responseSaver?: Function) {
    super(endpointConfigGroup, logger, responseSaver);
  }
  /**
   * Execute this policy for broadcasting
   * @param rawtx Tx to broadcast
   */
  execute(params: { txid: string, rawtx: string }): Promise<any> {
    const errors = [];
    return new Promise(async (resolve, reject) => {
      let responsePayloadList = [];
      let responseSuccessPayload = null;
      let responseWithPayload = null;
      // tslint:disable-next-line: prefer-for-of
      for (let i = 0; i < this.endpoints.length; i++) {
        try {
          const miner = new Minercraft({
            url: this.endpoints[i].url,
            headers: this.endpoints[i].headers,
          });
          const response = await miner.tx.push(params.rawtx, {
            verbose: true,
            maxContentLength: 52428890,
            maxBodyLength: 52428890
          });
          if (this.responseSaver) {
            await this.responseSaver(this.endpoints[i].name, MerchantapilogEventTypes.PUSHTX, response, params.txid);
          }
          if (response && response.payload && response.payload.returnResult === 'success') {
            const toSave = {...(response), mapiName: this.endpoints[i].name, mapiEndpoint: this.endpoints[i].url, mapiStatusCode: 200};
            responsePayloadList.push(toSave);
            responseSuccessPayload = toSave;
            break;
          } else if (response && response.payload) {
            const toSave = {...(response), mapiName: this.endpoints[i].name, mapiEndpoint: this.endpoints[i].url, mapiStatusCode: 200};
            responseWithPayload = toSave;
            responsePayloadList.push(toSave);
          } else {
            const toSave = { error: JSON.stringify(response), mapiName: this.endpoints[i].name, mapiEndpoint: this.endpoints[i].url, mapiStatusCode: 200};
            responsePayloadList.push(toSave);
            this.logInfo('MerchantRequestorSendPolicySerialBackup.NO_RESPONSE', { url: this.endpoints[i].url});
          }
        } catch (err) {
          let code = err && err.response && err.response.status ? err.response.status : 500;
          if (this.responseSaver) {
            await this.responseSaver(this.endpoints[i].name, MerchantapilogEventTypes.PUSHTX, { error: err.toString(), stack: err.stack }, params.txid);
          }
          this.logError('MerchantRequestorSendPolicySerialBackup',{ error: err.toString(), stack: err.stack } );
          responsePayloadList.push({error: JSON.stringify(err), mapiName: this.endpoints[i].name, mapiEndpoint: this.endpoints[i].url, mapiStatusCode: code});
        }
      }

      if (responseSuccessPayload) {
        const formattedResponse = {
          ...responseSuccessPayload,
          mapiResponses: responsePayloadList
        };
        return resolve(formattedResponse);
      } else if (responseWithPayload) {
        const formattedResponse = {
          ...(responseSuccessPayload || responsePayloadList[responsePayloadList.length - 1]),
          mapiResponses: responsePayloadList
        };
        return resolve(formattedResponse);
      } else {
        const formattedResponse = {
          ...(responsePayloadList[responsePayloadList.length - 1] ? responsePayloadList[responsePayloadList.length - 1] : {}),
          mapiResponses: responsePayloadList
        };
        return reject(formattedResponse);
      }
    });
  }
}

/**
 * Does a sequential loop over all merchantapi's until 1 is successful
 */
// tslint:disable-next-line: max-classes-per-file
export class MerchantRequestorFeeQuotePolicySerialBackup extends MerchantRequestorPolicy {
  constructor(private endpointConfigGroup: IMerchantApiEndpointGroupConfig, logger: any, responseSaver?: Function) {
    super(endpointConfigGroup, logger, responseSaver);
  }
  /**
   * Execute this policy for broadcasting
   * @param rawtx Tx to broadcast
   */
  execute(params: {txid: string}): Promise<any> {
    const errors = [];
    return new Promise(async (resolve, reject) => {
      let responsePayloadList = [];
      let responseSuccessPayload = null;
      let responseWithPayload = null;
      // tslint:disable-next-line: prefer-for-of
      for (let i = 0; i < this.endpoints.length; i++) {
        try {
          const miner = new Minercraft({
            url: this.endpoints[i].url,
            headers: this.endpoints[i].headers,
          });
          const response = await miner.fee.rate({verbose: true});

          if (this.responseSaver) {
            await this.responseSaver(this.endpoints[i].name, MerchantapilogEventTypes.FEEQUOTE, response);
          }
          if (response && response.payload && response.payload.returnResult === 'success') {
            const toSave = {...(response), mapiName: this.endpoints[i].name, mapiEndpoint: this.endpoints[i].url, mapiStatusCode: 200};
            responsePayloadList.push(toSave);
            responseSuccessPayload = toSave;
            break;
          } else if (response && response.payload) {
            const toSave = {...(response), mapiName: this.endpoints[i].name, mapiEndpoint: this.endpoints[i].url, mapiStatusCode: 200};
            responseWithPayload = toSave;
            responsePayloadList.push(toSave);
          } else {
            const toSave = { error: JSON.stringify(response), mapiName: this.endpoints[i].name, mapiEndpoint: this.endpoints[i].url, mapiStatusCode: 200};
            responsePayloadList.push(toSave);
            this.logInfo('MerchantRequestorFeeQuotePolicySerialBackup.NO_RESPONSE', { url: this.endpoints[i].url});
          }
        } catch (err) {
          let code = err && err.response && err.response.status ? err.response.status : 500;
          if (this.responseSaver) {
            await this.responseSaver(this.endpoints[i].name, MerchantapilogEventTypes.FEEQUOTE, { error: err.toString(), stack: err.stack }, undefined);
          }
          this.logError('MerchantRequestorFeeQuotePolicySerialBackup',{ error: err.toString(), stack: err.stack } );
          responsePayloadList.push({error: JSON.stringify(err), mapiName: this.endpoints[i].name, mapiEndpoint: this.endpoints[i].url, mapiStatusCode: code});
        }
      }

      if (responseSuccessPayload) {
        const formattedResponse = {
          ...responseSuccessPayload,
          mapiResponses: responsePayloadList
        };
        return resolve(formattedResponse);
      } else if (responseWithPayload) {
        const formattedResponse = {
          ...(responseSuccessPayload || responsePayloadList[responsePayloadList.length - 1]),
          mapiResponses: responsePayloadList
        };
        return resolve(formattedResponse);
      } else {
        const formattedResponse = {
          ...(responsePayloadList[responsePayloadList.length - 1] ? responsePayloadList[responsePayloadList.length - 1] : {}),
          mapiResponses: responsePayloadList
        };
        return reject(formattedResponse);
      }
    });
  }
}

/**
 * Does a sequential loop over all merchantapi's until 1 is successful
 */
// tslint:disable-next-line: max-classes-per-file
export class MerchantRequestorStatusPolicySerialBackup extends MerchantRequestorPolicy {
  constructor(private endpointConfigGroup: IMerchantApiEndpointGroupConfig, logger: any, responseSaver?: Function) {
    super(endpointConfigGroup, logger, responseSaver);
  }

  /**
   * Execute this policy for broadcasting
   * @param rawtx Tx to broadcast
   */
  execute(params: {txid: string}): Promise<any> {
    const errors = [];
    return new Promise(async (resolve, reject) => {
      let responsePayloadList = [];
      let responseSuccessPayload = null;
      let responseWithPayload = null;
      // tslint:disable-next-line: prefer-for-of
      for (let i = 0; i < this.endpoints.length; i++) {
        try {
          const miner = new Minercraft({
            url: this.endpoints[i].url,
            headers: this.endpoints[i].headers,
          });
          const response = await miner.tx.status(params.txid, {verbose: true});

          if (this.responseSaver) {
            await this.responseSaver(this.endpoints[i].name, MerchantapilogEventTypes.STATUSTX, response, params.txid);
          }
          if (response && response.payload && response.payload.returnResult === 'success') {
            const toSave = {...(response), mapiName: this.endpoints[i].name, mapiEndpoint: this.endpoints[i].url, mapiStatusCode: 200};
            responsePayloadList.push(toSave);
            responseSuccessPayload = toSave;
            break;
          } else if (response && response.payload) {
            const toSave = {...(response), mapiName: this.endpoints[i].name, mapiEndpoint: this.endpoints[i].url, mapiStatusCode: 200};
            responseWithPayload = toSave;
            responsePayloadList.push(toSave);
          } else {
            const toSave = { error: JSON.stringify(response), mapiName: this.endpoints[i].name, mapiEndpoint: this.endpoints[i].url, mapiStatusCode: 200};
            responsePayloadList.push(toSave);
            this.logInfo('MerchantRequestorStatusPolicySerialBackup.NO_RESPONSE', { url: this.endpoints[i].url});
          }
        } catch (err) {
          let code = err && err.response && err.response.status ? err.response.status : 500;
          if (this.responseSaver) {
            await this.responseSaver(this.endpoints[i].name, MerchantapilogEventTypes.STATUSTX, { error: err.toString(), stack: err.stack }, params.txid);
          }
          this.logError('MerchantRequestorFeeQuotePolicySerialBackup',{ error: err.toString(), stack: err.stack } );
          responsePayloadList.push({error: JSON.stringify(err), mapiName: this.endpoints[i].name, mapiEndpoint: this.endpoints[i].url, mapiStatusCode: code});
        }
      }

      if (responseSuccessPayload) {
        const formattedResponse = {
          ...responseSuccessPayload,
          mapiResponses: responsePayloadList
        };
        return resolve(formattedResponse);
      } else if (responseWithPayload) {
        const formattedResponse = {
          ...(responseSuccessPayload || responsePayloadList[responsePayloadList.length - 1]),
          mapiResponses: responsePayloadList
        };
        return resolve(formattedResponse);
      } else {
        const formattedResponse = {
          ...(responsePayloadList[responsePayloadList.length - 1] ? responsePayloadList[responsePayloadList.length - 1] : {}),
          mapiResponses: responsePayloadList
        };
        return reject(formattedResponse);
      }
    });
  }
}

/**
 * Sends API requests in parallel, logs them (if enabled) and then returns the authorative result by priority ordering
 *
 * From the client it will appear as this behaves like a single merchant-api (albet might return different miner id info)
 */
// tslint:disable-next-line: max-classes-per-file
export class MerchantRequestorSendPolicySendAllTakeFirstPrioritySuccess extends MerchantRequestorPolicy {
  constructor(private endpointConfigGroup: IMerchantApiEndpointGroupConfig, logger: any, responseSaver?: Function) {
    super(endpointConfigGroup, logger, responseSaver);
  }
  /**
   * Execute this policy for broadcasting
   * @param rawtx Tx to broadcast
   */
  execute(params: { txid: string, rawtx: string }): Promise<any> {

    return new Promise(async (resolve, reject) => {
      const promises = [];
      for (let i = 0; i < this.endpoints.length; i++) {
        promises.push(new Promise(async (innerResolve, innerReject) => {
          const errors = [];
          try {
            const miner = new Minercraft({
              url: this.endpoints[i].url,
              headers: this.endpoints[i].headers,
            });
            const response = await miner.tx.push(params.rawtx, {
              verbose: true,
              maxContentLength: 52428890,
              maxBodyLength: 52428890
            });
            if (response && response.payload && response.payload.returnResult === 'success') {
              return innerResolve(response);
            } else if (response && response.payload) {
              return innerResolve(response);
            } else {
              this.logInfo('MerchantRequestorSendPolicySendAllTakeFirstPrioritySuccess.NO_RESPONSE', { url: this.endpoints[i].url});
            }
          } catch (err) {
            if (this.responseSaver) {
              await this.responseSaver(this.endpoints[i].name, MerchantapilogEventTypes.STATUSTX, { error: err.toString(), stack: err.stack }, params.txid);
            }
            this.logError('MerchantRequestorSendPolicySerialBackup', { error: err.toString(), stack: err.stack });
            errors.push(err.toString());
          }
          innerReject(errors);
        }));
      }
      // Settle all promises then process them
      const minerBroadcastResult = await Promise.all(promises.map(p => p.catch(e => e)));
      let authoratativeSuccessResult;
      let authoratativeFailureResult;
      let errorList = [];
      for (let i = 0; i < minerBroadcastResult.length; i++) {
        this.logInfo('minerResult', {url: this.endpoints[i].url, result: minerBroadcastResult[i]});
        // Save to database if logging enabled
        if (this.responseSaver) {
          await this.responseSaver(this.endpoints[i].name, MerchantapilogEventTypes.PUSHTX, minerBroadcastResult[i], params.txid);
        }
        // Get the authoratative success result
        // Keep the first success always
        if (!authoratativeSuccessResult &&
            minerBroadcastResult[i] &&
            minerBroadcastResult[i].payload &&
            minerBroadcastResult[i].payload.returnResult === 'success') {
            authoratativeSuccessResult = minerBroadcastResult[i];
        }

        if (!authoratativeFailureResult &&
          minerBroadcastResult[i] &&
          minerBroadcastResult[i].payload &&
          minerBroadcastResult[i].payload.returnResult === 'failure') {
            authoratativeFailureResult = minerBroadcastResult[i];
        }
      }

      if (authoratativeSuccessResult) {
        return resolve(authoratativeSuccessResult);
      } else {
        return reject(authoratativeFailureResult || { critical: 'ALL_FAILED', errors: errorList});
      }

    });
  }
}
// tslint:disable-next-line: max-classes-per-file
export class MerchantRequestorPolicyFactory {

  static getSendPolicy(config: IMerchantConfig, logger: any, responseSaver?: Function): MerchantRequestorPolicy {

    if (config.sendPolicy === 'ALL_FIRST_PRIORITY_SUCCESS') {
      return new MerchantRequestorSendPolicySendAllTakeFirstPrioritySuccess(config.endpoints, logger, responseSaver);
    }

    if (config.sendPolicy === undefined || config.sendPolicy === 'SERIAL_BACKUP') {
      // do nothing as it is the default
    }

    // Default
    return new MerchantRequestorSendPolicySerialBackup(config.endpoints, logger, responseSaver);
  }

  static getStatusPolicy(config: IMerchantConfig, logger: any, responseSaver?: Function): MerchantRequestorPolicy {
    // Only 1 policy supported now
    if (config.statusPolicy === undefined || config.statusPolicy === 'SERIAL_BACKUP') {
      // do nothing as it is the default
    }

    // Default
    return new MerchantRequestorStatusPolicySerialBackup(config.endpoints, logger, responseSaver);
  }

  static getFeeQuotePolicy(config: IMerchantConfig, logger: any, responseSaver?: Function): MerchantRequestorPolicy {
    // Only 1 policy supported now
    if (config.statusPolicy === undefined || config.statusPolicy === 'SERIAL_BACKUP') {
      // do nothing as it is the default
    }

    // Default
    return new MerchantRequestorFeeQuotePolicySerialBackup(config.endpoints, logger, responseSaver);
  }
}

// tslint:disable-next-line: max-classes-per-file
export class MerchantRequestor {
  private sendPolicy;
  private statusPolicy;
  private feeQuotePolicy;

  constructor(private config: IMerchantConfig, private logger: any, private responseSaver: Function) {
    this.config.sendPolicy = this.config.sendPolicy || 'ALL_FIRST_PRIORITY_SUCCESS';
    this.config.statusPolicy = this.config.statusPolicy || 'SERIAL_BACKUP';
    this.sendPolicy = this.sendPolicy || MerchantRequestorPolicyFactory.getSendPolicy(this.config, this.logger, this.responseSaver);
    this.statusPolicy = this.statusPolicy || MerchantRequestorPolicyFactory.getStatusPolicy(this.config, this.logger, this.responseSaver);
    this.feeQuotePolicy = this.feeQuotePolicy || MerchantRequestorPolicyFactory.getFeeQuotePolicy(this.config, this.logger, this.responseSaver);
  }

  public async pushTx(rawtx: string): Promise<any> {
    const tx = new bsv.Transaction(rawtx);
    return new Promise(async (resolve, reject) => {
      this.sendPolicy.execute({txid: tx.hash, rawtx})
      .then((result) => {
        resolve(result);
      }).catch((err) => {
        reject(err);
      });
    });
  }

  public async statusTx(txid: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      this.statusPolicy.execute({txid})
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

