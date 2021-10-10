const ws = require('ws')
const fs = require('fs')

const dggUtil = require('./dggutil')
const NathanTinyApp = require('./app')
const util = require('./util')


/**
 * 
 * @returns {object|null}
 */
function readConfig() {
  let options = null
  try {
    const content = fs.readFileSync('.config.json')
    options = JSON.parse(content)

    if (typeof options.timeout !== 'number') {
      throw 'Parameter timeout was invalid or not found!'
    }

    if (typeof options.myname !== 'string') {
      throw 'Parameter myname was invalid or not found!'
    }
  } catch (e) {
    console.error('Failed to read config file!', e)
    process.exit(1)
  }

  return options
}

const myConfig = readConfig()


const options = NathanTinyApp.readConfig('.nathantiny.config.json')
if (!options) {
  process.exit(1)
}

const app = new NathanTinyApp(myConfig.myname, options)
app.printWelcome()




function createWSHeaders() {
  const headers = {}
  if (myConfig.sid) {
    headers['Cookie'] = `sid=${myConfig.sid}`
  } else if (myConfig.authtoken) {
    headers['Cookie'] = `authtoken=${myConfig.authtoken}`
  } else {
    console.error('Config file did not include sid or auth token!')
    process.exit(1)
  }

  util.debug('Websocket headers:', headers)

  return headers
}

//
//
//
console.log('Starting Websocket connection...')

const conn = new ws.WebSocket('wss://chat.destiny.gg/ws', {
  perMessageDeflate: false,
  headers: createWSHeaders(myConfig)
})

function heartbeat() {
  clearTimeout(this.pingTimeout)

  this.pingTimeout = setTimeout(() => {
    console.error('Ping timed out!')
    this.terminate()
  }, myConfig.timeout * 1000)
}

conn.on('open', function () {
  console.log('Connected!')
  heartbeat.bind(this)()
})

conn.on('close', function(closeCode, msg) {
  console.log('Connection was closed!', closeCode, msg)
})

conn.on('message', function(data) {

  const msg = dggUtil.parseWebSocketMessage(data)
  if (!msg) {
    console.error('Could not parse message!', msg, typeof data, data)
    return
  }


  const type = msg.type
  const obj = msg.obj

  switch (type) {
    case 'BROADCAST':
    case 'MUTE':
    case 'UNMUTE':
    case 'BAN':
    case 'UNBAN':
    case 'SUBONLY':
    case 'NAMES':
    case 'JOIN':
    case 'QUIT':
      break
    case 'PING': // Should never get here?
      console.log('Received ping. Sending pong.')
      conn.send(dggUtil.encodeMessage('PONG', obj))
      break
    case 'ERR':

      let quit = false

      switch (obj.description) {
        case 'banned':
          quit = true
          console.error('Bro... you are banned. RIP.', type, obj)
          break
        case 'needlogin':
          quit = true
          console.error('Need a login! Make sure you added your auth token correctly!')
          break
        default:
          console.error('Encountered unknown error!', type, obj)
      }

      conn.close()

      if (quit) {
        process.exit(1)
      }
      break
    case 'MSG':
      app.handleMessage(conn, obj)
      break
    default:
      console.log('Unhandled message type!', type, obj)
      break
  }
})

conn.on('ping', function(data) {
  //console.log('Received ping out of message event!')
  heartbeat.bind(this)()
})

conn.on('pong', function(data) {
  //console.log('Received pong out of message event')
})

conn.on('error', function(err) {
  console.error('Error occurred!', err)
})
