const bitwork = require('../index');
const bit = new bitwork({ rpc: { user: 'root', pass: 'bitcoin' } });
bit.use('parse', 'bob');
bit.on('ready', async () => {
	let { tx, header } = await bit.get('block', 598966);
	console.log('block header = ', header);
	console.log('block transactions = ', tx);

	let mempool = await bit.get('mempool');
	console.log('mempool = ', mempool);
});
