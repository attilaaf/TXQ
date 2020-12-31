const bitwork = require('../index');
const bit = new bitwork({ rpc: { user: 'root', pass: 'bitcoin' } });
bit.use('parse', 'bob');
bit.use('filter', (e) => {
	return (
		e.out[0] &&
		e.out[0].tape[1] &&
		e.out[0].tape[1].cell[0] &&
		e.out[0].tape[1].cell[0].s === '1LtyME6b5AnMopQrBPLk4FGN8UBuhxKqrn' &&
		e.out[0].tape[1].cell[1].b !== 'BQ=='
	);
});
bit.use('map', (e) => {
	try {
		return JSON.parse(e.out[0].tape[1].cell[2].s);
	} catch (er) {
		console.log(er);
		console.log('e.out = ', JSON.stringify(e.out, null, 2));
		process.exit();
	}
});
bit.on('ready', async () => {
	let headers = await bit.get('header', { from: 598000, to: 598005 });
	for (let i = 0; i < headers.length; i++) {
		console.time('block ' + headers[i].height);
		let blk = await bit.get('block', headers[i]);
		console.timeEnd('block ' + headers[i].height);
		console.log(JSON.stringify(blk, null, 2));
	}
});
