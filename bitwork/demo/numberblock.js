const bitwork = require('../index');
const bit = new bitwork({ rpc: { user: 'root', pass: 'bitcoin' } });
bit.use('parse', 'bob');
bit.on('ready', async () => {
	let blk = await bit.get('block', 598439);
	console.log('blk = ', blk);
});
