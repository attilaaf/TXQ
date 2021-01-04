const bitwork = require('../index');
const bit2 = new bitwork({
	rpc: { user: 'root', pass: 'bitcoin', host: '167.99.15.90' },
	peer: { host: '167.99.15.90' },
});
bit2.on('ready', async () => {
	let mem = await bit2.get('mempool');
	console.log('Initial mempool', mem);
});
const bit = new bitwork({
	rpc: { user: 'root', pass: 'bitcoin', host: '167.99.15.90' },
	peer: { host: '167.99.15.90' },
});
bit.on('ready', async () => {
	console.log('bit ready');
	bit.on('mempool', (e) => {
		console.log('onmempool');
	});
	bit.on('block', async (e) => {
		console.log('onblock', e);
		let mem = await bit2.get('mempool');
		console.log('current mempool = ', mem);
	});
});
