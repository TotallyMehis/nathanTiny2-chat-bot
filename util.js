IS_DEBUGGING = true

module.exports = {
  debug: (...args) => {
    if (IS_DEBUGGING) {
      console.log.apply(this, args)
    }
  }
}

