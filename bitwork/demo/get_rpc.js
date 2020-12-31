const bitwork = require('../index');
const bit = new bitwork({ rpc: { user: 'root', pass: 'bitcoin' } });
bit.on('ready', async () => {
	let info = await bit.get('getInfo');
	console.log('info = ', info);
	let miningInfo = await bit.get('getMiningInfo');
	console.log('miningInfo = ', miningInfo);
});
