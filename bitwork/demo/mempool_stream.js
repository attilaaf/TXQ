const bitwork = require('../index');
const es = require('event-stream');
const fs = require('fs');
const bit = new bitwork({
	chain: { prune: 10 },
	rpc: { user: 'root', pass: 'bitcoin' },
});
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
	console.time('Ha');
	let mempool = await bit.get('mempool');
	let fileStream = fs.createWriteStream('m.json');
	mempool
		.tx()
		.pipe(es.stringify())
		.pipe(process.stdout)
		.on('close', () => {
			console.timeEnd('Ha');
		});
	//console.log("t=", JSON.stringify(mempool, null, 2))
});
