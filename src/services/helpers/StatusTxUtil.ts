import { BitcoinRegex } from "./BitcoinRegex";

export class StatusTxUtil {

    static isAcceptedStatus(statusObj: any): boolean {
        let payload = statusObj.payload;
        if (statusObj && statusObj.payload && typeof statusObj.payload === 'string') {
            payload = JSON.parse(statusObj.payload);
        }
        const isValid = payload &&
        payload.returnResult === 'success' &&
        payload.blockHeight >= 0 &&
        payload.confirmations >= 0;
        return isValid;
    }

    static isAcceptedPush(statusObj: any): boolean {
        if (!statusObj) {
            return false;
        }
        try {
            let payload = statusObj.payload;
            if (typeof statusObj.payload === 'string') {
                payload = JSON.parse(statusObj.payload);
            }
            const txRegex = new RegExp(BitcoinRegex.TXID_REGEX);
            const r = StatusTxUtil.isAcceptedBeforePush(statusObj) || (
                payload &&
                payload.returnResult === 'success' &&
                txRegex.test(payload.txid)
            );
            return r;
        } catch (err) {
            console.log('isAcceptedPush', err);
        }
        return false;
    }

    static isAcceptedBeforePush(status: any): boolean {
        if (!status || !status.payload) {
            return false;
        } // ERROR: 257: txn-already-known
        try {
            const payload = status.payload;
            const isValid = payload &&
                payload.returnResult === 'failure' &&
                (
                    payload.resultDescription === 'ERROR: Transaction already in the mempool' ||
                    payload.resultDescription  === 'ERROR: 257: txn-already-known'
                )
            return isValid;
        } catch (err) {
            ;
        }
        return false;
    }
}