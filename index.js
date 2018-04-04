'use strict'

const createReceiver = require('fasp-audio-receiver')
const {EventEmitter} = require('events')

const createQueue = require('./lib/queue')

const createServer = (opt, cb) => {
	if ('function' === typeof opt) {
		cb = opt
		opt = {}
	}

	const queue = createQueue()
	const out = new EventEmitter()
	out.getInfo = queue.getInfo

	const receiver = createReceiver({
		id: opt.id,
		name: opt.name,
		port: opt.port,
		announce: opt.announce
	}, cb)
	receiver.on('error', (err) => {
		out.emit('error', err)
	})

	// receiver -> queue
	receiver.on('command', (cmd, args) => {
		if (cmd === 'play') {
			if ('string' === typeof args[0] && args[0]) queue.play(args[0])
		} else if (cmd === 'queue') {
			if ('string' === typeof args[0] && args[0]) queue.queue(args[0])
		} else if (cmd === 'next') {
			queue.next()
		} else if (cmd === 'previous') {
			queue.previous()
		} else if (cmd === 'play-pause') {
			queue.playPause()
		} else if (cmd === 'seek') {
			const pos = args[0]
			if ('string' === typeof pos) {
				if ((pos[0] === '+' || pos[0] === '-')) queue.seek(pos)
			} else if ('number' === typeof pos) queue.seek(pos)
		} else if (cmd === 'seek-percent') {
			if ('number' === typeof args[0]) queue.seekPercent(args[0])
		} else if (cmd === 'set-volume') {
			if ('number' === typeof args[0]) queue.setVolume(args[0])
		} else if (cmd === 'stop') {
			queue.stop()
		}
	})

	// queue -> receiver
	queue.on('info', info => receiver.sendStatus(info))

	return out
}

module.exports = createServer
