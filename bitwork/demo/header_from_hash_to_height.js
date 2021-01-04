const bitwork = require('../index');
const bit = new bitwork({ rpc: { user: 'root', pass: 'bitcoin' } });
bit.on('ready', async () => {
	let headers = await bit.get('header', {
		from: '00000000000000000561861a408c0d3df5f492b4316fba63af139d7e79f69e12',
		to: 598402,
	});
	console.log('headers = ', headers);
});
