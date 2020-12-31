const bitwork = require('../index');
const bit = new bitwork({ rpc: { user: 'root', pass: 'bitcoin' } });
bit.use('parse', 'bob');
bit.on('ready', async () => {
	let info = await bit.get('rpc', 'getInfo');
	console.log('info = ', info);
	let miningInfo = await bit.get('rpc', 'getMiningInfo');
	console.log('miningInfo = ', miningInfo);
});
