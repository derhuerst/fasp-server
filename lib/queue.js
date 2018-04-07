'use strict'

const createPlayer = require('mplayer-wrapper')
const debounce = require('lodash.debounce')

const defaultInfo = {
	// todo: playing boolean
	filename: null,
	title: null,
	album: null,
	artist: null,
	length: null,
	progress: null,
	volume: null,
	playing: false
}

const createQueue = () => {
	const player = createPlayer()

	const info = Object.assign({}, defaultInfo)
	player.getInfo = () => info
	const emitInfo = debounce(() => {
		player.emit('info', info)
	}, 500, {trailing: true})

	player.on('pause', (paused) => {
		info.playing = !paused
		emitInfo()
	})
	player.on('filename', (f) => {
		info.filename = f
		emitInfo()
	})
	player.on('length', (l) => {
		info.length = l
		emitInfo()
	})
	player.on('time_pos', (p) => {
		info.progress = p
		emitInfo()
	})
	player.on('metadata', (meta) => {
		info.title = meta.Title || null
		info.album = meta.Album || null
		info.artist = meta.Artist || null
		info.year = meta.Year || null
		emitInfo()
	})
	player.on('volume', (v) => {
		info.volume = v
		emitInfo()
	})

	player.on('track-change', () => {
		player.getProps([
			'pause', 'filename', 'length', 'time_pos', 'metadata', 'volume'
		])
	})

	let lastTimePos = Date.now()
	player.on('time_pos', () => {
		lastTimePos = Date.now()
	})
	setInterval(() => {
		player.getProps(['time_pos'])

		// hack to detect that no song is being played anymore
		// todo: solve this properly
		if (info.playing && (Date.now() - lastTimePos) > 3000) {
			info.playing = false
			Object.assign(info, defaultInfo)
			emitInfo()
		}
	}, 2000)

	// todo: move this to mplayer-wrapper?
	const _playPause = player.playPause
	const _seek = player.seek
	const _seekPercent = player.seekPercent
	const _setVolume = player.setVolume
	const _stop = player.stop
	player.playPause = function () {
		_playPause.apply(player, arguments)
		player.getProps(['pause'])
	}
	player.seek = function (pos) {
		_seek.apply(player, arguments)
		player.getProps(['time_pos', 'percent_pos'])
	}
	player.seekPercent = function (pos) {
		_seekPercent.apply(player, arguments)
		player.getProps(['time_pos', 'percent_pos'])
	}
	player.setVolume = function (vol) {
		_setVolume.apply(player, arguments)
		player.getProps(['volume'])
	}
	player.stop = function (pos) {
		_stop.apply(player, arguments)
		// todo: this won't work, parse `ANS_ERROR=PROPERTY_UNAVAILABLE`
		player.getProps(['time_pos', 'percent_pos'])
	}

	return player
}

module.exports = createQueue
