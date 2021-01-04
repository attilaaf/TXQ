const bitwork = require('../index');
const bit = new bitwork({ rpc: { user: 'root', pass: 'bitcoin' } });
bit.use('parse', 'bob');
const weather = (b) => {
	bit.use('filter', (e) => {
		return (
			e.out[0] &&
			e.out[0].tape[1] &&
			e.out[0].tape[1].cell[0] &&
			e.out[0].tape[1].cell[0].s === '1LtyME6b5AnMopQrBPLk4FGN8UBuhxKqrn'
		);
	});
	bit.use('map', (e) => {
		console.log('map', JSON.stringify(e, null, 2));
		try {
			return JSON.parse(e.out[0].tape[1].cell[2].s);
		} catch (er) {
			console.log(er);
			process.exit();
		}
	});
};
const B = (b) => {
	bit.use('filter', (e) => {
		return (
			e.out[0] &&
			e.out[0].tape[1] &&
			e.out[0].tape[1].cell[0] &&
			e.out[0].tape[1].cell[0].s === '19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut'
		);
	});
	bit.use('map', (e) => {
		console.log('map', JSON.stringify(e, null, 2));
		try {
			return JSON.parse(e.out[0].tape[1].cell[1].s);
		} catch (er) {
			console.log(er);
			process.exit();
		}
	});
};
weather(bit);
//B(bit)
bit.on('ready', async () => {
	bit.on('mempool', (e) => {
		console.log(e);
		console.log('t=', JSON.stringify(e, null, 2));
	});
});
