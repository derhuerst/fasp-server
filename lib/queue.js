'use strict'

const {EventEmitter} = require('events')
const {randomBytes} = require('crypto')
const {join} = require('path')
const {tmpdir} = require('os')
const {Socket} = require('net')
const {spawn} = require('child_process')
const escape = require('js-string-escape')
const {MPVClient} = require('mpv-ipc')

const pkg = require('../package.json')

const invalidArg = () => Promise.reject(new Error('invalid arg'))

const createQueue = (cb) => {
	const id = randomBytes(10).toString('hex')
	const socketPath = join(tmpdir(), 'mpv-' + id)
	// todo: handle connect error
	const socket = new Socket(socketPath)
	socket.once('connect', () => {
		const proc = spawn('mpv', [
			'--idle=yes',
			'--no-config',
			'--no-video',
			// todo: --ytdl
			// todo: --gapless-audio ?
			'--volume=100',
			`--input-ipc-server='${escape(socketPath)}'`,
			'--audio-client-name=' + pkg.name,
			'--user-agent=' + pkg.name
		])
		// todo: handle spawn error

		const out = new EventEmitter()
		out.id = id
		const mpv = new MPVClient(socket)

		// mpv -> queue

		const observeProp = (prop) => {
			mpv.getProperty(prop)
			.then((val) => {
				out.emit(prop, val)
				out.emit('prop', prop, val)
			})
			.catch((err) => out.emit('error', err))

			mpv.observeProperty(prop, (val) => {
				out.emit(prop, val)
				out.emit('prop', prop, val)
			})
		}

		for (let prop of [
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
			'metadata', // todo: invidual fields
		]) observeProp(prop)

		// todo: events
		// todo: handle errors

		// queue -> mpv

		out.play = url => mpv.loadfile(url, 'replace')
		out.queue = url => mpv.loadfile(url, 'append-play')
		out.next = () => mpv.playlistNext('force')
		out.previous = () => mpv.playlistPrev('force')
		out.remove = (idx) => {
			if ('number' !== typeof val) return invalidArg()
			return mpv.playlistremove(idx)
		}
		out.stop = () => mpv.stop()

		out.play = () => mpv.play()
		out.pause = () => mpv.pause()
		out.seek = (val, absolute, percent) => {
			const mode = absolute
				? (percent ? 'absolute-percent' : 'absolute')
				: (percent ? 'relative-percent' : 'relative')
			if ('number' !== typeof val) return invalidArg()
			return mpv.seek(val, mode)
		}

		// todo: track-change

		cb(null, out)
	})
}

module.exports = createQueue
