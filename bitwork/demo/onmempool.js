const bitwork = require('../index');
const BPU = require('bpu');
const bit = new bitwork({ rpc: { user: 'root', pass: 'bitcoin' } });
bit.use('parse', (r) => {
	return BPU.parse({
		tx: { r: r.toString() },
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
			{ token: { s: '|' }, include: 'l' },
			{ token: { op: 106 }, include: 'l' },
		],
	});
});
bit.on('mempool', (e) => {
	console.log('mempool =', JSON.stringify(e, null, 2));
});
