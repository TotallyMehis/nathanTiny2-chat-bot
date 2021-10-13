IS_DEBUGGING = true

class Util {
  static debug(...args) {
    if (IS_DEBUGGING) {
      console.log.apply(this, args)
    }
  }
}

module.exports = Util

