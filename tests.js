const NathanTinyAnalyzer = require('./analyzer')

const options = {
  myName: '_nathanTiny2',
  searchFor: 'nathanTiny1',
  replyWith: 'nathanTiny2'
}

const analyzer = new NathanTinyAnalyzer(options)


function test(obj, repeat = false) {
  const msg = analyzer.calculateMsg(obj, repeat)
  if (!msg) {
    console.log('------------')
    console.log(`${obj.nick}: ${obj.data}`)
    console.log('Cannot respond!')
    console.log('------------')
    return
  }

  console.log('------------')
  console.log(`${obj.nick}: ${obj.data}`)
  console.log('Respond as ' + options.myName + ': "' + msg + '"')
  console.log('------------')
}




test({ nick: 'Nick', data: 'nathanTiny1_nathanTiny1nathanTiny1 REAL ONE -> nathanTiny1 nathanTiny1' })
test({ nick: '_nathanTiny2', data: 'nathanTiny1' })
test({ nick: 'dggL', data: 'some text nathanTiny1 dggL' })
test({ nick: 'Destiny', data: 'FUCK OFF THIS IS A LONG TEXT nathanTiny1' })
test({ nick: 'tng69', data: 'you\'re DUMB lmao, you cannot get THIS one nathanTiny1' })
test({ nick: 'SOY_SPAMMER_LMAO', data: 'SOY I spam nathanTiny2 SOY nathanTiny1' })
test({ nick: 'Repeater', data: 'Nothing special just talking' })
test({ nick: 'Repeater', data: 'BOOM out of nowhere you get nathanTiny1' }, true)
