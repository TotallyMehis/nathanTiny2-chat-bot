const fs = require('fs')

const dggUtil = require('./dggutil')
const NathanTinyAnalyzer = require('./analyzer')


class NathanTinyApp {

  constructor(myName, options) {
    this.myName = myName
    this.options = options

    this.lastRecvNick = ''
    this.lastRecvMsg = ''
    this.lastSentMsgTime = 0
    this.lastSentMsg = ''

    this.analyzer = new NathanTinyAnalyzer({
      searchFor: this.options.searchfor,
      replyWith: this.options.replywith,
      myName: this.myName,
      maxSize: this.options.maxsize
    })
  }

  static readConfig(configName) {
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
    } catch (e) {
      console.error('Failed to read config file!', configName, e)
      return null
    }

    return options
  }

  printWelcome() {
    console.log(`My name: "${this.myName}"`)
    console.log(`Searching for: "${this.options.searchfor}"`)
    console.log(`Replying with: "${this.options.replywith}"`)
    console.log(`Pause time: ${this.options.pause}`)
  }

  shouldHandleMessage(msgObj) {
    // Pls don't respond to urself
    if (msgObj.nick === this.myName) {
      return false
    }

    // Combo
    if (msgObj.data === this.lastRecvMsg) {
      return false
    }

    // Within pause time
    if (this.lastSentMsgTime && this.options.pause > 0 && ((new Date().getTime() / 1000) - this.lastSentMsgTime) < this.options.pause) {
      return false
    }

    const pos = msgObj.data.indexOf(this.options.searchfor)
    if (pos === -1) {
      return false
    }

    return true
  }

  updateLastRecv(msgObj) {
    this.lastRecvNick = `${msgObj.nick}`
    this.lastRecvMsg = `${msgObj.data}`
  }

  handleMessage(conn, msgObj) {
    if (!this.shouldHandleMessage(msgObj)) {
      this.updateLastRecv(msgObj)
      return
    }

    console.log(`Trying to respond to: "${msgObj.nick}: ${msgObj.data}"`)
    
    const msg = this.analyzer.calculateMsg(msgObj, msgObj.nick === this.lastRecvNick)
    if (!msg) {
      this.updateLastRecv(msgObj)
      return
    }

    if (this.lastSentMsg === msg) {
      console.log('Cannot send the same message again!')
      return
    }

    console.log(`Sending message: "${msg}"`)

    conn.send(dggUtil.encodeSendMessage(msg))

    this.lastSentMsgTime = new Date().getTime() / 1000
    this.lastSentMsg = msg
    this.updateLastRecv(msgObj)
  }
}

module.exports = NathanTinyApp
