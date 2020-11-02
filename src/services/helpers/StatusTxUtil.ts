import { BitcoinRegex } from "./BitcoinRegex";

export class StatusTxUtil {

    static isAcceptedStatus(statusObj: any): boolean {
        const isValid = statusObj && statusObj.payload &&
        statusObj.payload.returnResult === 'success' &&
        statusObj.payload.blockHeight >= 0 &&
        statusObj.payload.confirmations >= 0;
        return isValid;
    }

    static isAcceptedPush(statusObj: any): boolean {
        try {
            const payload = statusObj.payload;
            const txRegex = new RegExp(BitcoinRegex.TXID_REGEX);
            return StatusTxUtil.isAcceptedBeforePush(statusObj) || (
                payload &&
                payload.returnResult === 'success' &&
                txRegex.test(payload.txid)
            );
        } catch (err) {
            console.log('isAcceptedPush', err);
        }
        return false;
    }

    static isAcceptedBeforePush(status: any): boolean {
        if (!status || !status.payload) {
            return false;
        }
        try {
            const payload = JSON.parse(status.payload);
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