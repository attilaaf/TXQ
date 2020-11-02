import { Service, Inject } from 'typedi';
import { Pool } from 'pg';
import { DateUtil } from '../../services/helpers/DateUtil';
import { ITransactionStatus } from '../../interfaces/ITransactionData';

@Service('auxModel')
class TxModel {

  constructor(@Inject('db') private db: Pool) {}

}

export default AuxModel;
