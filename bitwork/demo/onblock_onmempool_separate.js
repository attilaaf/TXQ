const bitwork = require('../index');
const bit2 = new bitwork({
	rpc: { user: 'root', pass: 'bitcoin', host: '167.99.15.90' },
	peer: { host: '167.99.15.90' },
});
bit2.name = '## bit2';
bit2.on('ready', async () => {
	console.log('bit2 ready');
	//  bit2.on("mempool", (e) => {
	//    console.log("2 onmempool")
	//  })
});
bit2.on('block', (e) => {
	console.log('2 onblock', e);
});
const bit = new bitwork({
	rpc: { user: 'root', pass: 'bitcoin', host: '167.99.15.90' },
	peer: { host: '167.99.15.90' },
});
bit.name = '## bit';
bit.on('ready', async () => {
	console.log('bit ready');
});
bit.on('mempool', (e) => {
	console.log('1 onmempool');
});
