'use strict'

const createPlayer = require('mplayer-wrapper')

const defaultInfo = {
	// todo: playing boolean
	filename: null,
	title: null,
	album: null,
	artist: null,
	length: null,
	progress: null,
	volume: null
}

const createQueue = () => {
	const player = createPlayer()
	const info = Object.assign({}, defaultInfo)
	player.getInfo = () => info

	player.on('filename', (f) => {
		info.filename = f
		player.emit('info', info) // todo: debounce
	})
	player.on('length', (l) => {
		info.length = l
		player.emit('info', info) // todo: debounce
	})
	player.on('time_pos', (p) => {
		info.progress = p
		player.emit('info', info) // todo: debounce
	})
	player.on('metadata', (meta) => {
		info.title = meta.Title || null
		info.album = meta.Album || null
		info.artist = meta.Artist || null
		info.year = meta.Year || null
		player.emit('info', info) // todo: debounce
	})
	player.on('volume', (v) => {
		info.volume = v
		player.emit('info', info) // todo: debounce
	})

	player.on('track-change', () => {
		player.getProps(['filename', 'length', 'time_pos', 'metadata', 'volume'])
	})

	let lastTimePos = Date.now(), stopped = true
	player.on('time_pos', () => {
		stopped = false
		lastTimePos = Date.now()
	})
	setInterval(() => {
		player.getProps(['time_pos'])

		// hack to detect that no song is being played anymore
		// todo: solve this properly
		if (!stopped && (Date.now() - lastTimePos) > 3000) {
			stopped = true
			Object.assign(info, defaultInfo)
			player.emit('info', info)
		}
	}, 2000)

	// todo: setter fns that also emit the new value

	return player
}

module.exports = createQueue
