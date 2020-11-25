import * as supertest from 'supertest';
import { createExpress } from '../../../../src/bootstrap/express-factory';
let config = require(__dirname + '/../../../../src/cfg/index.ts').default;
let version = require(__dirname + '/../../../../src/api/v1/index.ts');
let url = config.baseurl + ':' + config.api.port;
//api = supertest(url + '' + version.path);
let api;
const boot = async () => {
  api = supertest(await createExpress())
};
boot();
describe('txout', () => {
  test('txid/index 200', async (done) => {

      api
        .get(`${version.path}/txout/txid/3191c8f14fd1171d974f965963924966de49d15bad910a38e33dc44af14929e6/0`)
        .expect(200)
        .end((err, res) => {
          expect(res.body.status).toBe(200);
          expect(res.body).toEqual({ status: 200, errors: [], result: [
            {
              "address": "1FmSNBWW2m6d6FDUWxDjaJo9jhNAs9Pekr",
              "index": 0,
              "vout": 0,
              "outputIndex": 0,
              "height": 639672,
              "satoshis": 258900000000,
              "value": 258900000000,
              "blockhash": "0000000000000000033be8c90104b1021412f02d886d09224618a1fc2227394c",
              "script": "76a914a1f93cb1d124a82f8f86b06ef97a4fd6d77c04e288ac",
              "spend_index": 0,
              "spend_txid": "6806a6d0ec0b0e9e2a8171b20d126a371945779628fcf1e8c7034296103453df",
              "scripthash": "ee7beac2fcc315b37f190530d743769f255b1d413edd6e51bbc003022753f909",
              "txid": "3191c8f14fd1171d974f965963924966de49d15bad910a38e33dc44af14929e6",
            },
          ] })
          done();
        });
    }
  );

  test('txid_oIndex 200', async (done) => {
    api
      .get(`${version.path}/txout/3191c8f14fd1171d974f965963924966de49d15bad910a38e33dc44af14929e6_o0`)
      .expect(200)
      .end((err, res) => {
        expect(res.body.status).toBe(200);
        expect(res.body).toEqual({ status: 200, errors: [], result: [
          {
            "address": "1FmSNBWW2m6d6FDUWxDjaJo9jhNAs9Pekr",
            "index": 0,
            "vout": 0,
            "blockhash": "0000000000000000033be8c90104b1021412f02d886d09224618a1fc2227394c",
            "height": 639672,
            "outputIndex": 0,
            "satoshis": 258900000000,
            "value": 258900000000,
            "script": "76a914a1f93cb1d124a82f8f86b06ef97a4fd6d77c04e288ac",
            "scripthash": "ee7beac2fcc315b37f190530d743769f255b1d413edd6e51bbc003022753f909",
            "txid": "3191c8f14fd1171d974f965963924966de49d15bad910a38e33dc44af14929e6",
            "spend_txid": "6806a6d0ec0b0e9e2a8171b20d126a371945779628fcf1e8c7034296103453df",
            "spend_index": 0,
          },
        ]})
        done();
      });
    });

  test('txid_oIndex 404', async (done) => {
    api
      .get(`${version.path}/txout/3191c8f14fd1171d974f965963924966de49d15bad910a38e33dc44af14929e6_o44`)
      .expect(200)
      .end((err, res) => {
        expect(res.body.status).toBe(200);
        expect(res.body).toEqual({ status: 200, errors: [], result: []});
        done();
      });
    });

  test('txid_oIndex 200 CURRENTTEST', async (done) => {
    api
      .get(`${version.path}/txout/txid/3191c8f14fd1171d974f965963924966de49d15bad910a38e33dc44af14929e6_o0`)
      .expect(200)
      .end((err, res) => {
        expect(res.body.status).toBe(200);
        expect(res.body).toEqual({ status: 200, errors: [], result: [
          {
            "address": "1FmSNBWW2m6d6FDUWxDjaJo9jhNAs9Pekr",
            "index": 0,
            "vout": 0,
            "height": 639672,
            "outputIndex": 0,
            "satoshis": 258900000000,
            "value": 258900000000,
            "blockhash": "0000000000000000033be8c90104b1021412f02d886d09224618a1fc2227394c",
            "script": "76a914a1f93cb1d124a82f8f86b06ef97a4fd6d77c04e288ac",
            "scripthash": "ee7beac2fcc315b37f190530d743769f255b1d413edd6e51bbc003022753f909",
            "txid": "3191c8f14fd1171d974f965963924966de49d15bad910a38e33dc44af14929e6",
            "spend_txid": "6806a6d0ec0b0e9e2a8171b20d126a371945779628fcf1e8c7034296103453df",
            "spend_index": 0,
          },
        ]})
        done();
      });
    });

    test('address balance 200', async (done) => {
      api
        .get(`${version.path}/txout/address/balance/1Hw2k2iuhzcrA1Rvm6EuCoiCSp7Sc6mdrv`)
        .expect(200)
        .end((err, res) => {
          expect(res.body.status).toBe(200);
          expect(res.body).toEqual({ status: 200, errors: [], result:
            {
              confirmed: 97259783878,
              unconfirmed: 0,
            },
          })
          done();
        });
    });

    test('scripthash balance 200', async (done) => {
      api
        .get(`${version.path}/txout/scripthash/83f5380f1357a554dfebca67431b400eac3f229745a51b5d2dc70e14f1f6a405/balance`)
        .expect(200)
        .end((err, res) => {
          expect(res.body.status).toBe(200);
          expect(res.body).toEqual({ status: 200, errors: [], result:
            {
              confirmed: 41896755257,
              unconfirmed: 0,
            }
          });
          done();
        });
      });

      test('scripthash balance empty 200', async (done) => {
        api
          .get(`${version.path}/txout/scripthash/ee7beac2fcc315b37f190530d743769f255b1d413edd6e51bbc003022753f909/balance`)
          .expect(200)
          .end((err, res) => {
            expect(res.body.status).toBe(200);
            expect(res.body).toEqual({ status: 200, errors: [], result:
              {
                confirmed: 0,
                unconfirmed: 0,
              }
            });
            done();
          });
        });

    test('address utxos 200', async (done) => {
      api
        .get(`${version.path}/txout/address/1Hw2k2iuhzcrA1Rvm6EuCoiCSp7Sc6mdrv/utxo`)
        .expect(200)
        .end((err, res) => {
          expect(res.body.status).toBe(200);
          expect(res.body).toEqual({ status: 200, errors: [], result: [
            {
              "address": "1Hw2k2iuhzcrA1Rvm6EuCoiCSp7Sc6mdrv",
              "outputIndex": 1,
              "index": 1,
              "blockhash": "00000000000000000320ab6832e4758032f2bc509ce5e5432b1d86e371f51c67",
              "script": "76a914b9b9edb47415c3d6980fec683c60b8b74754df9988ac",
              "height": 639925,
              "satoshis": 97259783878,
              "scripthash": "ba6b41d72241d7264724e62cb2657983595cada758c9a8c535346b517a476e71",
              "txid": "6806a6d0ec0b0e9e2a8171b20d126a371945779628fcf1e8c7034296103453df",
              "value": 97259783878,
              "vout": 1,
            },
          ]})
          done();
        });
    });

    test('scripthash utxo 200 empty ', async (done) => {
      api
        .get(`${version.path}/txout/scripthash/ee7beac2fcc315b37f190530d743769f255b1d413edd6e51bbc003022753f909/utxo`)
        .expect(200)
        .end((err, res) => {
          expect(res.body.status).toBe(200);
          expect(res.body).toEqual({ status: 200, errors: [], result: [
            
          ]})
          done();
        });
    });

    test('scripthash utxo 200 returns', async (done) => {
      api
        .get(`${version.path}/txout/scripthash/83f5380f1357a554dfebca67431b400eac3f229745a51b5d2dc70e14f1f6a405/utxo`)
        .expect(200)
        .end((err, res) => {
          expect(res.body.status).toBe(200);
          expect(res.body).toEqual({ status: 200, errors: [], result: [
            {
              "address": "1ALWjaXQ3Uv2oNN1eDe25Yc7G66g92GV1i",
              "blockhash": "0000000000000000033be8c90104b1021412f02d886d09224618a1fc2227394c",
              "height": 639672,
              "index": 1,
              "outputIndex": 1,
              "satoshis": 41896755257,
              "script": "76a9146669db29de4bdcf70bc48518e3ddf37666aef30988ac",
              "scripthash": "83f5380f1357a554dfebca67431b400eac3f229745a51b5d2dc70e14f1f6a405",
              "txid": "3191c8f14fd1171d974f965963924966de49d15bad910a38e33dc44af14929e6",
              "value": 41896755257,
              "vout": 1,
            },
          ]})
          done();
        });
    });

    test('scripthash all txos 200 CURRENTTEST', async (done) => {
      api
        .get(`${version.path}/txout/scripthash/ee7beac2fcc315b37f190530d743769f255b1d413edd6e51bbc003022753f909`)
        .expect(200)
        .end((err, res) => {
          expect(res.body.status).toBe(200);
 
          expect(res.body).toEqual({ status: 200, errors: [], result: [
            {
              "address": "1FmSNBWW2m6d6FDUWxDjaJo9jhNAs9Pekr",
              "script": "76a914a1f93cb1d124a82f8f86b06ef97a4fd6d77c04e288ac",
              "outputIndex": 0,
              "index": 0,
              "blockhash": "0000000000000000033be8c90104b1021412f02d886d09224618a1fc2227394c",
              "height": 639672,
              "satoshis": 258900000000,
              "scripthash": "ee7beac2fcc315b37f190530d743769f255b1d413edd6e51bbc003022753f909",
              "txid": "3191c8f14fd1171d974f965963924966de49d15bad910a38e33dc44af14929e6",
              "value": 258900000000,
              "vout": 0,
              "spend_txid": "6806a6d0ec0b0e9e2a8171b20d126a371945779628fcf1e8c7034296103453df",
              "spend_index": 0
            },
          ]})
          done();
        });
    });
});
