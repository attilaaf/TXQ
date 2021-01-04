const bitwork = require('../index');
const bit = new bitwork({ rpc: { user: 'root', pass: 'bitcoin' } });
bit.use('parse', 'bob');
bit.on('ready', async () => {
	let tx = await bit.get(
		'rpc',
		'getRawTransaction',
		'da80aa6f5a21b41485b73d268af1d3f89d360cd5c6147b4214af8d5add612b12'
	);
	console.log('tx = ', tx);
});
