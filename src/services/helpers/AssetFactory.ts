import { IAssetData } from "@interfaces/IAssetData";
import { IAssetDefine } from "@interfaces/IAssetDefine";
import { ITxOut } from "@interfaces/ITxOut";
import cfg from './../../cfg';
import * as bsv from 'bsv';

export class AssetFactory {



    constructor(private assetData?: IAssetDefine) {
        if (assetData) {
            for (const i in cfg.assets) {
                if (!cfg.assets.hasOwnProperty(i)) {
                    continue;
                }
                assetData[i] = {
                    code: Buffer.from(cfg.assets[i].code, 'hex'),
                    coinbase: Buffer.from(cfg.assets[i].coinbase, 'hex'),
                    height: cfg.assets[i].height,
                };
            }
        }
    }

    fromCoinbaseTxout(unlockscript) {
        return null;
    }

    fromNonCoinbaseTxout(unlockscript) {
        return null;
    }

    matchesCoinbaseType(tx: bsv.Transaction, txOutput: bsv.Output): boolean {
        if (!txOutput || !txOutput.script) {
            console.log('err script');
            throw new Error();
        }
        for (const item in this.assetData) {
            if (!this.assetData.hasOwnProperty(item)) {
                continue;
            }
            const txOutScript = txOutput.script.toBuffer();
            const cb =  this.assetData[item].coinbase;

            if (txOutScript.length < (cb.length / 2)) {
                continue;
            }

            const sliced = txOutput.script.toBuffer().slice(0, (this.assetData[item].coinbase.length));
            const cmp = this.assetData[item].coinbase.compare(sliced);
            if (cmp === 0) {
                return true;
            }
        }
        return false;
    }

    matchesPrefixCode(tx: bsv.Transaction, txOutput: bsv.Output): boolean {
        if (!txOutput || !txOutput.script) {
            console.log('err script');
            throw new Error();
        }
        for (const item in this.assetData) {
            if (!this.assetData.hasOwnProperty(item)) {
                continue;
            }
            const txOutScript = txOutput.script.toBuffer();
            const cb =  this.assetData[item].code;

            if (txOutScript.length < (cb.length / 2)) {
                continue;
            }

            const sliced = txOutput.script.toBuffer().slice(0, (this.assetData[item].code.length));
            const cmp = this.assetData[item].code.compare(sliced);
            if (cmp === 0) {
                return true;
            }
        }
        return false;
    }

    fromTxout(buf: Buffer, tx: bsv.Transaction): IAssetData {
        let assetData: IAssetData = {};
        for (let i = 0; i < tx.outputs.length; i++) {
            if (this.matchesCoinbaseType(tx, tx.outputs[i])) {

                console.log('from txout');
                return assetData;
            }
        }
        return assetData;
    }

    getAssetData(buf: Buffer): IAssetData {
        return null;
    }

}