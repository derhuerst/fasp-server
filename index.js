'use strict'

const createReceiver = require('fasp-receiver')
const {EventEmitter} = require('events')
const debug = require('debug')('fasp-server')

const createQueue = require('./lib/queue')

const createServer = (opt, cb) => {
	if ('function' === typeof opt) {
		cb = opt
		opt = {}
	}

	const out = new EventEmitter()

	const receiver = createReceiver({
		version: 2,
		id: opt.id,
		name: opt.name,
		port: opt.port,
		announce: opt.announce
	}, (err, info) => {
		if (err) return cb(err)
		out.info = info
		receiver.on('error', err => out.emit('error', err))

		createQueue((err, queue) => {
			if (err) return cb(err)
			queue.on('error', err => out.emit('error', err))

			// receiver -> queue
			receiver.on('command', (cmd, args) => {
				debug('command ' + cmd + ' ' + args.join(', '))
				try {
					if (cmd === 'get-props') {
						const props = queue.getProps()
						for (let prop of Object.keys(props)) {
							sendProp(prop, props[prop])
						}
					} else if (cmd === 'play') {
						const [url] = args
						queue.play(url)
					} else if (cmd === 'queue') {
						const [url] = args
						queue.queue(url)
					} else if (cmd === 'next') {
						queue.next()
					} else if (cmd === 'previous') {
						queue.previous()
					} else if (cmd === 'remove') {
						const [idx] = args
						queue.remove(idx)
					} else if (cmd === 'stop') {
						queue.stop()
					} else if (cmd === 'resume') {
						queue.resume()
					} else if (cmd === 'pause') {
						queue.pause()
					} else if (cmd === 'seek') {
						const [pos, absolute, percent] = args
						queue.seek(pos, absolute, percent)
					} else if (cmd === 'set-volume') {
						const [volume] = args
						queue.setVolume(volume)
					}
				} catch (err) {
					console.error('error', err) // todo
				}
			})

			// queue -> receiver
			const sendProp = (prop, val) => {
				debug('prop ' + prop + ' ' + val)
				receiver.send('prop', [prop, val])
			}
			queue.on('prop', sendProp)

			process.once('beforeExit', () => queue.quit())

			cb(null, out)
		})
	})
}

module.exports = createServer
