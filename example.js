'use strict'

const createServer = require('.')

createServer((err, server) => {
	if (err) {
		console.error(err)
		return process.exitCode = 1
	}

	const i = server.info
	console.info(`\
FASP server "${i.name}" (${i.id}) listening on port ${i.port}.`)
})
