import { Service, Inject } from 'typedi';
import InvalidParamError from '../error/InvalidParamError';

import { IAccountContext } from '@interfaces/IAccountContext';

@Service('txfilterService')
export default class TxfilterService {
  constructor(@Inject('txfilterModel') private txfilterModel, @Inject('logger') private logger) {}
 
  public async create(accountContext: IAccountContext, params: {
    name: string, payload: string, enabled: boolean
  }) {

    if (!params.name || !params.payload) {
      throw new InvalidParamError();
    }

    if (params.payload.length < 8) {
      throw new InvalidParamError();
    }
 
    return this.txfilterModel.create(accountContext,
      params.name,
      params.payload,
      params.enabled
    );
  }

  public async delete(accountContext: IAccountContext, params: {
    name: string
  }) {
 
    return this.txfilterModel.delete(accountContext,
      params.name,
    );
  }

  public async getAll(accountContext: IAccountContext) {
    return this.txfilterModel.getAll(accountContext);
  }
  public async getAllEnabled(accountContext: IAccountContext) {
    return this.txfilterModel.getAllEnabled(accountContext);
  }
}
