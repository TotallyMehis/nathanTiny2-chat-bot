module.exports = {
  encodeMessage: function (type, obj) {
    return `${type} ${JSON.stringify(obj)}`
  },

  encodeSendMessage: function(msg) {
    return this.encodeMessage('MSG', { data: msg })
  },

  parseWebSocketMessage: function(data) {
    if (typeof data === 'undefined') {
      console.error('Undefined data!')
      return undefined
    }

    if (typeof data !== 'string') {
      if (typeof data !== 'object') {
        console.error('Data is not an object!')
        return undefined
      }

      data = data.toString()
    }

    const supportedMsgTypes = [
      // Dunno about these, just copied
      'PING',
      'PONG',
      'PRIVMSG',

      'ERR',

      'BROADCAST',

      'MUTE',
      'UNMUTE',
      'BAN',
      'UNBAN',

      'SUBONLY',

      'NAMES',

      'MSG',

      'JOIN',
      'QUIT'
    ]

    for (const type of supportedMsgTypes) {
      if (data.startsWith(type)) {
        let obj = undefined
        try {
          obj = JSON.parse(data.substring(type.length))
        } catch (e) {
          console.error('Failed to parse JSON from string!', data, e)
          return null
        }

        return { type, obj }
      }
    }

    console.error('Encountered unknown message!', data)
    return null
  }
}
