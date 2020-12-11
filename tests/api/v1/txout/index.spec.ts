import * as supertest from 'supertest';
import { createExpress } from '../../../../src/bootstrap/express-factory';
let config = require(__dirname + '/../../../../src/cfg/index.ts').default;
let version = require(__dirname + '/../../../../src/api/v1/index.ts');
let url = config.baseurl + ':' + config.api.port;
//api = supertest(url + '' + version.path);
let api;

describe('txout', () => {
  test('txid/index 200', async (done) => {
      api = supertest(await createExpress());
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
              "script": "76a914a1f93cb1d124a82f8f86b06ef97a4fd6d77c04e288ac",
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
            "height": 639672,
            "outputIndex": 0,
            "satoshis": 258900000000,
            "value": 258900000000,
            "script": "76a914a1f93cb1d124a82f8f86b06ef97a4fd6d77c04e288ac",
            "scripthash": "ee7beac2fcc315b37f190530d743769f255b1d413edd6e51bbc003022753f909",
            "txid": "3191c8f14fd1171d974f965963924966de49d15bad910a38e33dc44af14929e6",
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

  test('txid_oIndex 200', async (done) => {
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
            "script": "76a914a1f93cb1d124a82f8f86b06ef97a4fd6d77c04e288ac",
            "scripthash": "ee7beac2fcc315b37f190530d743769f255b1d413edd6e51bbc003022753f909",
            "txid": "3191c8f14fd1171d974f965963924966de49d15bad910a38e33dc44af14929e6",
          },
        ]})
        done();
      });
    });

    test('addess balance 200', async (done) => {
      api
        .get(`${version.path}/txout/address/1FmSNBWW2m6d6FDUWxDjaJo9jhNAs9Pekr/balance`)
        .expect(200)
        .end((err, res) => {
          expect(res.body.status).toBe(200);
          expect(res.body).toEqual({ status: 200, errors: [], result:
            {
              confirmed: 258900000000,
              unconfirmed: 0,
            },
          })
          done();
        });
    });

    test('scripthash balance 200', async (done) => {
      api
        .get(`${version.path}/txout/scripthash/ee7beac2fcc315b37f190530d743769f255b1d413edd6e51bbc003022753f909/balance`)
        .expect(200)
        .end((err, res) => {
          expect(res.body.status).toBe(200);
          expect(res.body).toEqual({ status: 200, errors: [], result:
            {
              confirmed: 258900000000,
              unconfirmed: 0,
            }
          });
          done();
        });
      });

    test('addess utxos 200', async (done) => {
      api
        .get(`${version.path}/txout/address/1FmSNBWW2m6d6FDUWxDjaJo9jhNAs9Pekr/utxo`)
        .expect(200)
        .end((err, res) => {
          expect(res.body.status).toBe(200);
          expect(res.body).toEqual({ status: 200, errors: [], result: [
            {
              "address": "1FmSNBWW2m6d6FDUWxDjaJo9jhNAs9Pekr",
              "outputIndex": 0,
              "index": 0,
              "height": 639672,
              "satoshis": 258900000000,
              "scripthash": "ee7beac2fcc315b37f190530d743769f255b1d413edd6e51bbc003022753f909",
              "txid": "3191c8f14fd1171d974f965963924966de49d15bad910a38e33dc44af14929e6",
              "value": 258900000000,
              "vout": 0,
            },
          ]})
          done();
        });
    });

    test('scripthash utxo 200', async (done) => {
      api
        .get(`${version.path}/txout/scripthash/ee7beac2fcc315b37f190530d743769f255b1d413edd6e51bbc003022753f909/utxo`)
        .expect(200)
        .end((err, res) => {
          expect(res.body.status).toBe(200);
          expect(res.body).toEqual({ status: 200, errors: [], result: [
            {
              "address": "1FmSNBWW2m6d6FDUWxDjaJo9jhNAs9Pekr",
              "outputIndex": 0,
              "index": 0,
              "height": 639672,
              "satoshis": 258900000000,
              "scripthash": "ee7beac2fcc315b37f190530d743769f255b1d413edd6e51bbc003022753f909",
              "txid": "3191c8f14fd1171d974f965963924966de49d15bad910a38e33dc44af14929e6",
              "value": 258900000000,
              "vout": 0,
            },
          ]})
          done();
        });
      });
});
