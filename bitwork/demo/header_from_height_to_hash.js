const bitwork = require('../index');
const bit = new bitwork({ rpc: { user: 'root', pass: 'bitcoin' } });
bit.on('ready', async () => {
	let headers = await bit.get('header', {
		from: 598400,
		to: '000000000000000000d81378985900048871a07bcb9a69341c38a6e47df7021a',
	});
	console.log('headers = ', headers);
});
