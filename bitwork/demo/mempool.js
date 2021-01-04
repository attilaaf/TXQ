const bitwork = require('../index');
const es = require('event-stream');
const fs = require('fs');
const bit = new bitwork({ rpc: { user: 'root', pass: 'bitcoin' } });
//bit.use("processor", "raw")
//bit.use("processor", "txo")
bit.use('parse', 'bob');
bit.use('filter', (e) => {
	return e.out[0].tape[0].cell[0].ops !== 'OP_RETURN';
});
bit.use('map', (e) => {
	return e.out[0];
});
bit.on('ready', async () => {
	let mempool = await bit.get('mempool');
	console.log('t=', JSON.stringify(mempool, null, 2));
});
