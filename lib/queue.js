'use strict'

const {EventEmitter} = require('events')
const {randomBytes} = require('crypto')
const createPlayer = require('mpv-wrapper')
const pick = require('lodash.pick')
const throttle = require('lodash.throttle')
const {tmpdir} = require('os')
const {basename} = require('path')

const pkg = require('../package.json')

const invalidArg = () => Promise.reject(new Error('invalid arg'))

const whitelistedMetadata = [
	'title', 'artist', 'track', 'album', 'disc', 'album_artist'
]

const defaultProps = {
	filename: null,
	path: null,
	'file-format': null,
	duration: null,
	'percent-pos': null,
	'time-pos': null,
	pause: null,
	volume: null,
	metadata: {},
	artwork: null,
	queue: []
}
const observedProps = [
	// todo: seeking, speed, partially-seekable, track-list, playlist
	// todo: audio-bitrate, audio-samplerate, audio-channels, audio-format
	'filename',
	'path',
	'file-format',
	'duration',
	'percent-pos',
	'time-pos',
	'pause', // todo [breaking]: rename to paused
	'volume',
	'metadata'
]

const createQueue = (opt, cb) => {
	const out = new EventEmitter()

	const id = out.id = randomBytes(10).toString('hex')
	const artworkDir = tmpdir()
	const artworkFilename = 'fasp-server-' + id
	const args = [
		'--no-config',
		// todo: --ytdl
		// todo: --gapless-audio ?
		// todo: more cache
		'--volume=100',
		'--audio-client-name=' + pkg.name,
		'--user-agent=' + pkg.name
	]
	if (opt.headless) {
		args.push('--no-video')
	} else if (opt.artwork) {
		args.push(
			'--screenshot-directory=' + artworkDir,
			'--screenshot-template=' + artworkFilename,
			'--screenshot-format=jpg'
		)
	}

	createPlayer({id, args}, (err, mpv) => {
		if (err) return cb(err)

		out.artworkDir = artworkDir
		out.artworkFilename = artworkFilename + '.jpg'
		const props = Object.assign({}, defaultProps)
		out.getProps = () => props

		// mpv -> queue

		const onProp = (prop) => (val) => {
			if (prop === 'metadata') val = pick(val, whitelistedMetadata)
			props[prop] = val
			out.emit('prop', prop, val)
		}

		const observeProp = (prop) => {
			const onVal = throttle(onProp(prop), 2000, {leading: true})
			mpv.observeProperty(prop, onVal)
		}
		const getProp = (prop) => {
			mpv.getProperty(prop)
			.then(onProp(prop))
			.catch(err => out.emit('error', err))
		}

		for (let prop of observedProps) observeProp(prop)
		for (let prop of ['pause', 'volume']) getProp(prop)

		// export artwork & queue

		const queryQueue = () => {
			mpv.getProperty('playlist/count')
			.then((count) => {
				const tasks = []
				for (let i = 0; i < count; i++) {
					// todo: playlist/${i}/title ?
					tasks.push(mpv.getProperty(`playlist/${i}/filename`))
				}
				return Promise.all(tasks)
			})
			.then((queue) => {
				for (let i = 0; i < queue.length; i++) {
					queue[i] = decodeURIComponent(basename(queue[i]))
				}
				// todo: make this a separate command?
				onProp('queue')(queue)
			})
			.catch(console.error) // todo: handle errors
		}

		let artworkI = 0
		mpv.onFileLoaded(() => {
			mpv.screenshot()
			.then(() => {
				// todo: full URL instead of a file name
				const url = '/artwork.jpg?' + artworkI++ // cache busting
				onProp('artwork')(url)
			})
			.catch(() => {}) // screenshot errors can be swallowed

			setTimeout(queryQueue, 500)
		})

		// todo: handle errors

		// queue -> mpv

		out.play = url => mpv.loadfile(url, 'replace')
		out.queue = (url) => {
			return mpv.loadfile(url, 'append-play')
			.then((res) => {
				queryQueue()
				return res
			})
		}
		out.next = () => mpv.playlistNext('force')
		out.previous = () => mpv.playlistPrev('force')
		out.remove = (idx) => {
			if ('number' !== typeof idx) return invalidArg()
			return mpv.playlistRemove(idx)
		}
		out.stop = () => mpv.stop()
		out.quit = () => mpv.quit()

		out.resume = () => mpv.setPause(false)
		out.pause = () => mpv.setPause(true)
		out.seek = (pos, absolute, percent) => {
			const mode = absolute
				? (percent ? 'absolute-percent' : 'absolute')
				: (percent ? 'relative-percent' : 'relative')
			if ('number' !== typeof pos) return invalidArg()
			return mpv.seek(pos, mode)
		}
		out.setVolume = (volume) => {
			if ('number' !== typeof volume) return invalidArg()
			return mpv.setVolume(volume)
		}

		mpv.onIdle(() => {
			onProp('filename', defaultProps.filename)
			onProp('path', defaultProps.path)
			onProp('file-format', defaultProps['file-format'])
			onProp('duration', defaultProps.duration)
			onProp('percent-pos', defaultProps['percent-pos'])
			onProp('time-pos', defaultProps['time-pos'])
			onProp('pause', defaultProps.pause)
			onProp('metadata', defaultProps.metadata)
			onProp('artwork', defaultProps.artwork)
		})

		cb(null, out)
	})
}

module.exports = createQueue
