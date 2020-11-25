import { ITXOutput } from "@interfaces/ITxOutput";
import { Hash, Address, Script } from 'bsv';
export class TxHelpers {

    static populateExtra(outputs: { [key: string]: ITXOutput }) {

        for (const prop in outputs) {
        if (!outputs.hasOwnProperty(prop)) {
            continue;
        }
        if (!outputs[prop]) {
            continue;
        }
        // Do not generate address or scripthash for data carrier op return
        if (outputs[prop].satoshis > 0) {
            const buffer = Buffer.from(outputs[prop].script, 'hex');
            const scripthash =  Hash.sha256(buffer).reverse().toString('hex');
            outputs[prop].scripthash = scripthash;

            if (outputs[prop].script) {
                try {
                    const address = Address.fromTxOutScript(Script.fromHex(outputs[prop].script));
                    outputs[prop].address = address.toString();
                }
                catch (ex)  {
                    ; //Not an  address
                }
            }
        }

        if (!outputs[prop].spend_txid) {
            outputs[prop].spend_txid = null;
        }
        if (isNaN(outputs[prop].spend_index)) {
            outputs[prop].spend_index = null;
        }
        if (isNaN(outputs[prop].spend_height)) {
            outputs[prop].spend_height = null;
        }
        outputs[prop].vout = outputs[prop].index;
        outputs[prop].outputIndex = outputs[prop].index;
        outputs[prop].value = outputs[prop].satoshis;
        }
        return outputs;
    }

    /**
     *
     * @param outputs Outputs to populate with address and scripthash
     */
    static populateExtraArray(outputs: ITXOutput[]) {
        for (const record of outputs) {
            // Do not generate address or scripthash for data carrier op return
            if (record.satoshis > 0) {
                const buffer = Buffer.from(record.script, 'hex');
                const scripthash =  Hash.sha256(buffer).reverse().toString('hex');
                record.scripthash = scripthash;
                if (record.script) {
                    try {
                        const address = Address.fromTxOutScript(Script.fromHex(record.script));
                        record.address = address.toString();
                    }
                    catch (ex)  {
                        ; //Not an  address
                    }
                }
            }
            record.vout = record.index;
            record.outputIndex = record.index;
            record.value = record.satoshis;
            if (!record.spend_txid) {
                record.spend_txid = undefined;
            }
            if (isNaN(record.spend_index)) {
                record.spend_index = undefined;
            }
            if (isNaN(record.spend_height)) {
                record.spend_height = undefined;
            }
        }
        return outputs;
    }

    static populateAddressAndScript(outputs: any[], scripthashAddressMap: any) {
        for (const record of outputs) {
            if (scripthashAddressMap[record.scripthash]) {
                const address = new Address.fromTxOutScript(Script.fromHex(scripthashAddressMap[record.scripthash]))
                record.script = address.toHex();
                record.address = scripthashAddressMap[record.scripthash]
            }
        }
        return outputs;
    }

    static isScriptHash(str: string) {
        return str && str.match(/^[a-f\d]{64}$/i) !== null;
    }

    static isTxid(str: string) {
      return this.isScriptHash(str);
    }

    static isBlockHash(str: string) {
      return this.isScriptHash(str);
    }

    static isAddress(str: string) {
        return !!Address.isValid(str)
    }

    static isAddressFromScript(str: string) {
      return this.isAddress(str);
    }

    static toScriptHashFromAddressOrNull(str: string) {
      if(!this.isAddress(str)) return null;
      const address = Address.fromString(str).toTx
      const buffer = address.toTxOutScript().toBuffer();
      const scripthash = Hash.sha256(buffer).reverse().toString('hex');
      return scripthash;
    }
}
