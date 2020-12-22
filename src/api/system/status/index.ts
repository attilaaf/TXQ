import { Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { path } from './../index';
import { sendResponseWrapper } from '../../../util/sendResponseWrapper';
import { sendMapiErrorWrapper } from '../../../util/sendMapiErrorWrapper';
import GetSystemStatus from '../../../services/use_cases/system/GetSystemStatus';
import { SystemContextHelper } from '../../system-context-helper';
import AccessForbiddenError from '../../../services/error/AccessForbiddenError';
import * as axios from 'axios';
import * as bsv from 'bsv';

export default [
  {
    path: `${path}/status`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          let uc = Container.get(GetSystemStatus);
          const data = await uc.run({systemContext: SystemContextHelper.getContext(Req)});
          sendResponseWrapper(Req, res, 200, data.result);
        } catch (error) {
          if (error instanceof AccessForbiddenError) {
            sendMapiErrorWrapper(res, 403, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },
  /*{
    path: `${path}/tester`,
    method: 'get',
    handler: [
      async (Req: Request, res: Response, next: NextFunction) => {
        try {
          console.log('get tx history');

          const response = await axios.default.get(`http://localhost:8097/api/v1/txout/scripthash/unspentoutpoints/x?api_key=x&project_id=x&`, {
            headers: {
            
            'content-type': 'application/json',
            },
            maxContentLength: 52428890,
            maxBodyLength: 52428890
          });

          for (const utxo of response.data.result) {
            const outp = utxo.txid + '_o' + utxo.index;
            const spendResponse = await axios.default.get(`https://txdb.mattercloud.io/api/v1/spends/${outp}`, {
              headers: {
              
              'content-type': 'application/json',
              },
              maxContentLength: 52428890,
              maxBodyLength: 52428890
            });

            console.log('spend', spendResponse.data);
            if (spendResponse.data.result[outp] && spendResponse.data.result[outp].spend_txid) {
              const rawtxResponse = await axios.default.get(`https://media.bitcoinfiles.org/rawtx/${spendResponse.data.result[outp].spend_txid}`, {
                headers: {
                
                'content-type': 'application/json',
                },
                maxContentLength: 52428890,
                maxBodyLength: 52428890
              });
              const tx = new bsv.Transaction(rawtxResponse.data);
              const rawtx = rawtxResponse.data;
              console.log('tx', tx, rawtxResponse.data);
              // Now push the rawtx to the database
              const postRes = await axios.default.post(`http://localhost:8097/api/v1/tx?api_key=x&project_id=x&`, 
                {
                  set: {
                    [ tx.hash ]: {
                      rawtx,
                    }
                  }
                },
                {
                headers: {
                
                'content-type': 'application/json',
                },
                maxContentLength: 52428890,
                maxBodyLength: 52428890
              });

              console.log('posted', postRes.data);
            }
          
          }

          console.log('next');
 
          sendResponseWrapper(Req, res, 200, response.data.result);
        } catch (error) {
          if (error instanceof AccessForbiddenError) {
            sendMapiErrorWrapper(res, 403, error.toString());
            return;
          }
          next(error);
        }
      },
    ],
  },*/
];
