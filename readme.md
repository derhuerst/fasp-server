# fasp-server

**A server for the *Friendly Audio Streaming Protocol*.**

[![npm version](https://img.shields.io/npm/v/fasp-server.svg)](https://www.npmjs.com/package/fasp-server)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/fasp-server.svg)
[![chat with me on Gitter](https://img.shields.io/badge/chat%20with%20me-on%20gitter-512e92.svg)](https://gitter.im/derhuerst)
[![support me on Patreon](https://img.shields.io/badge/support%20me-on%20patreon-fa7664.svg)](https://patreon.com/derhuerst)


## Installing

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

Control the server using [`fasp-client`](https://github.com/derhuerst/fasp-client).


## Contributing

If you have a question or have difficulties using `fasp-server`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, refer to [the issues page](https://github.com/derhuerst/fasp-server/issues).
