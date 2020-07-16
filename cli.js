#!/usr/bin/env node
const argv = require('minimist')(process.argv.slice(2))
const chalk = require('chalk')
const axios = require('axios')
const { sep, basename } = require('path')
const { inspect } = require('util')

const DEFAULTHOST = process.env.METADB_HOST || 'localhost'
const DEFAULTPORT = process.env.METADB_PORT || 2323
const REQUEST_TIMEOUT = 1000

function displayHelp () {
  console.log(`
    Usage:  ${chalk.yellow(basename(process.argv[1]))} command <options>
    Commands:
      start - start metadb
      stop - stop metadb
      index <directory> - index a directory
      ls - list files
      search - <search terms> - filename substring search
      peers - list peers
      settings - list settings
      connect <swarm> [<swarm>] - connect to one or more swarms.
                            If no swarm specified, connect to a new private swarm.
      disconnect <swarm> - disconnect from one or more swarms.
                           If no swarms specified, disconnect from all swarms.
      fileinfo <hash> - display metadata of a file given by hash
      request <hash(es)> - request one or more files by hash

    Global options:
      --port <port number> default: 2323
      --host <host> default: localhost
  `)
}

if (!argv._.length) {
  displayHelp()
  argv._ = ['settings']
  process.exit(0)
}

if (argv.help || argv._[0] === 'help') {
  displayHelp()
  process.exit(0)
}

if (argv._[0] === 'start') {
  const server = require('.')
  server(argv)
} else {
  const request = Request(argv)
  const commands = {
    index () {
      const dir = argv._[1]
      if (!dir) {
        console.log('Missing directory to index')
        process.exit(0)
      }
      request.post('/files/index', { dir })
        .then((res) => {
          console.log(`Beginning indexing of directory ${JSON.parse(res.config.data).dir}`)
        })
        .catch(handleError)
    },
    search () {
      const searchterm = argv._.slice(1).join(' ')
      request.post('/files/search', { searchterm }).then(displayFiles).catch(handleError)
    },
    subdir () {
      const subdir = argv._[1]
      const opts = { oneLevel: argv.oneLevel }
      request.post('/files/subdir', { subdir, opts }).then(displayFiles).catch(handleError)
    },
    wishlist () {
      request.get('/request').then(stringify).catch(handleError)
    },
    peers () {
      request.get('/peers').then(stringify).catch(handleError)
    },
    ls () {
      request.get('/files').then(displayFiles).catch(handleError)
    },
    stop () {
      request.post('/stop').then(() => {
        console.log('metadb has stopped.')
      }).catch(handleError)
    },
    request () {
      const files = argv._.slice(1)
      request.post('/request', { files }).then(stringify).catch(handleError)
    },
    connect () {
      const swarm = argv._.slice(1)
      request.post('/swarm', { swarm }).then(stringify).catch(handleError)
    },
    disconnect () {
      const swarm = argv._.slice(1)
      request.delete('/swarm', { swarm }).then(stringify).catch(handleError)
    },
    settings () {
      request.get('/settings').then(displaySettings).catch(handleError)
    },
    fileinfo () {
      const hash = argv._[1]
      if (!hash) {
        console.log(chalk.red('Missing hash argument'))
        process.exit(1)
      }
      request.get(`/files/${hash}`).then(stringify).catch(handleError)
    }
  }
  commands[argv._[0]]()
}

function Request (options = {}) {
  const host = options.host || DEFAULTHOST
  const port = options.port || DEFAULTPORT
  return axios.create({
    baseURL: `http://${host}:${port}/`,
    timeout: REQUEST_TIMEOUT,
    headers: { 'Content-type': 'application/json' }
  })
}

function handleError (err) {
  console.log(chalk.red(err.code === 'ECONNREFUSED'
    ? 'Connection refused. Is metadb running?'
    : err.response.data.error
  ))
  // TODO: pass the error code
  process.exit(1)
}

function stringify (response) {
  // console.log(JSON.stringify(response, null, 4))
  console.log(inspect(response.data))
}

function displayPath (filePath) {
  if (Array.isArray(filePath)) return filePath.map(displayPath)
  const arr = filePath.split(sep)

  return arr.map((comp, i) => {
    if (i + 1 === arr.length) return chalk.green(comp)
    return `${chalk.blue(comp)}${chalk.grey(sep)}`
  }).join('')
}

function displayFiles (res) {
  res.data.forEach((f) => {
    if (f.dir) return console.log(chalk.blue(f.dir))
    console.log(displayPath(f.filename), chalk.red(readableBytes(f.size)))
  })
}

function displaySettings ({ data }) {
  console.log(`${data.filesInDb} files in db, ${readableBytes(data.bytesInDb)}, ${data.peers.length} known peers.`)
  const connectedSwarms = Object.keys(data.swarms).filter(s => data.swarms[s])
  console.log(connectedSwarms.length ? `Connected swarms: ${chalk.yellow(connectedSwarms)}` : 'Not connected.')
  console.log(`Download path: ${chalk.yellow(data.downloadPath)}`)
  console.log(data)
}

function readableBytes (bytes) {
  if (bytes < 1) return 0 + ' B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  return (bytes / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + sizes[i]
}
