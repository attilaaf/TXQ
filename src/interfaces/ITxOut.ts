export interface ITxOut {
    txid: string;
    vout: number;
    outputIndex: number;
    index?: number;
    value: number;
    satoshis: number;
    script: string;
    address: string;
    scripthash: string;
    height?: number;
    spend_txid?: string;
    spend_index?: number;
    spend_height?: number; // Not used yet

}