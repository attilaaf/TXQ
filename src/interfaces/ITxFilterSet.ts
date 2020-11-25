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
      actions: Array<{
        actionType: string,
        params: any
      }>
    }>
  },
  txidFilters?: {
    [key: string]:  Array<{
      txid: string,
      actions: Array<{
        actionType: string,
        params: any
      }>
    }>
  },
  ctxs: {
    [key: string]: IAccountContext
  };
}
 
export interface ITxFilterResultSet {
 [key: string]: {
    ctx: IAccountContext,
    items: Array<
      {
        txid: string,
        rawtx: string,
        payload?: string,
        actions?: Array<{
          actionType: string,
          params: any
        }>
      }
    >
  };
}
 