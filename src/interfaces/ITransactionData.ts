import { EventTypes } from "services/event";
import { ITxOut } from "./ITxOut";

export interface ITransactionMeta {
  title?: string;
  content?: string;
  url?: string;
  image?: string;
  description?: string;
}

export interface ITransactionStatus {
  payload: {
    apiVersion: string;
    timestamp: string;
    returnResult: string;
    resultDescription: string;
    blockHash: string;
    blockHeight: number;
    confirmations: number;
    minerId: string;
    txSecondMempoolExpiry: string;
  },
  signature?: string;
  publicKey?: string;
  encoding?: string;
  mimeType?: string;
  valid?: boolean;
}

export interface ITransactionData {
  id?: number;
  txid?: string;
  nosync?: boolean;
  rawtx: string;
  blockhash?: string;
  blocktime?: number;
  message?: string;
  send?: any;
  status?: ITransactionStatus,
  info: {
    bitcom?: string;
    file?: string;
  },
  metadata: ITransactionMeta,
  tags: any[]
}

export type TransactionStatusType = 'all' | 'confirmed' | 'unconfirmed' | 'dead' | 'orphaned';
 

export interface ITxEntityWithMetadata {
  id?: number;
  txid?: string;
  nosync?: boolean;
  rawtx: string;
  channel?: string;
  h?: string;
  i?: number;
  send?: any;
  status?: ITransactionStatus,
  info: {
    bitcom?: string;
    file?: string;
  },
  metadata: ITransactionMeta,
  tags: any[]
}
