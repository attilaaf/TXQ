 
import * as axios from 'axios';

const boot = async () => {
   
};
boot();

describe('scratch ', () => {
  test('test SCRATCH', async (done) => {
    
      console.log('get tx history');
      const response = await axios.default.get(`http://localhost:8097/api/v1/system/tester?api_key=6exBAEVsp64caD1tA1nKfbUyn5DqrWTbyHSV1z7U9G2xJu7HDJFWHnHDv4RosXvKdm&project_id=tdxp&`, {
        headers: {
         
        'content-type': 'application/json',
        },
        maxContentLength: 52428890,
        maxBodyLength: 52428890
      });


    /*
      const response = await axios.default.get(`http://localhost:8097/api/v1/txout/scripthash/unspentoutpoints/1CTKcxmjZF9fk8mgtHA4tCGpnC7CvWyRw?api_key=6exBAEVsp64caD1tA1nKfbUyn5DqrWTbyHSV1z7U9G2xJu7HDJFWHnHDv4RosXvKdm&project_id=tdxp&`, {
        headers: {
         
        'content-type': 'application/json',
        },
        maxContentLength: 52428890,
        maxBodyLength: 52428890
      });

      for (const utxo of response.data.result) {
        const spendResponse = await axios.default.get(`https://txdb.mattercloud.io/api/v1/spends/${utxo.txid}_o${utxo.index + 1}`, {
          headers: {
          
          'content-type': 'application/json',
          },
          maxContentLength: 52428890,
          maxBodyLength: 52428890
        });

        console.log('spend', spendResponse.data);
      }
*/
      console.log('r', response.data);
      done();
    }
  );
});
