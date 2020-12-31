const bitwork = require('../index');
const bit = new bitwork({ buffer: 3, rpc: { user: 'root', pass: 'bitcoin' } });
const fs = require('fs');
const es = require('event-stream');
bit.use('parse', 'bob');
bit.on('ready', async () => {
	let blk = await bit.get('block', 593965);
	//let blk = await bit.get("block", 598966)
	console.log('start stream');
	console.time('Ha');
	let f = fs.createWriteStream('blk');
	blk
		.tx()
		.pipe(es.stringify())
		.pipe(f)
		.on('close', () => {
			console.log('close');
			console.timeEnd('Ha');
		});
});
