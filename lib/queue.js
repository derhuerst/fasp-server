'use strict'

const {EventEmitter} = require('events')
const createPlayer = require('mpv-wrapper')
const pick = require('lodash.pick')
const throttle = require('lodash.throttle')

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
	metadata: {}
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
	'pause',
	'volume',
	'metadata'
]

const createQueue = (cb) => {
	const out = new EventEmitter()

	createPlayer({
		args: [
			'--no-config',
			'--no-video',
			// todo: --ytdl
			// todo: --gapless-audio ?
			'--volume=100',
			'--audio-client-name=' + pkg.name,
			'--user-agent=' + pkg.name
			// todo: more cache
		]
	}, (err, mpv) => {
		if (err) return cb(err)

		out.id = mpv.id
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

		// todo: handle errors

		// queue -> mpv

		out.play = url => mpv.loadfile(url, 'replace')
		out.queue = url => mpv.loadfile(url, 'append-play')
		out.next = () => mpv.playlistNext('force')
		out.previous = () => mpv.playlistPrev('force')
		out.remove = (idx) => {
			if ('number' !== typeof idx) return invalidArg()
			return mpv.playlistRemove(idx)
		}
		out.stop = () => mpv.stop()

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
			onProp('duration', defaultProps.duration)
			onProp('percent-pos', defaultProps['percent-pos'])
			onProp('time-pos', defaultProps['time-pos'])
			onProp('metadata', defaultProps.metadata)
		})

		cb(null, out)
	})
}

module.exports = createQueue
