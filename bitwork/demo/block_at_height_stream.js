const bitwork = require('../index');
const bit = new bitwork({ chain: 3, rpc: { user: 'root', pass: 'bitcoin' } });
const fs = require('fs');
const es = require('event-stream');
bit.use('parse', 'bob');
bit.on('ready', async () => {
	//let blk = await bit.get("block", 593965)
	let blk = await bit.get('block', 598966);

	console.log('start stream');
	var output = fs.createWriteStream('output');
	let counter = 0;
	console.time('Ha');
	let str = blk.tx();
	str
		.pipe(
			es.mapSync((data) => {
				counter++;
				if (counter % 1000 === 0) console.log(counter);
				return data;
			})
		)
		.pipe(es.stringify())
		.pipe(process.stdout);
	//.pipe(output)
	str.on('end', () => {
		console.timeEnd('Ha');
	});
	//console.log(blk)
});
