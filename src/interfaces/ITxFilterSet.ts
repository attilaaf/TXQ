import { IAccountContext } from "./IAccountContext";

/*
  Note: We want a pattern language to work for everything

  MATCH TX pattern <FULL | PREFIX | SUB> location <input | txid | scripthash | output>
  EXTEND ONLY FROM COINBASE pattern <FULL | PREFIX | ANYWHERE> location <input | txid | scripthash | output>
  DO
    ACTION1,
    ACTION2,
    ACTION3

  MATCH TX 00112233 SUB LOCATION OUTPUT
  DO
    tag


  {
    "pattern": "001122",
    "matchType": "full",
    "location": "output",
    "actions": [
      {
        "name": "step1",
        "command": ""
      }
    ]
  }
*/
export interface ITxFilterRequest {
  outputFilters?: {
    [key: string]:  Array<{
      payload: string,
      trackSpends: boolean,
    }>
  },
  txidFilters?: {
    [key: string]:  Array<{
      txid: string,
    }>
  },
  monitoredOutpointFilters?: {
    [key: string]:  {
      [outpoint: string]:  {
        txid: string,  
        index: number,
        addedInCurrentBlock?: boolean,
      }
    }
  },
  
  ctxs: {
    [key: string]: IAccountContext
  };
}
 
export interface ITxFilterResultSet {
 [key: string]: {
    ctx: IAccountContext,
    matchedOutputFilters: Array<
      {
        txid: string,
        rawtx: string,
        index: number,
        payload?: string,
      }
    >,
    matchedTxidFilters: Array<
      {
        txid: string,
        rawtx: string,
      }
    >,
    matchedMonitoredOutpointFilters: Array<
      {
        txid: string,
        rawtx: string
      }
    >,
    newOutpointMonitorRecords?: {
    
      [outpoint: string]:  {
        txid: string,  
        index: number,
        // It could be spent in the same block
        spend_height?: number,
        spend_blockhash?: string,
        spend_txid?: string,
        spend_index?: number
      }
  
    }
  };
}
 