'use strict'

const createReceiver = require('fasp-receiver')
const {EventEmitter} = require('events')

const createQueue = require('./lib/queue')

const is = val => val !== null && val !== undefined

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

			// receiver -> queue
			receiver.on('command', (cmd, args) => {
				if (cmd === 'play') {
					const [url] = args
					if ('string' === typeof url && url) queue.play(url)
				} else if (cmd === 'queue') {
					const [url] = args
					if ('string' === typeof url && url) queue.queue(url)
				} else if (cmd === 'next') {
					queue.next()
				} else if (cmd === 'previous') {
					queue.previous()
				} else if (cmd === 'remove') {
					const [idx] = args
					if ('number' === typeof idx) queue.remove(idx)
				} else if (cmd === 'stop') {
					queue.stop()
				} else if (cmd === 'play-pause') {
					queue.playPause()
				} else if (cmd === 'seek') {
					const [pos, absolute, percent] = args
					if (is(pos)) queue.seek(pos, absolute, percent)
				} else if (cmd === 'set-volume') {
					const [volume] = args
					if ('number' === typeof volume) queue.setVolume(volume)
				}
			})

			// queue -> receiver
			queue.on('prop', (prop, val) => receiver.send('prop', [prop, val]))

			cb(null, out)
		})
	})
}

module.exports = createServer
