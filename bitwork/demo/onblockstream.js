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
		e.out[0].tape[1].cell[0].s === '19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut'
	);
});
bit.use('map', (e) => {
	try {
		return e.out[0].tape[1].cell[1].s;
	} catch (er) {
		console.log(er);
		process.exit();
	}
});
bit.on('block', (e) => {
	e.tx().pipe(es.stringify()).pipe(process.stdout);
});
