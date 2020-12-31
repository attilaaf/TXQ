const bitwork = require('../index');
const bit = new bitwork({ rpc: { user: 'root', pass: 'bitcoin' } });
bit.on('ready', async () => {
	let headers = await bit.get('header', {
		from: '00000000000000000637d75f5dfcbde4ad5d03bef24d8a162dcf045ccb88069d',
		to: '00000000000000000b7fc0aa24e4f1574cd24168fd8b3fc33eb6b76b55af2d76',
	});
	console.log('headers = ', headers);
});
