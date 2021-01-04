const bitwork = require('../index');
const bit = new bitwork({ rpc: { user: 'root', pass: 'bitcoin' } });
bit.on('ready', async () => {
	let headers = await bit.get('header', {
		from: '00000000000000000637d75f5dfcbde4ad5d03bef24d8a162dcf045ccb88069d',
	});
	console.log('headers = ', headers);
});
