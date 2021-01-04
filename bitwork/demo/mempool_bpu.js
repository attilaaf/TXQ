const bitwork = require('../index');
const bit = new bitwork({ rpc: { user: 'root', pass: 'bitcoin' } });
bit.use('parse', 'bpu', (r) => {
	return {
		tx: { r: r },
		transform: (o, c) => {
			if (c.buf && c.buf.byteLength > 512) {
				o.ls = o.s;
				o.lb = o.b;
				delete o.s;
				delete o.b;
			}
			return o;
		},
		split: [
			{ token: { s: '|' }, include: 'c' },
			{ token: { op: 106 }, include: 'l' },
		],
	};
});
bit.use('filter', (e) => {
	return e.out[0].tape[0].cell[0].ops === 'OP_RETURN';
});
/*
bit.use("map", (e) => {
  return e.out[0]
})
*/
bit.on('ready', async () => {
	let mempool = await bit.get('mempool');
	console.log('t=', JSON.stringify(mempool, null, 2));
});
