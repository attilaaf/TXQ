import { Service, Inject } from 'typedi';
import { Script, Tx, TxIn, TxOut, Bn, VarInt } from 'bsv';
import { ITxOutpoint } from '@interfaces/ITxOutpoint';
import InvalidParamError from '../error/InvalidParamError';
import InvalidTransactionProcessingError from '../../services/error/InvalidTransactionProcessingError';

@Service('assetService')
export default class AssetService {

  constructor(@Inject('txModel') private txModel, @Inject('blockheaderModel') private blockheaderModel, @Inject('logger') private logger) {}

  private async assembleTx(txparts: any) {
    let ins;
    let outs;
    let inputs = [];
    let outputs = [];
    let nLockTime;
    let iscoinbase;
    let blockhash;
    let versionBytesNum;
    let coinbasescript;
    for (let i = 0; i < txparts.length; i++) {
      if (i === 0) {
        blockhash = Buffer.from(txparts[i].blockhash).toString('hex');
        ins = txparts[i].ins;
        outs = txparts[i].outs;
        nLockTime = txparts[i].locktime;
        versionBytesNum = txparts[i].version || 1;
        iscoinbase = txparts[i].txindex === 0;
        if (iscoinbase) {
          coinbasescript = await this.blockheaderModel.getBlockHeaderCoinbaseInfo(blockhash);
          if (!coinbasescript) {
            throw new InvalidTransactionProcessingError();
          }
        }
      }

      if (i < ins) {
        let inp;
        if (iscoinbase) {
          if (!coinbasescript) {
            throw new InvalidTransactionProcessingError();
          }
          inp = TxIn.fromProperties(
            Buffer.from("0000000000000000000000000000000000000000000000000000000000000000", 'hex'),
            0xffffffff,
            Script.fromBuffer(coinbasescript),
            0xffffffff
          );
        } else {
          inp = TxIn.fromProperties(
            Buffer.from(txparts[i].prevtxid).reverse(),
            txparts[i].prevn,
            Script.fromBuffer(Buffer.from(txparts[i].unlockscript)),
            txparts[i].seq
          );
        }
        inputs.push(inp);
      }

      if (i < outs) {
        const outp = TxOut.fromProperties(
          Bn().fromJSON(txparts[i].satoshis),
          Script.fromBuffer(txparts[i].lockscript)
        )
        outputs.push(outp);
      }
    }
    const tx = new Tx(
      versionBytesNum,
      VarInt.fromNumber(inputs.length),
      inputs,
      VarInt.fromNumber(outputs.length),
      outputs,
      nLockTime
    );
    return tx;
  }

  public async getTx(txid: string, format: 'hex' | 'json') {
    try {
      const txparts = await this.txModel.getTxParts(txid);
      const tx = await this.assembleTx(txparts);
      return format==='json' ? { tx: tx.toJSON() } : { rawtx: tx.toHex() };
    } catch(e) {
      throw new InvalidTransactionProcessingError();
    }
  }

  public async getTxMany(txids: [string], format: 'hex' | 'json') {
    try {
      const txparts = await this.txModel.getTxPartsMany(txids);
      const parts = txids.map(t => txparts.filter(p => Buffer.from(t, 'hex').equals(p.txid))).filter(x => x.length > 0);
      const rawtxs = await Promise.all(parts.map(p => this.assembleTx(p)));
      return rawtxs.map(tx => {
        return format==='json' ? { tx: tx.toJSON()} : { rawtx: tx.toHex() }
      });
    } catch(e) {
      throw new InvalidTransactionProcessingError();
    }
  }

  public async getTxSpendStatuses(txOutpoints: ITxOutpoint[]) {
    return await this.txModel.getSpendInfos(txOutpoints);
  }

  public async getTxSpendStatusesOutpoint(outpoints: string[]) {
    const TXOUTPOINT_REGEX = new RegExp(/^([0-9a-fA-F]{64})\_o(\d+)$/);
    let txOutpoints = [];
    for (const outpoint of outpoints) {
      const match = TXOUTPOINT_REGEX.exec(outpoint);
      if (!match) {
        throw new InvalidParamError(`Outpoint invalid ${outpoint}. (Ex: "18c2a6eeddbb770e6ec57de933780dd51a0ad438d08c736bb4c55005a065a9e3_o0")`);
      }
      const txid = match[1];
      const parsed = parseInt(match[2]);
      txOutpoints.push({
        txid: txid,
        index: parsed,
      })
    }

    return await this.txModel.getSpendInfos(txOutpoints);
  }

  public async getTxBlockInfo(txids: string[]) {
    return await this.txModel.getTxBlockInfo(txids);
  }

  public async getTxouts(txOutpoints: ITxOutpoint[]) {
    return await this.txModel.getTxouts(txOutpoints);
  }

  public async getTxoutsByScriptHash(scripthashes: string[], params:  any) {
    return await this.txModel.getTxoutsByScriptHash(scripthashes, params);
  }

  public async getTxHistoryByScriptHash(scripthashes: string[], params:  any) {
    return await this.txModel.getTxHistoryByScriptHash(scripthashes, params);
  }

  public async getUtxosByScriptHash(scripthashes: string[], params:  any) {
    return await this.txModel.getUtxosByScriptHash(scripthashes, params);
  }

  public async getBalanceByScriptHash(scripthashes: string[], params:  any) {
    return await this.txModel.getBalanceByScriptHash(scripthashes, params);
  }

  public async getTxoutsScripts(txOutpoints: ITxOutpoint[]) {
    return await this.txModel.getTxoutsScripts(txOutpoints);
  }

  public async getBlocksByBlockHash(blockhash: string, params) {
    return await this.blockheaderModel.getBlocksByBlockHash(blockhash, params);
  }

  public async getBlocksByHeight(height: number, params) {
    return await this.blockheaderModel.getBlocksByHeight(height, params);
  }

  public async getMaxHeight(): Promise<number> {
    return await this.blockheaderModel.getMaxHeight();
  }
}
