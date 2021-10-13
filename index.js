const fs = require('fs')
const DestinyGGClient = require('destiny.gg-chat')

const NathanTinyAnalyzer = require('./analyzer')


let lastRecvMsg = ''
let lastSentMsg = ''
let lastSentMsgTime = 0
const options = ((configName) => {
  let options = null
  try {
    const content = fs.readFileSync(configName)
    options = JSON.parse(content)

    if (typeof options.pause !== 'number') {
      throw 'Parameter pause is invalid or does not exist!'
    }

    if (!options.searchfor) {
      throw 'Parameter searchfor is invalid or does not exist!'
    }

    if (!options.replywith) {
      throw 'Parameter replywith is invalid or does not exist!'
    }

    if (typeof options.maxsize !== 'number') {
      throw 'Parameter maxsize is invalid or does not exist!'
    }

    if (typeof options.myname !== 'string') {
      throw 'Parameter myname was invalid or not found!'
    }
  } catch (e) {
    console.error('Failed to read config file!', configName, e)
    return null
  }

  console.log(`My name: "${options.myname}"`)
  console.log(`Searching for: "${options.searchfor}"`)
  console.log(`Replying with: "${options.replywith}"`)
  console.log(`Pause time: ${options.pause}`)

  return options
})('.config.json')

const analyzer = new NathanTinyAnalyzer({
  searchFor: options.searchfor,
  replyWith: options.replywith,
  myName: options.myname,
  maxSize: options.maxsize
})

function updateLastRecv(nick, msg) {
  lastRecvNick = `${nick}`
  lastRecvMsg = `${msg}`
}

function shouldHandleMessage(nick, msg) {
  // Pls don't respond to urself
  if (nick === options.myname) {
    return false
  }

  // Combo
  if (msg === lastRecvMsg) {
    return false
  }

  // Within pause time
  if (lastSentMsgTime && options.pause > 0 && ((new Date().getTime() / 1000) - lastSentMsgTime) < options.pause) {
    return false
  }

  const pos = msg.indexOf(options.searchfor)
  if (pos === -1) {
    return false
  }

  return true
}


const client = new DestinyGGClient({
  sid: options.sid,
  authtoken: options.authtoken
})

client.on('message', function(nick, msg, features) {
  const featureTxt = (Array.isArray(features) && features.length) ? ('(' + features.join(', ') + ')') : ''
  console.log(`${nick}: ${msg}`, featureTxt)

  if (!shouldHandleMessage(nick, msg)) {
    updateLastRecv(nick, msg)
    return
  }

  console.log(`Trying to respond to: "${nick}: ${msg}"`)
  
  const response = analyzer.calculateResponse(nick, msg, features, nick === lastRecvNick)
  if (!response) {
    updateLastRecv(nick, response)
    return
  }

  if (lastSentMsg === response) {
    console.log('Cannot send the same message again!')
    return
  }

  console.log(`Sending message: "${response}"`)

  this.message(response)

  lastSentMsgTime = new Date().getTime() / 1000
  lastSentMsg = response
  updateLastRecv(nick, response)
})
