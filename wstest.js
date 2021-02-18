const ws = require('ws');
const client = new ws('ws://localhost:3000/mempool?outputFilter=12jpTUdqZcVhwJ7M8oXrZ7rrLvkFvYbEra&time=2432');
client.on('open', () => {
  client.send('Helloback');
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
       // filter: '000001',
        outputFilter: '12jpTUdqZcVhwJ7M8oXrZ7rrLvkFvYbEra,12jpTUdqZcVhwJ7M8oXrZ7rrLvkFvYbEra',
        lastEventId: 4324,

    })); 

  }, 2000);
});


