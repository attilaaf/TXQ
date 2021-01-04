const bitwork = require('../index');
const bit = new bitwork({
	rpc: { user: 'root', pass: 'bitcoin', host: '167.99.15.90' },
	peer: { host: '167.99.15.90' },
});
const bit2 = new bitwork({
	rpc: { user: 'root', pass: 'bitcoin', host: '167.99.15.90' },
	peer: { host: '167.99.15.90' },
});
bit.on('ready', async () => {
	bit.on('mempool', (e) => {
		console.log('#1 ', e);
	});
});
bit2.on('ready', async () => {
	bit2.on('mempool', (e) => {
		console.log('#2 ', e);
	});
});
