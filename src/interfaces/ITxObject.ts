export interface ITxObject {
    txIns: Array<{
        output: {
            prevTxid?: string,
            outputIndex: number,
        },
        scriptBuffer: string,
        sequenceNumber: number
    }>;
    txOuts: Array<
        {
            satoshis: number,
            scriptPubKey: string,
        }
    >;
    versionBytesNum: number,
    nLockTime: number
}
