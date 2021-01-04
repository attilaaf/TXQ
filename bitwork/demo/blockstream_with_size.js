const bitwork = require('../index');
const bit = new bitwork({ buffer: 3, rpc: { user: 'root', pass: 'bitcoin' } });
const fs = require('fs');
const es = require('event-stream');
const JSONStream = require('JSONStream');
bit.use('parse', 'bob');
bit.on('ready', async () => {
	let blk = await bit.get('block', 593965);
	//let blk = await bit.get("block", 598966)
	console.log('start stream');
	console.time('Ha');
	let f = fs.createWriteStream('blk');
	blk
		.tx(100)
		.pipe(JSONStream.stringify())
		.pipe(f)
		.on('close', () => {
			console.log('close');
			console.timeEnd('Ha');
		});
	//blk.tx(1000).on("data", (data) => {
	//blk.tx().pipe(es.stringify()).pipe(process.stdout)
	/*
  blk.tx().on("data", (data) => {
//    console.log("chunk")
//    console.log('#data = ', data)
  //  fs.appendFile("blk", JSON.stringify(data), () => {
  //  })
  }).on("end", () => {
    console.log("end")
    console.timeEnd("Ha")
  })
  }).on("end", () => {
    console.log("end")
    console.timeEnd("Ha")
  })
  */
	/*
    items.push(data)
    counter++;
    if (items.length === 1000) {
      console.log(counter)
      fs.writeFile("" + counter, JSON.stringify(items), (err) => {
        if (err) throw err;
        console.log("saved")
      })
      items = [];
    }
    */
	/*
  f.on("close", () => {
    console.timeEnd("Ha")
  })
  */
	//console.log(blk)
});
