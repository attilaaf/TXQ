const bitwork = require('../index');
const bit = new bitwork({
	chain: { path: process.cwd() + '/bitwork_chain' },
	rpc: { user: 'root', pass: 'bitcoin' },
});
const es = require('event-stream');
const processor = (blk, height) => {
	return new Promise((resolve, reject) => {
		console.time('block ' + height);
		let t = blk.tx();
		t.pipe(es.stringify()) //.pipe(process.stdout)
			//t.on("close", () => {
			//  console.timeEnd("block " + height)
			//  resolve();
			//})
			.on('end', () => {
				console.timeEnd('block ' + height);
				resolve();
			});
	});
};
bit.use('parse', 'bob');
bit.on('ready', async () => {
	try {
		console.log('DONE');
		console.time('all');
		let headers = await bit.get('header', { from: 598000, to: 598200 });
		for (let i = 0; i < headers.length; i++) {
			let blk = await bit.get('block', headers[i]);
			await processor(blk, headers[i].height);
		}
		await bit.invalidate({
			from: 598005,
			to: 598010,
		});

		console.timeEnd('all');
	} catch (e) {
		console.log('____', e);
		let header = await bit.info();
		console.log(header);
	}
});
