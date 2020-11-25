import { EventTypes } from "services/event";
import { ITransactionData } from "./ITransactionData";
import { ITxOut } from "./ITxOut";
 
export interface ITxNotificationEntity { 
  entity: ITransactionData,
  eventType: EventTypes
}

export interface ITxoutNotificationEntity { 
  entity: ITxOut,
  eventType: EventTypes
}
