export interface ITXOutput {
    txid: string;
    index: number;
    outputIndex?: number;   //  Optional for mattercloud/bsv/filepay compat
    vout?: number;          //  Optional for mattercloud/bsv/filepay compat
    value?: number;
    satoshis: number;
    amount?: number;
    height?: number;
    confirmations?: number;
    script?: string;
    scripthash?: string;
    address?: string | null;
    spend_txid?: string | null;
    spend_index?: number | null;
    spend_height?: number | null;
}