import * as supertest from 'supertest';
import { createExpress } from '../../../../src/bootstrap/express-factory';
let config = require(__dirname + '/../../../../src/cfg/index.ts').default;
let version = require(__dirname + '/../../../../src/api/v1/index.ts');
let url = config.baseurl + ':' + config.api.port;
//api = supertest(url + '' + version.path);
let api;

describe('tx', () => {
  test('txid 404', async (done) => {
      api = supertest(await createExpress());
      api
        .get(`${version.path}/tx/394a5afbb3f07a0399a34a43b73bb04aba174f931d13d341600383383bb51971`)
        .expect(404)
        .end((err, res) => {
          expect(res.body.status).toBe(404);
          expect(res.body).toEqual({ status: 404, errors: [ 'ResourceNotFoundError' ], result: [] })
          done();
        });
    }
  );

  test('post rawtx null channel 200', done => {
    api
      .post(`${version.path}/tx`)
      .send({
        channel: null,
        set: {
          '3191c8f14fd1171d974f965963924966de49d15bad910a38e33dc44af14929e6': {
            rawtx: '010000000ad7bfc5d756b2ff66c425140cfe0a15fbd73cc5cdf66a7306f6c80584952926af010000006b483045022100a935589f6e6b159187b0a95bf24285ebb151b6505c7034ca287bdd2c4fe7cff6022022bb9cfe68a59afbd80c776c3be791639feb5d90d6a02b883ffb9a6b9d319c6541210294af36e7066d6b91a315196616365964df0c1b1200c5ed58646331ef9120abefffffffff440dfb9509a0c320d20ac6d87118aca3fa960c1df8040c94c32f0098ffbdbad8000000006b4830450221009fb01a1d6d7af0644656408d43d5d5f068c15936866fd53aec71ca07669d011e02201da6d87c25132b0d9f570059b15592da6a6036cab7a5520d0a0363da2df18d8e412103aa51688743afe2b05d7cb7d7e431115efba4cbb598c8a85feebe4f9626100287ffffffff36ee5e03c21f8ef62cc2a1b3619f804e5b2275ddd1755cee78dca772a6a59b47010000006b483045022100a674929889e3210f36608f347c5f287aeab3ef22b4ee769f517f856a2525ec0502203f69a512855ccb9c6d78fc7962a05a6122c8240b6d526a698010b2dc1cb024d94121031ab29f042a958eb01996c8b3bd1dc173c823b8d60402ac547bfa8dd4f80f7553ffffffffd6124cc5885e995d7e56c50f1dd340c5aac3b88fa2b2e6e543acee6eea41a0e3010000006a4730440220663da785de8e29fc0fb323fd79728ba2c86d16d4bd66563321f9ea74d41232a70220581a09cc81f8a4b73d23cf763f94f484208d6e9ced079bda737d879d3c58ed254121031ab29f042a958eb01996c8b3bd1dc173c823b8d60402ac547bfa8dd4f80f7553fffffffff8baeaa417e23f3e4abf6ff8eadec9bf798a7effc1592a6e18480f3d243aab35000000006b483045022100e633464d7253773b8ce932590add20ac3952b39f32883c9fda1b40db5c4f869e02205187a4d1529b94fb314d5e8e7511abce8c61d52b462a577815b68531447dc3b5412102fd6248700ce02e8e52622d6d6c53416510af73e6018713766307afb53c4a3273ffffffffde9c5b2bb36f93bbee8bce8fc3eb00d4959a2d1dd9a8a4e822f9a360dc9a4c18010000006b4830450221009370ddf0f1b4109d67a5973f05beb585342305e56b2daada94e6c64257a2a02c0220523d909de8430a2548138895b08242d6e85b8fe0163a16693a8f200d18b218a0412102861b8ed2d3a1892902e3a086fef3d6800600b6e92fb6c8abdbfbdfdf4d4bdd39ffffffff2e3b973abb30227ab9cf3a0228f4a61c2da7d90afa8d510806fe1e6254f1eec5010000006a47304402202d64e9e2830a887a2118e47cea444cfe00956df0aa07080f8ce538e6d05c539b02207d508845516716bde22d3cdbcc7d58c46fba150300761015b68cc5ba1c3640844121039d77a1368b110ac53ef6912ffc2adcc5c8e975e3172441297eeae97795dc5603ffffffffd25127d65fe138df628a68ea699270991e47cb9bf37fd39bb2b8485dd2b0e41a010000006b483045022100df01abd88f5298ca01e0b9fb73f8fe791a8fd7a3d5daf66b10243e5c68a5a6a8022049c6f65eba81fa323a9dbdcbb9a74616ebedd8b646258b8ce02461e9c609b5b2412102db835ff4a2859ad4c6cbc0f780dd57463bf85460def36deebb02e3d208702c24ffffffff0755fc28a9f4b32d9d58ae5888f768302507955968bb04c97dc6dabc3cedb255000000006b483045022100ef9d1cc777347e2007b2ded06609292447e32e07005ba8454371be215a7287ad02202ecae3ef31e4e50331fa68a78ae5a3ab09fe35cd96a748e2b0815bd499fa04c34121021e501032fe6bff85133fe1e40933389d8872d8fe2bd178109ea2799b0b85b3dfffffffffe8cb44b5e92bd9e33933a79f35d602c69b375f7d0a15fb88ccd28988ae5927510c0000006b48304502210090ef43710ab6fc0dc8d9836144e849ccf93c39ee78eee96f170f3067a1b081e1022042541dae2095829af20c073a347c01861b0ed54b680db2c0b2673c0ca683a7864121033204a6791645cd25819b9b4c554e09d16a972a655561eaa129f6cf1264722da6ffffffff02007da4473c0000001976a914a1f93cb1d124a82f8f86b06ef97a4fd6d77c04e288ac39c03dc1090000001976a9146669db29de4bdcf70bc48518e3ddf37666aef30988ac00000000',
            meta: {
              title: 'abc',
              content: 'content123',
              url: 'url',
              image: 'image',
              description: 'desc'
            },
            tags: []
          },
          '7895bfd75e0db3c0305d3edc098e3edbe326c451f155305f4c8f5fd76096161f': {
            rawtx: '010000000137b78bd8c2bb99d4f587b78b4049234f376c31b12e51f70fd1454a69bd6be7e0600000006b4830450221008d7dc8a4d1cdfee37f40276ba8a9146036388ee7d07864cd3ce1d1a377d3d70902204af105402869d1c382341574915b7bc22873352889fced102c06683b595ae9464121036c8e693e962817ebbe672e9800170760d89777c166d401fb4fdb492c55b4a6e5ffffffff0123020000000000001976a91458ef6dcedee6cd4403e4c12880896111f43be2e088ac00000000',
          }
        }
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        expect(res.body.status).toBe(200);
        expect(res.body).toEqual({"errors": [],
          "result": [
            "3191c8f14fd1171d974f965963924966de49d15bad910a38e33dc44af14929e6",
            '7895bfd75e0db3c0305d3edc098e3edbe326c451f155305f4c8f5fd76096161f',
          ],
          "status": 200
        });
        // So we process the tx
        setTimeout(function (e) {
          done();
        }, 0);
      });
  });

  test('post rawtx foobar channel 200', done => {
    api
      .post(`${version.path}/tx`)
      .send({
        channel: 'foobar',
        set: {
          '3191c8f14fd1171d974f965963924966de49d15bad910a38e33dc44af14929e6': {
            rawtx: '010000000ad7bfc5d756b2ff66c425140cfe0a15fbd73cc5cdf66a7306f6c80584952926af010000006b483045022100a935589f6e6b159187b0a95bf24285ebb151b6505c7034ca287bdd2c4fe7cff6022022bb9cfe68a59afbd80c776c3be791639feb5d90d6a02b883ffb9a6b9d319c6541210294af36e7066d6b91a315196616365964df0c1b1200c5ed58646331ef9120abefffffffff440dfb9509a0c320d20ac6d87118aca3fa960c1df8040c94c32f0098ffbdbad8000000006b4830450221009fb01a1d6d7af0644656408d43d5d5f068c15936866fd53aec71ca07669d011e02201da6d87c25132b0d9f570059b15592da6a6036cab7a5520d0a0363da2df18d8e412103aa51688743afe2b05d7cb7d7e431115efba4cbb598c8a85feebe4f9626100287ffffffff36ee5e03c21f8ef62cc2a1b3619f804e5b2275ddd1755cee78dca772a6a59b47010000006b483045022100a674929889e3210f36608f347c5f287aeab3ef22b4ee769f517f856a2525ec0502203f69a512855ccb9c6d78fc7962a05a6122c8240b6d526a698010b2dc1cb024d94121031ab29f042a958eb01996c8b3bd1dc173c823b8d60402ac547bfa8dd4f80f7553ffffffffd6124cc5885e995d7e56c50f1dd340c5aac3b88fa2b2e6e543acee6eea41a0e3010000006a4730440220663da785de8e29fc0fb323fd79728ba2c86d16d4bd66563321f9ea74d41232a70220581a09cc81f8a4b73d23cf763f94f484208d6e9ced079bda737d879d3c58ed254121031ab29f042a958eb01996c8b3bd1dc173c823b8d60402ac547bfa8dd4f80f7553fffffffff8baeaa417e23f3e4abf6ff8eadec9bf798a7effc1592a6e18480f3d243aab35000000006b483045022100e633464d7253773b8ce932590add20ac3952b39f32883c9fda1b40db5c4f869e02205187a4d1529b94fb314d5e8e7511abce8c61d52b462a577815b68531447dc3b5412102fd6248700ce02e8e52622d6d6c53416510af73e6018713766307afb53c4a3273ffffffffde9c5b2bb36f93bbee8bce8fc3eb00d4959a2d1dd9a8a4e822f9a360dc9a4c18010000006b4830450221009370ddf0f1b4109d67a5973f05beb585342305e56b2daada94e6c64257a2a02c0220523d909de8430a2548138895b08242d6e85b8fe0163a16693a8f200d18b218a0412102861b8ed2d3a1892902e3a086fef3d6800600b6e92fb6c8abdbfbdfdf4d4bdd39ffffffff2e3b973abb30227ab9cf3a0228f4a61c2da7d90afa8d510806fe1e6254f1eec5010000006a47304402202d64e9e2830a887a2118e47cea444cfe00956df0aa07080f8ce538e6d05c539b02207d508845516716bde22d3cdbcc7d58c46fba150300761015b68cc5ba1c3640844121039d77a1368b110ac53ef6912ffc2adcc5c8e975e3172441297eeae97795dc5603ffffffffd25127d65fe138df628a68ea699270991e47cb9bf37fd39bb2b8485dd2b0e41a010000006b483045022100df01abd88f5298ca01e0b9fb73f8fe791a8fd7a3d5daf66b10243e5c68a5a6a8022049c6f65eba81fa323a9dbdcbb9a74616ebedd8b646258b8ce02461e9c609b5b2412102db835ff4a2859ad4c6cbc0f780dd57463bf85460def36deebb02e3d208702c24ffffffff0755fc28a9f4b32d9d58ae5888f768302507955968bb04c97dc6dabc3cedb255000000006b483045022100ef9d1cc777347e2007b2ded06609292447e32e07005ba8454371be215a7287ad02202ecae3ef31e4e50331fa68a78ae5a3ab09fe35cd96a748e2b0815bd499fa04c34121021e501032fe6bff85133fe1e40933389d8872d8fe2bd178109ea2799b0b85b3dfffffffffe8cb44b5e92bd9e33933a79f35d602c69b375f7d0a15fb88ccd28988ae5927510c0000006b48304502210090ef43710ab6fc0dc8d9836144e849ccf93c39ee78eee96f170f3067a1b081e1022042541dae2095829af20c073a347c01861b0ed54b680db2c0b2673c0ca683a7864121033204a6791645cd25819b9b4c554e09d16a972a655561eaa129f6cf1264722da6ffffffff02007da4473c0000001976a914a1f93cb1d124a82f8f86b06ef97a4fd6d77c04e288ac39c03dc1090000001976a9146669db29de4bdcf70bc48518e3ddf37666aef30988ac00000000',
            meta: {
              title: 'foobar abc',
              content: 'foobar content123',
              url: 'foobar url',
              image: 'foobar image',
              description: 'foobar desc'
            },
            tags: [ 'foobartag' ]
          }
        }
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        expect(res.body.status).toBe(200);
        expect(res.body).toEqual({"errors": [],
          "result": [
            "3191c8f14fd1171d974f965963924966de49d15bad910a38e33dc44af14929e6",
          ],
          "status": 200
        });
        // So we process the tx
        setTimeout(function (e) {
          done();
        }, 0)
      });
  });

  test('txid 200', async (done) => {
    api
      .get(`${version.path}/tx/3191c8f14fd1171d974f965963924966de49d15bad910a38e33dc44af14929e6`)
      .expect(200)
      .end((err, res) => {
        expect(res.body.status).toBe(200);
        if (res.body.result.status) {
          delete res.body.result.status
        }
        delete res.body.result.updated_at;
        delete res.body.result.created_at;
        delete res.body.result.id;
        delete res.body.result.h;
        delete res.body.result.i;
        delete res.body.result.completed;
        expect(res.body).toEqual({
          "status":200,
          "errors":[

          ],
          "result":{
            "txid":"3191c8f14fd1171d974f965963924966de49d15bad910a38e33dc44af14929e6",
            "rawtx":"010000000ad7bfc5d756b2ff66c425140cfe0a15fbd73cc5cdf66a7306f6c80584952926af010000006b483045022100a935589f6e6b159187b0a95bf24285ebb151b6505c7034ca287bdd2c4fe7cff6022022bb9cfe68a59afbd80c776c3be791639feb5d90d6a02b883ffb9a6b9d319c6541210294af36e7066d6b91a315196616365964df0c1b1200c5ed58646331ef9120abefffffffff440dfb9509a0c320d20ac6d87118aca3fa960c1df8040c94c32f0098ffbdbad8000000006b4830450221009fb01a1d6d7af0644656408d43d5d5f068c15936866fd53aec71ca07669d011e02201da6d87c25132b0d9f570059b15592da6a6036cab7a5520d0a0363da2df18d8e412103aa51688743afe2b05d7cb7d7e431115efba4cbb598c8a85feebe4f9626100287ffffffff36ee5e03c21f8ef62cc2a1b3619f804e5b2275ddd1755cee78dca772a6a59b47010000006b483045022100a674929889e3210f36608f347c5f287aeab3ef22b4ee769f517f856a2525ec0502203f69a512855ccb9c6d78fc7962a05a6122c8240b6d526a698010b2dc1cb024d94121031ab29f042a958eb01996c8b3bd1dc173c823b8d60402ac547bfa8dd4f80f7553ffffffffd6124cc5885e995d7e56c50f1dd340c5aac3b88fa2b2e6e543acee6eea41a0e3010000006a4730440220663da785de8e29fc0fb323fd79728ba2c86d16d4bd66563321f9ea74d41232a70220581a09cc81f8a4b73d23cf763f94f484208d6e9ced079bda737d879d3c58ed254121031ab29f042a958eb01996c8b3bd1dc173c823b8d60402ac547bfa8dd4f80f7553fffffffff8baeaa417e23f3e4abf6ff8eadec9bf798a7effc1592a6e18480f3d243aab35000000006b483045022100e633464d7253773b8ce932590add20ac3952b39f32883c9fda1b40db5c4f869e02205187a4d1529b94fb314d5e8e7511abce8c61d52b462a577815b68531447dc3b5412102fd6248700ce02e8e52622d6d6c53416510af73e6018713766307afb53c4a3273ffffffffde9c5b2bb36f93bbee8bce8fc3eb00d4959a2d1dd9a8a4e822f9a360dc9a4c18010000006b4830450221009370ddf0f1b4109d67a5973f05beb585342305e56b2daada94e6c64257a2a02c0220523d909de8430a2548138895b08242d6e85b8fe0163a16693a8f200d18b218a0412102861b8ed2d3a1892902e3a086fef3d6800600b6e92fb6c8abdbfbdfdf4d4bdd39ffffffff2e3b973abb30227ab9cf3a0228f4a61c2da7d90afa8d510806fe1e6254f1eec5010000006a47304402202d64e9e2830a887a2118e47cea444cfe00956df0aa07080f8ce538e6d05c539b02207d508845516716bde22d3cdbcc7d58c46fba150300761015b68cc5ba1c3640844121039d77a1368b110ac53ef6912ffc2adcc5c8e975e3172441297eeae97795dc5603ffffffffd25127d65fe138df628a68ea699270991e47cb9bf37fd39bb2b8485dd2b0e41a010000006b483045022100df01abd88f5298ca01e0b9fb73f8fe791a8fd7a3d5daf66b10243e5c68a5a6a8022049c6f65eba81fa323a9dbdcbb9a74616ebedd8b646258b8ce02461e9c609b5b2412102db835ff4a2859ad4c6cbc0f780dd57463bf85460def36deebb02e3d208702c24ffffffff0755fc28a9f4b32d9d58ae5888f768302507955968bb04c97dc6dabc3cedb255000000006b483045022100ef9d1cc777347e2007b2ded06609292447e32e07005ba8454371be215a7287ad02202ecae3ef31e4e50331fa68a78ae5a3ab09fe35cd96a748e2b0815bd499fa04c34121021e501032fe6bff85133fe1e40933389d8872d8fe2bd178109ea2799b0b85b3dfffffffffe8cb44b5e92bd9e33933a79f35d602c69b375f7d0a15fb88ccd28988ae5927510c0000006b48304502210090ef43710ab6fc0dc8d9836144e849ccf93c39ee78eee96f170f3067a1b081e1022042541dae2095829af20c073a347c01861b0ed54b680db2c0b2673c0ca683a7864121033204a6791645cd25819b9b4c554e09d16a972a655561eaa129f6cf1264722da6ffffffff02007da4473c0000001976a914a1f93cb1d124a82f8f86b06ef97a4fd6d77c04e288ac39c03dc1090000001976a9146669db29de4bdcf70bc48518e3ddf37666aef30988ac00000000",
            // "h":"0000000000000000033be8c90104b1021412f02d886d09224618a1fc2227394c",
            // "i":639672,
            "send":null,
            /*"status":{
              "valid":true,
              "payload":{
                  // "minerId":"0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
                  "blockHash":"0000000000000000033be8c90104b1021412f02d886d09224618a1fc2227394c",
                  // "timestamp":"2020-07-19T16:33:26.900Z",
                  "apiVersion":"0.1.0",
                  "blockHeight":639672,
                  "returnResult":"success",
                  // "confirmations":4725,
                  "resultDescription":"",
                  "txSecondMempoolExpiry":0
              },*/
              // "encoding":"UTF-8",
              //  "mimetype":"application/json",
              // "publicKey":"0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
              // "signature":"3045022100cca6d2347bc2e2cac7b4f746bdb0527df0f884e1a42b3e42a2b8eb557a93cec302204c13ab830203f38bb8fb133d92de2f4e310c3fe89bf79fb3f671d026f8b951a1"
            //},
            // "completed": true,
            // "updated_at":1595177303,
            // "created_at":1595176406,
            // "id":743,
            "channel":"",
            "metadata":{

            },
            "tags":[

            ],
            "extracted":{

            }
          }
        })
        done();
      });
    });

  test('txid2 200', async (done) => {
    api
      .get(`${version.path}/tx/7895bfd75e0db3c0305d3edc098e3edbe326c451f155305f4c8f5fd76096161f`)
      .expect(200)
      .end((err, res) => {
        expect(res.body.status).toBe(200);
        if (res.body.result.status) {
          delete res.body.result.status
        }
        delete res.body.result.updated_at;
        delete res.body.result.created_at;
        delete res.body.result.id;
        delete res.body.result.h;
        delete res.body.result.i;
        delete res.body.result.completed;
        expect(res.body).toEqual({
          "status":200,
          "errors":[

          ],
          "result":{
            "txid":"7895bfd75e0db3c0305d3edc098e3edbe326c451f155305f4c8f5fd76096161f",
            "rawtx":"010000000137b78bd8c2bb99d4f587b78b4049234f376c31b12e51f70fd1454a69bd6be7e0600000006b4830450221008d7dc8a4d1cdfee37f40276ba8a9146036388ee7d07864cd3ce1d1a377d3d70902204af105402869d1c382341574915b7bc22873352889fced102c06683b595ae9464121036c8e693e962817ebbe672e9800170760d89777c166d401fb4fdb492c55b4a6e5ffffffff0123020000000000001976a91458ef6dcedee6cd4403e4c12880896111f43be2e088ac00000000",
            // "h":"0000000000000000033be8c90104b1021412f02d886d09224618a1fc2227394c",
            // "i":639672,
            "send":null,
            /*"status":{
              "valid":true,
              "payload":{
                  // "minerId":"0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
                  "blockHash":"0000000000000000033be8c90104b1021412f02d886d09224618a1fc2227394c",
                  // "timestamp":"2020-07-19T16:33:26.900Z",
                  "apiVersion":"0.1.0",
                  "blockHeight":639672,
                  "returnResult":"success",
                  // "confirmations":4725,
                  "resultDescription":"",
                  "txSecondMempoolExpiry":0
              },*/
              // "encoding":"UTF-8",
              //  "mimetype":"application/json",
              // "publicKey":"0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
              // "signature":"3045022100cca6d2347bc2e2cac7b4f746bdb0527df0f884e1a42b3e42a2b8eb557a93cec302204c13ab830203f38bb8fb133d92de2f4e310c3fe89bf79fb3f671d026f8b951a1"
            //},
            // "completed": true,
            // "updated_at":1595177303,
            // "created_at":1595176406,
            // "id":743,
            "channel":"",
            "metadata":{

            },
            "tags": {},
            "extracted":{

            }
          }
        })
        done();
      });
    });

    test('get txid foobar channel 200', async (done) => {
      api
      .get(`${version.path}/tx/3191c8f14fd1171d974f965963924966de49d15bad910a38e33dc44af14929e6/channel/foobar`)
      .expect(200)
      .end((err, res) => {
        expect(res.body.status).toBe(200);
        if (res.body.result.status) {
          delete res.body.result.status
        }
        delete res.body.result.updated_at;
        delete res.body.result.created_at;
        delete res.body.result.id;
        delete res.body.result.h;
        delete res.body.result.i;
        delete res.body.result.completed;
        expect(res.body).toEqual({
          "status":200,
          "errors":[

          ],
          "result":{
            "txid":"3191c8f14fd1171d974f965963924966de49d15bad910a38e33dc44af14929e6",
            "rawtx":"010000000ad7bfc5d756b2ff66c425140cfe0a15fbd73cc5cdf66a7306f6c80584952926af010000006b483045022100a935589f6e6b159187b0a95bf24285ebb151b6505c7034ca287bdd2c4fe7cff6022022bb9cfe68a59afbd80c776c3be791639feb5d90d6a02b883ffb9a6b9d319c6541210294af36e7066d6b91a315196616365964df0c1b1200c5ed58646331ef9120abefffffffff440dfb9509a0c320d20ac6d87118aca3fa960c1df8040c94c32f0098ffbdbad8000000006b4830450221009fb01a1d6d7af0644656408d43d5d5f068c15936866fd53aec71ca07669d011e02201da6d87c25132b0d9f570059b15592da6a6036cab7a5520d0a0363da2df18d8e412103aa51688743afe2b05d7cb7d7e431115efba4cbb598c8a85feebe4f9626100287ffffffff36ee5e03c21f8ef62cc2a1b3619f804e5b2275ddd1755cee78dca772a6a59b47010000006b483045022100a674929889e3210f36608f347c5f287aeab3ef22b4ee769f517f856a2525ec0502203f69a512855ccb9c6d78fc7962a05a6122c8240b6d526a698010b2dc1cb024d94121031ab29f042a958eb01996c8b3bd1dc173c823b8d60402ac547bfa8dd4f80f7553ffffffffd6124cc5885e995d7e56c50f1dd340c5aac3b88fa2b2e6e543acee6eea41a0e3010000006a4730440220663da785de8e29fc0fb323fd79728ba2c86d16d4bd66563321f9ea74d41232a70220581a09cc81f8a4b73d23cf763f94f484208d6e9ced079bda737d879d3c58ed254121031ab29f042a958eb01996c8b3bd1dc173c823b8d60402ac547bfa8dd4f80f7553fffffffff8baeaa417e23f3e4abf6ff8eadec9bf798a7effc1592a6e18480f3d243aab35000000006b483045022100e633464d7253773b8ce932590add20ac3952b39f32883c9fda1b40db5c4f869e02205187a4d1529b94fb314d5e8e7511abce8c61d52b462a577815b68531447dc3b5412102fd6248700ce02e8e52622d6d6c53416510af73e6018713766307afb53c4a3273ffffffffde9c5b2bb36f93bbee8bce8fc3eb00d4959a2d1dd9a8a4e822f9a360dc9a4c18010000006b4830450221009370ddf0f1b4109d67a5973f05beb585342305e56b2daada94e6c64257a2a02c0220523d909de8430a2548138895b08242d6e85b8fe0163a16693a8f200d18b218a0412102861b8ed2d3a1892902e3a086fef3d6800600b6e92fb6c8abdbfbdfdf4d4bdd39ffffffff2e3b973abb30227ab9cf3a0228f4a61c2da7d90afa8d510806fe1e6254f1eec5010000006a47304402202d64e9e2830a887a2118e47cea444cfe00956df0aa07080f8ce538e6d05c539b02207d508845516716bde22d3cdbcc7d58c46fba150300761015b68cc5ba1c3640844121039d77a1368b110ac53ef6912ffc2adcc5c8e975e3172441297eeae97795dc5603ffffffffd25127d65fe138df628a68ea699270991e47cb9bf37fd39bb2b8485dd2b0e41a010000006b483045022100df01abd88f5298ca01e0b9fb73f8fe791a8fd7a3d5daf66b10243e5c68a5a6a8022049c6f65eba81fa323a9dbdcbb9a74616ebedd8b646258b8ce02461e9c609b5b2412102db835ff4a2859ad4c6cbc0f780dd57463bf85460def36deebb02e3d208702c24ffffffff0755fc28a9f4b32d9d58ae5888f768302507955968bb04c97dc6dabc3cedb255000000006b483045022100ef9d1cc777347e2007b2ded06609292447e32e07005ba8454371be215a7287ad02202ecae3ef31e4e50331fa68a78ae5a3ab09fe35cd96a748e2b0815bd499fa04c34121021e501032fe6bff85133fe1e40933389d8872d8fe2bd178109ea2799b0b85b3dfffffffffe8cb44b5e92bd9e33933a79f35d602c69b375f7d0a15fb88ccd28988ae5927510c0000006b48304502210090ef43710ab6fc0dc8d9836144e849ccf93c39ee78eee96f170f3067a1b081e1022042541dae2095829af20c073a347c01861b0ed54b680db2c0b2673c0ca683a7864121033204a6791645cd25819b9b4c554e09d16a972a655561eaa129f6cf1264722da6ffffffff02007da4473c0000001976a914a1f93cb1d124a82f8f86b06ef97a4fd6d77c04e288ac39c03dc1090000001976a9146669db29de4bdcf70bc48518e3ddf37666aef30988ac00000000",
            // "h":"0000000000000000033be8c90104b1021412f02d886d09224618a1fc2227394c",
            // "i":639672,
            "send":null,
            /*"status":{
              "valid":true,
              "payload":{
                  // "minerId":"0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
                  "blockHash":"0000000000000000033be8c90104b1021412f02d886d09224618a1fc2227394c",
                  // "timestamp":"2020-07-19T16:33:26.900Z",
                  "apiVersion":"0.1.0",
                  "blockHeight":639672,
                  "returnResult":"success",
                  // "confirmations":4725,
                  "resultDescription":"",
                  "txSecondMempoolExpiry":0
              },*/
              // "encoding":"UTF-8",
              //  "mimetype":"application/json",
              // "publicKey":"0211ccfc29e3058b770f3cf3eb34b0b2fd2293057a994d4d275121be4151cdf087",
              // "signature":"3045022100cca6d2347bc2e2cac7b4f746bdb0527df0f884e1a42b3e42a2b8eb557a93cec302204c13ab830203f38bb8fb133d92de2f4e310c3fe89bf79fb3f671d026f8b951a1"
            //},
            // "completed": true,
            // "updated_at":1595177303,
            // "created_at":1595176406,
            // "id":743,
            "channel":"foobar",
            "metadata":{

            },
            "tags":[
              'foobartag'
            ],
            "extracted":{

            }
          }
        })

        done();
      });

    });

    test('get txs for sync 200', async (done) => {
      api
      .get(`${version.path}/tx/sync`)
      .expect(200)
      .end((err, res) => {
        expect(res.body.status).toBe(200);

        expect(res.body).toEqual({
          "status":200,
          "errors":[

          ],
          "result":  [
            '7895bfd75e0db3c0305d3edc098e3edbe326c451f155305f4c8f5fd76096161f',
            '3191c8f14fd1171d974f965963924966de49d15bad910a38e33dc44af14929e6'
          ]
        })

        done();
      });

    });

    test('resync tx fresh 200', async (done) => {
      api
      .post(`${version.path}/tx/3191c8f14fd1171d974f965963924966de49d15bad910a38e33dc44af14929e6/resync`)
      .expect(200)
      .end((err, res) => {
        expect(res.body.status).toBe(200);

        expect(res.body).toEqual({
          "status":200,
          "errors":[
          ],
          "result":  {}
        })

        done();
      });

    });

    test('sync tx status fresh 200', async (done) => {
      api
      .post(`${version.path}/tx/3191c8f14fd1171d974f965963924966de49d15bad910a38e33dc44af14929e6/sync`)
      .expect(200)
      .end((err, res) => {
        expect(res.body.status).toBe(200);

        if (res.body.result.payload) {
          delete res.body.result.payload;
        }

        if (res.body.result.publicKey) {
          delete res.body.result.publicKey;
        }

        if (res.body.result.signature) {
          delete res.body.result.signature;
        }

        delete res.body.result.mapiResponses;
        delete res.body.result.mapiName;
        delete res.body.result.mapiEndpoint;
        delete res.body.result.mapiStatusCode;

        expect(res.body).toEqual({
          "status":200,
          "errors":[
          ],
          "result":  {
            "encoding": "UTF-8",
            "mimetype": "application/json"
          }
        });

        done();
      });

    });

  });
