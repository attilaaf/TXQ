import * as bsv from 'bsv';
import { QueryOrderType } from '../../interfaces/IQueryOrder';
import InvalidAddressError from '../error/InvalidAddressError';
import InvalidScriptHashOrTXIDError from '../error/InvalidScriptHashOrTXIDError';

export class ChannelHelper {
  public static getParamStringArray(param: string | string[]): string[] {
    return Array.isArray(param) ? param : param.split(',');
  }

  public static checkAddresses(addresses: string[]): string[] {
    if (addresses.length === 0) {
      return addresses;
    }

    const invalidAddresses = addresses.filter(address => {
      try {
        const bsvAddress = new bsv.Address(address);
        bsvAddress.toString();
        return false; 
      } catch (_) {
        return true;
      }
    });
    
    if (invalidAddresses.length > 0) {
      throw new InvalidAddressError();
    }

    return addresses;
  }

  public static checkScriptHashesOrTXIDs(items: string[]): string[] {
    if (items.length === 0) {
      return items;
    }
    
    const regexp = /^[0-9a-fA-F]+$/;

    const invalidItems = items.filter(item => {
      return (regexp.test(item) && Buffer.byteLength(item, "hex") === 32) ? false : true;
    });

    if (invalidItems.length > 0) {
      throw new InvalidScriptHashOrTXIDError();
    }

    return items;
  }

  public static getOrderMode(param: any): QueryOrderType {
    let orderMode : QueryOrderType = 'DESC';
    
    if (param) {
      orderMode = (param as string).length > 0 ? ((param as string).toUpperCase() as QueryOrderType) : 'DESC';

      if (!['ASC', 'DESC'].includes(orderMode)) {
        orderMode = 'DESC';
      }
    }

    return orderMode;
  }
}
