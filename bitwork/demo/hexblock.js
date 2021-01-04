const bitwork = require('../index');
const bit = new bitwork({ rpc: { user: 'root', pass: 'bitcoin' } });
bit.use('parse', 'raw');
bit.on('ready', async () => {
	let blk = await bit.get(
		'block',
		'00000000000000000532b3cd744b0d9d3396e868ed4db8ec7101c98117da8f4f'
	);
	console.log('blk = ', blk);
});
