const bitwork = require('../index');
const bit = new bitwork({ rpc: { user: 'root', pass: 'bitcoin' } });
const fs = require('fs');
const es = require('event-stream');
bit.use('parse', 'bob');
bit.on('ready', async () => {
	//let blk = await bit.get("block", 598966)
	//let blk = await bit.get("block", 593195)
	let blk = await bit.get('block', 600597);
	console.log(blk.tx);
});
