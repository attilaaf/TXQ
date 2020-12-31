const bitwork = require('../index');
const bit = new bitwork({ rpc: { user: 'root', pass: 'bitcoin' } });
bit.use('parse', 'txo');
bit.on('ready', async () => {
	//let headers = await bit.get("header", { from: 598000, to: 598005 })
	try {
		let headers = await bit.get('header', { from: 598777 });
		console.log('headers = ', headers);
		for (let i = 0; i < headers.length; i++) {
			console.time('block ' + headers[i].height);
			let blk = await bit.get('block', headers[i]);
			console.timeEnd('block ' + headers[i].height);
			console.log(JSON.stringify(blk, null, 2));
		}
	} catch (e) {
		console.log('____', e);
		let header = await bit.info();
		console.log(header);
	}
});
