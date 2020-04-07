'use strict'

const {hostname} = require('os')
const createServer = require('.')

createServer({
	name: 'some-fasp-server',
	port: 12345,
	origins: ['localhost:12345', hostname() + '.local:12345']
}, (err, server) => {
	if (err) {
		console.error(err)
		process.exit(1)
	}
	server.on('error', console.error)

	const i = server.info
	console.info(`\
FASP server "${i.name}" (${i.id}) listening on port ${i.port}.`)
})
