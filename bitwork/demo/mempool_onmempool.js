const bitwork = require('../index');
const bit = new bitwork({
	rpc: { user: 'root', pass: 'bitcoin', host: '167.99.15.90' },
	peer: { host: '167.99.15.90' },
});
bit.name = 'bit';
const bit2 = new bitwork({
	rpc: { user: 'root', pass: 'bitcoin', host: '167.99.15.90' },
	peer: { host: '167.99.15.90' },
});
bit2.name = 'bit2';
bit.on('ready', async () => {
	console.log('fetching mempool');
	let m = await bit.get('mempool');
	console.log('mempool = ', bit.name, m);
	//  bit.on("mempool", (e) => {
	//    console.log("onmempool", e)
	//  })
});
bit2.on('ready', async () => {
	bit2.on('mempool', (e) => {
		console.log('# onmempool', bit2.name, e);
	});
});
