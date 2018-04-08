'use strict'

const createServer = require('.')

createServer((err, server) => {
	if (err) {
		console.error(err)
		process.exit(1)
	}
	server.on('error', console.error)

	const i = server.info
	console.info(`\
FASP server "${i.name}" (${i.id}) listening on port ${i.port}.`)
})
