const ws = require('ws');
// const client = new ws('ws://public.app.mattercloud.io/mempool/?outputFilter=12jpTUdqZcVhwJ7M8oXrZ7rrLvkFvYbEra&time=2432');
// const client = new ws('ws://public.app.mattercloud.io/mempool?outputFilter=12jpTUdqZcVhwJ7M8oXrZ7rrLvkFvYbEra&time=2432');
const client = new ws('ws://public.app.mattercloud.io/mempool/68656c6c6f?outpudtFilter=12jpTUdqZcVhwJ7M8oXrZ7rrLvkFvYbEra&time=2432');
client.on('open', () => {
  client.on('message', (e) => {
    console.log('message received: ', e);
  });
  client.on('pong', (e) => {
    console.log('Pong received: ', e.toString('utf8'));
  });
  const inter = setInterval(function timeout() {
    console.log('sending ping...');
    client.ping(JSON.stringify({
        method: 'ping',
        time: new Date()
    }));

    client.send(JSON.stringify({
        method: 'getMessages',
        // Matches the hex string anywhere in a transaction output
        // filter: '68656c6c6f',
        // Matches output filter, can seperate by commas for multiple addresses or scripthashes
        outputFilter: '12jpTUdqZcVhwJ7M8oXrZ7rrLvkFvYbEra',
        // Can be used to replay messages for the filter and outputFilter for the last `id`
        lastEventId: 4324,
        // Can be used to replay messages for the filter and outputFilter since time (unixtime)
        time: 1613841278332
    })); 

  }, 2000);
});


