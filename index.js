'use strict'

const createReceiver = require('fasp-receiver')
const {EventEmitter} = require('events')
const debug = require('debug')('fasp-server')
const parseUrl = require('parseurl')
const send = require('send')

const createQueue = require('./lib/queue')

const defaults = {
	headless: false,
	artwork: true
}

const createServer = (opt, cb) => {
	if ('function' === typeof opt) {
		cb = opt
		opt = {}
	}
	opt = Object.assign({}, defaults, opt)

	const out = new EventEmitter()

	const receiver = createReceiver({
		version: 2,
		id: opt.id,
		name: opt.name,
		port: opt.port,
		announce: opt.announce,
		origins: opt.origins
	}, (err, info, _, server) => {
		if (err) return cb(err)
		out.info = info
		receiver.on('error', err => out.emit('error', err))

		createQueue({
			headless: opt.headless,
			artwork: opt.artwork
		}, (err, queue) => {
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

			if (opt.artwork) {
				// todo: respect CORS?
				server.on('request', (req, res) => {
					const url = parseUrl(req)
					if (url.pathname !== '/artwork.jpg') return null
					send(req, queue.artworkFilename, {
						index: false,
						maxAge: 60 * 60 * 1000,
						root: queue.artworkDir
					})
					.pipe(res)
				})
			}

			process.once('beforeExit', () => queue.quit())

			cb(null, out)
		})
	})
}

module.exports = createServer
