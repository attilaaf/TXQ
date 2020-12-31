const bitwork = require('../index');
const bit = new bitwork({ buffer: 3, rpc: { user: 'root', pass: 'bitcoin' } });
const fs = require('fs');
const es = require('event-stream');
bit.use('parse', 'bob');
bit.on('ready', async () => {
	let blk = await bit.get('block', 593965);
	//let blk = await bit.get("block", 598966)

	console.log('start stream');
	let counter = 0;
	console.time('Ha');
	/*
  blk.tx.batch(1000).map((tx) => {
    counter++;
    console.log(counter * 1000)
    return JSON.stringify(tx)
  })
  .pipe(output)
  .on("close", () => {
    console.timeEnd("Ha")
  })
  */

	let items = [];
	blk.tx
		.on('data', (data) => {
			items.push(data);
			counter++;
			if (items.length === 1000) {
				console.log(counter);
				fs.writeFile('' + counter, JSON.stringify(items), (err) => {
					if (err) throw err;
					console.log('saved');
				});
				items = [];
			}
		})
		.on('close', () => {
			console.timeEnd('Ha');
		});
	//console.log(blk)
});
