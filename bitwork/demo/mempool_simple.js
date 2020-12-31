const bitwork = require('../index');
const bit = new bitwork({
	rpc: { user: 'root', pass: 'bitcoin' },
});
bit.on('ready', async () => {
	console.log('Get mempool');
	let mempool = await bit.get('mempool');
	console.log('mempool transactions = ', mempool.tx);
	/*
  const bit2 = new bitwork({
    rpc: { user: "root", pass: "bitcoin", host: "167.99.15.90" },
    peer: { host : "167.99.15.90" }
  })
  bit2.on("ready", async () => {
    console.log("bit2 ready")
    bit2.on("mempool", (tx) => {
      console.log("realtime", tx)
    })
  })
  */
});
