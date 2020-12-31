const bitwork = require('../index');
const bit = new bitwork({ rpc: { user: 'root', pass: 'bitcoin' } });
bit.on('ready', async () => {
	let headers = await bit.get('header', { from: 598400, to: 598402 });
	console.log('headers = ', headers);
});
