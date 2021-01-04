const bitwork = require('../index');
const bit = new bitwork({ rpc: { user: 'root', pass: 'bitcoin' } });
bit.on('ready', async () => {
	let headers = await bit.get('header', { at: 598848 }).catch((e) => {
		console.log('Error = ', e);
	});
	console.log('headers = ', headers);
});
