const bitwork = require('../index');
const bit = new bitwork({ rpc: { user: 'root', pass: 'bitcoin' } });
bit.use('parse', 'txo');
bit.on('ready', async () => {
	let blk = await bit.get('block', 598439);
	console.log('blk = ', JSON.stringify(blk, null, 2));
});
