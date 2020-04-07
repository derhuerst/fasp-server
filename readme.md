# fasp-server

**A server for the [Friendly Audio Streaming Protocol](https://github.com/derhuerst/friendly-audio-streaming-protocol).**

Use [`fasp-server-cli`](https://github.com/derhuerst/fasp-server-cli) if you want to run a server from the command line.

Because `fasp-server` is based on the wonderful [`mpv`](https://mpv.io/), it can play [audio from many sources](https://mpv.io/manual/stable/#protocols).

[![npm version](https://img.shields.io/npm/v/fasp-server.svg)](https://www.npmjs.com/package/fasp-server)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/fasp-server.svg)
[![chat with me on Gitter](https://img.shields.io/badge/chat%20with%20me-on%20gitter-512e92.svg)](https://gitter.im/derhuerst)
[![support me on Patreon](https://img.shields.io/badge/support%20me-on%20patreon-fa7664.svg)](https://patreon.com/derhuerst)


## Installing

Install [`mpv`](https://mpv.io/). Refer to [their installation page](https://mpv.io/installation/) for further details.

```shell
# macOS
brew install mpv
# Ubuntu or similar
sudo add-apt-repository ppa:mc3man/mpv-tests
sudo apt update
sudo apt install mpv
```

On many Linux systems, you also need the `dns_sd.h` headers for [mDNS](https://en.wikipedia.org/wiki/Multicast_DNS).

```js
# Ubuntu or similar
sudo apt install libavahi-compat-libdnssd-dev
```

Then, install `fasp-server`.

```shell
npm install fasp-server
```


## Usage

```js
const createServer = require('fasp-server')

const server = createServer((err, info) => {
	if (err) {
		console.error(err)
		process.exitCode = 1
	} else {
		console.info('port', info.port)
	}
})
```

Control the server programmatically using [`fasp-client`](https://github.com/derhuerst/fasp-client), or from the command line using [`fasp-client-cli`](https://github.com/derhuerst/fasp-client-cli).


## Contributing

If you have a question or have difficulties using `fasp-server`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, refer to [the issues page](https://github.com/derhuerst/fasp-server/issues).
