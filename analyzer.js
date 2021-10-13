const { registerFont, createCanvas } = require('canvas')
const fs = require('fs')

const Util = require('./util')

registerFont('data/Roboto-Regular.ttf', { family: 'Roboto', weight: '400' })
registerFont('data/Roboto-Medium.ttf', { family: 'Roboto', weight: '500' })
registerFont('data/Roboto-Bold.ttf', { family: 'Roboto', weight: '700' })

const flairSizes = JSON.parse(fs.readFileSync('data/flairs.json'))
const ignoreFeatures = JSON.parse(fs.readFileSync('data/ignore-features.json'))
const emoteSizes = JSON.parse(fs.readFileSync('data/emote-sizes.json'))
//const charSizesNormal = JSON.parse(fs.readFileSync('data/char-size-normal.json'))
//const charSizesBold = JSON.parse(fs.readFileSync('data/char-size-bold.json'))

const DEFAULT_PIXEL_SIZE = 13

const CANVAS_WIDTH = 300
const CANVAS_HEIGHT = 150

const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT, 'svg')
const context = canvas.getContext('2d')




class NathanTinyAnalyzer {
  /**
   * 
   * @param {object} options 
   */
  constructor(options = {}) {
    this.replyWith = options.replyWith
    this.searchFor = options.searchFor
    this.myName = options.myName
    this.maxSize = 0

    if (!this.myName) {
      throw 'Analyzer Parameter myName was empty!'
    }

    if (!this.replyWith || !(this.replyWith in emoteSizes)) {
      throw 'Analyzer parameter replyWith was empty or invalid!'
    }

    if (!this.searchFor || !(this.searchFor in emoteSizes)) {
      throw 'Analyzer parameter searchFor was empty or invalid!'
    }
  }

  /**
   * 
   * @param {string} txt 
   * @param {string} emoteName 
   * @param {number} offset 
   * @returns {number}
   */
  static findEmote(txt, emoteName, offset = 0) {
    let pos = txt.indexOf(emoteName, offset)
    if (pos === -1) {
      return -1
    }
  
    if (pos !== 0 && txt[pos - 1] !== ' ') {
      //Util.debug('Emote does not start with a whitespace!')
      return NathanTinyAnalyzer.findEmote(txt, emoteName, pos + emoteName.length)
    }
  
    const nextCharPos = pos + emoteName.length
    if (txt.length > nextCharPos && txt[nextCharPos] !== ' ') {
      //Util.debug('Emote does not end with a whitespace!')
      return NathanTinyAnalyzer.findEmote(txt, emoteName, pos + emoteName.length)
    }
  
    return pos
  }

  /**
   * 
   * @param {string} txt 
   * @param {boolean} bold 
   * @returns {number}
   */
  static calcTextSize(txt, bold = false) {
    //
    // This table method didn't work. Presumably because of kerning.
    //
    // const table = bold ? charSizesBold : charSizesNormal
  
    // let txt = _txt
    // let size = 0
    // for (let i = txt.length - 1; i >= 0; i--) {
    //   const char = txt[i]
    //   if (char in table) {
    //     size += table[char]
  
    //     txt = txt.substring(0, i)
    //   } else {
    //     console.error('Character', char, 'not found in size table!')
    //   }
    // }
  
    // if (!txt.length) {
    //   return size
    // } else {
    //   Util.debug('Using canvas to figure out the remaining text length...')
    // }
    
  
    // font weight 500, ie. medium
    // font weight 400, ie. regular
    let weight = bold ? '500' : '400'
    context.font = `normal normal ${weight} ${DEFAULT_PIXEL_SIZE}px Roboto`
    const measureRes = context.measureText(txt)
  
    //Util.debug('Measure text:', measureRes)
  
    // NOTE: width-property seems to return an integer only
    //return measureRes.width
  
    const measuredWidth = (measureRes.actualBoundingBoxRight - measureRes.actualBoundingBoxLeft)
    return measuredWidth
  }

  /**
   * 
   * @param {string} nick 
   * @returns {number}
   */
  static calcNickSize(nick) {
    // Nick + padding-left .3em
    return NathanTinyAnalyzer.calcTextSize(nick, true) + DEFAULT_PIXEL_SIZE * 0.3
  }
  
  static getUnderscoreSize() {
    switch (DEFAULT_PIXEL_SIZE) {
      case 14: return 6.316666603088379
      case 13: return 5.866666793823242
      default: return 7.2166666984558105
    }
    //return calcTextSize('_', false)
  }
  
  static getPrefixSize() {
    const spaceSize = NathanTinyAnalyzer.getSpaceSize()
    switch (DEFAULT_PIXEL_SIZE) {
      case 14: return spaceSize + 3.383333444595337
      case 13: return spaceSize + 3.1500000953674316
      default: return spaceSize + 3.883333444595337
    }

    //return calcTextSize(': ', false)
  }

  static getRepeatPrefixSize() {
    const spaceSize = NathanTinyAnalyzer.getSpaceSize()
    switch (DEFAULT_PIXEL_SIZE) {
      case 14: return spaceSize + 7.316666603088379
      case 13: return spaceSize + 6.800000190734863
      default: return spaceSize + 8.366666793823242
    }

    //return calcTextSize('> ', false)
  }
  
  static getSpaceSize() {
    switch (DEFAULT_PIXEL_SIZE) {
      case 14: return 3.4666666984558105
      case 13: return 3.2166666984558105
      default: return 3.9666666984558105
    }
    //return calcTextSize(' ', false)
  }
  
  static getDotSize() {
    return 3.683333396911621
    //return calcTextSize('.', false)
  }

  /**
   * 
   * @param {string} nick 
   * @param {string} fullTxt 
   * @param {Array} features 
   * @param {boolean} isRepeatMsg 
   * @returns {number|undefined}
   */
  calculateTargetMsgWidth(nick, fullTxt, features = [], isRepeatMsg = false) {

    const searchFor = this.searchFor

    if (isRepeatMsg) {
      Util.debug('This is a repeat message!')
    }
    
    const pos = NathanTinyAnalyzer.findEmote(fullTxt, searchFor)
    if (pos === -1) {
      return undefined
    }
    
    const txt = fullTxt.substring(0, pos)
    Util.debug('Text until "' + searchFor + '": "' + txt + '"')
    
    
    //
    // Separate into "glyphs" or "tokens"
    // Whitespaces don't affect kerneling, etc. Always same size.
    //
    const tokens = txt.split(' ')
    
    let totalEmotesSize = 0
    let txtWithoutEmotes = []
    for (const token of tokens) {
      if (!token.length) {
        continue
      }
    
      if (token in emoteSizes) {
        if (emoteSizes[token] <= 0) {
          console.error('Found unsupported emote "' + token + '"!')
          return undefined
        }
    
        Util.debug('Found emote "' + token + '"!', 'Adding', emoteSizes[token], 'pixels!')
        totalEmotesSize += emoteSizes[token]

        txtWithoutEmotes.push(' ')
      } else {
        txtWithoutEmotes.push(token)
        txtWithoutEmotes.push(' ')
      }
    }
    
    //Util.debug('Total emotes size:', totalEmotesSize)

    
    //
    // Flairs
    //
    let flairsSize = 0
    if (features && features.length > 0) {
      for (const feature of features) {
        if (feature in flairSizes) {
          if (flairSizes[feature] < 0) {
            console.error('Unsupported flair "' + feature + '"!')
            return undefined
          }

          flairsSize += flairSizes[feature]

          // Add margin-left: .2em for every flair
          flairsSize += DEFAULT_PIXEL_SIZE * 0.2
        } else if (!ignoreFeatures.includes(feature)) {
          console.error('Unknown feature "' + feature + '"!')
          return undefined
        }
      }
    }

    if (flairsSize > 0) {
      // If there's a flair, space is added before name
      flairsSize += NathanTinyAnalyzer.getSpaceSize()
    }
    
    Util.debug('Flairs total size:', flairsSize)
    
    //
    // Nick
    //
    let nickSize = NathanTinyAnalyzer.calcNickSize(nick)

    Util.debug('Nick "' + nick + '" size:', nickSize)
    
    //
    // Prefix
    //
    const prefixSize = NathanTinyAnalyzer.getPrefixSize()
    const repeatPrefixSize = NathanTinyAnalyzer.getRepeatPrefixSize()
    // if (isRepeatMsg) {
    //   Util.debug('Repeat prefix "> " size:', repeatPrefixSize)
    // } else {
    //   Util.debug('Prefix ": " size:', prefixSize)
    // }
    
    //
    // Text
    //
    Util.debug('Text without emotes: "' + txtWithoutEmotes.join('') + '"')

    let totalTextSize = 0
    for (const txt of txtWithoutEmotes) {
      let txtSize = 0

      if (txt === '_') {
        txtSize = NathanTinyAnalyzer.getUnderscoreSize()
      } else if (txt === ' ') {
        txtSize = NathanTinyAnalyzer.getSpaceSize()
      } else if (txt === '.') {
        txtSize = NathanTinyAnalyzer.getDotSize()
      } else {
        txtSize = NathanTinyAnalyzer.calcTextSize(txt, false)
      }
      
      totalTextSize += txtSize
    }

    //
    // And finally try to center it to the target emote
    //
    const halfEmoteSize = emoteSizes[searchFor] / 2
    Util.debug(searchFor, 'size :', emoteSizes[searchFor])

    if (isRepeatMsg) {
      return repeatPrefixSize + totalEmotesSize + totalTextSize + halfEmoteSize
    } else {
      return flairsSize + nickSize + prefixSize + totalEmotesSize + totalTextSize + halfEmoteSize
    }
  }

  /**
   * 
   * @param {number} targetSize 
   * @returns {string|null}
   */
  createMsgToSize(targetSize) {
    //Util.debug('Target size:', targetSize)

    const underscoreSize = NathanTinyAnalyzer.getUnderscoreSize()
    //Util.debug('Underscore size:', underscoreSize)

    const spaceSize = NathanTinyAnalyzer.getSpaceSize()
    //Util.debug('Space size:', spaceSize)

    const dotSize = NathanTinyAnalyzer.getDotSize()
    //Util.debug('Dot size:', dotSize)

    const myNameSize = NathanTinyAnalyzer.calcNickSize(this.myName)
    //Util.debug('My name (' + this.myName + ') size:', myNameSize)

    const coveredArea = myNameSize + NathanTinyAnalyzer.getPrefixSize() + (emoteSizes[this.replyWith] / 2)
    //Util.debug('Already covered size:', coveredArea)

    const sizeDif = targetSize - coveredArea
    if (sizeDif < -dotSize) { // More than a dot size is noticeable.
      Util.debug('Cannot reach', sizeDif)
      return null
    }

    Util.debug('Must cover', sizeDif, 'pixels!')

    
    let add = ''

    const paddingSize = sizeDif - spaceSize
    if (paddingSize >= 0) {
      const divByUnderscores = Math.max(0, (paddingSize / underscoreSize))

      Util.debug('How many underscores to get there:', divByUnderscores)

      if (divByUnderscores > 0) {
        let numWholeUnderscores = Math.floor(divByUnderscores)
        const left = divByUnderscores - numWholeUnderscores
        let smallPadding = ''
        if (left >= 0.9) {
          numWholeUnderscores++
        } else if (left >= (dotSize / underscoreSize)) {
          smallPadding = '.'
        } else {}

        add = '_'.repeat(numWholeUnderscores) + smallPadding + ' '
      }
    }

    return add + this.replyWith
  }

  /**
   * 
   * @param {string} nick 
   * @param {string} msg 
   * @param {Array} features 
   * @param {boolean} isRepeatMsg 
   * @returns {string|null}
   */
  calculateResponse(nick, msg, features = [], isRepeatMsg = false) {
    const targetSize = this.calculateTargetMsgWidth(nick, msg, features, isRepeatMsg)
    if (targetSize === undefined) {
      return null
    }

    if (this.maxSize && targetSize > this.maxSize) {
      Util.debug('Size ', targetSize, 'went over the maximum of', this.maxSize)
      return null
    }

    const response = this.createMsgToSize(targetSize)
    if (!response) {
      Util.debug('Cannot respond to', nick)
    }

    return response
  }
}

module.exports = NathanTinyAnalyzer
