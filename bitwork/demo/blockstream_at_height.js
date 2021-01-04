const bitwork = require('../index');
const bit = new bitwork({ chain: { prune: 5 }, rpc: { user: 'root', pass: 'bitcoin' } });
const fs = require('fs');
const es = require('event-stream');
bit.use('parse', 'hex');
bit.on('ready', async () => {
	//let blk = await bit.get("block", 598966)
	let blk = await bit.get('block', 593195);
	blk
		.tx(100)
		.on('data', (d) => {
			console.log(d);
		})
		.on('end', () => {
			console.log(blk.tx);
		});
});
