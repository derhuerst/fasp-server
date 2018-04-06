'use strict'

const createServer = require('.')

const server = createServer((err, info) => {
	if (err) {
		console.error(err)
		return process.exitCode = 1
	}

	console.info(`\
FASP server "${info.name}" (${info.id}) listening on port ${info.port}.`)
})
