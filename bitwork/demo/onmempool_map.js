const bitwork = require('../index');
const bit = new bitwork({ rpc: { user: 'root', pass: 'bitcoin' } });
bit.use('parse', 'bob');
const weather = (b) => {
	bit.use('map', (e) => {
		try {
			return JSON.parse(e.out[0].tape[1].cell[2].s);
		} catch (er) {
			console.log(er);
			process.exit();
		}
	});
};
const B = (b) => {
	bit.use('map', (e) => {
		try {
			return e.out[0].tape[1].cell[1].s;
		} catch (er) {
			console.log(er);
			process.exit();
		}
	});
};
//weather(bit)
B(bit);
bit.on('ready', async () => {
	bit.on('mempool', (e) => {
		console.log(e);
	});
});
