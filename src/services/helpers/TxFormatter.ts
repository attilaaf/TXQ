import { ITxOut } from "@interfaces/ITxOut";

export class TxFormatter {
    static formatTxoutWithEmbeddedStatusHeight(e: any): ITxOut {
        const r: ITxOut = {
            txid: e.txid,
            vout: e.index,
            index: e.index,
            outputIndex: e.index,
            value: Number(e.satoshis),
            satoshis: Number(e.satoshis),
            script: e.script,
            address: e.address,
            scripthash: e.scripthash,
            spend_txid: e.spend_txid ? e.spend_txid : undefined,
            spend_index: e.spend_index ? e.spend_index : undefined,
        };
        if (e.status && e.status.payload && e.status.payload.blockHeight) {
            r.height = e.status.payload.blockHeight;
        }
        return r;
    }

    static formatTxoutsWithEmbeddedStatusHeight(rows: any[]): ITxOut[] {
        return rows.map((e) => {
            return this.formatTxoutWithEmbeddedStatusHeight(e);
        });
    }
}