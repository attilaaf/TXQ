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
describe('txoutgroup', () => {

  test('create new group for scripthash CURRENTS', async (done) => {
    // ba6b41d72241d7264724e62cb2657983595cada758c9a8c535346b517a476e71
     api
      .post(`${version.path}/txoutgroup/mygroup1`)
      .send({
        items: [
          {
            scriptid: 'ba6b41d72241d7264724e62cb2657983595cada758c9a8c535346b517a476e71',
            metadata: { foo: 123 }
          }
        ]
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        expect(res.body.status).toBe(200);
        expect(res.body).toEqual({"errors": [],
          "result": {},
          "status": 200
        });
        // So we process the tx
        setTimeout(function (e) {
          done();
        }, 0);
      });
 
  });

  test('create new group for scripthash', async (done) => {
      api
      .get(`${version.path}/txoutgroup/mygroup1`)
      .expect(200)
      .end((err, res) => {
        expect(res.body.status).toBe(200);
        expect(res.body).toEqual({
          "status": 200,
          errors: [],
          "result": [
            {
              "created_at": 1608239644,
              "groupname": "mygroup1",
              "metadata":  {
                "foo": 123,
              },
              "scriptid": "ba6b41d72241d7264724e62cb2657983595cada758c9a8c535346b517a476e71",
            },
          ],
        })

        done();
      });
    }
    // ba6b41d72241d7264724e62cb2657983595cada758c9a8c535346b517a476e71
  );
});
