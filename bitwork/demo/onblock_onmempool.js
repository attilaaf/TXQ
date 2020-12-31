const bitwork = require('../index');
const bit = new bitwork({
	rpc: { user: 'root', pass: 'bitcoin', host: '167.99.15.90' },
	peer: { host: '167.99.15.90' },
});
bit.on('ready', async () => {
	bit.on('mempool', (e) => {
		console.log('onmempool', e);
	});
	bit.on('block', (e) => {
		console.log('onblock', e);
	});
});
