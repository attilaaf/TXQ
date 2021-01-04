const bitwork = require('../index');
const es = require('event-stream');
const bit = new bitwork({
	chain: { prune: 10 },
	rpc: { user: 'root', pass: 'bitcoin' },
});
bit.use('parse', 'bob');
bit.use('filter', (e) => {
	return (
		e.out[0] &&
		e.out[0].tape[1] &&
		e.out[0].tape[1].cell[0] &&
		e.out[0].tape[1].cell[0].s === '1LtyME6b5AnMopQrBPLk4FGN8UBuhxKqrn'
	);
});
bit.use('map', (e) => {
	try {
		let s = e.out[0].tape[1].cell[2].s || e.out[0].tape[1].cell[2].ls;
		return JSON.parse(s);
	} catch (er) {
		console.log(e);
		console.log(JSON.stringify(e.out[0].tape[1].cell, null, 2));
		console.log(er);
		process.exit();
	}
});
bit.on('block', (e) => {
	console.log('########## BLOCK');
	e.tx().pipe(es.stringify()).pipe(process.stdout);
});
bit.on('mempool', (e) => {
	console.log(JSON.stringify(e, null, 2));
});
