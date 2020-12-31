const bitwork = require('../index');
const bit = new bitwork({ rpc: { user: 'root', pass: 'bitcoin' } });
bit.use('parse', 'raw');
bit.on('mempool', (e) => {
	console.log(e);
});
