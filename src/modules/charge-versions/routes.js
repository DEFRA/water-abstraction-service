'use strict'

module.exports = [
  ...Object.values(require('./routes/charge-versions')),
  ...Object.values(require('./routes/charge-version-workflows'))
]
