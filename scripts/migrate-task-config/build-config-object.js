/**
 * Builds config object for notification
 */
const fs = require('fs')
const path = require('path')

const loader = (notificationType) => {
  const data = require(path.join(__dirname, notificationType, 'config.json'))

  data.config.content = {
    email: fs.readFileSync(path.join(__dirname, notificationType, 'email.md')).toString(),
    letter: fs.readFileSync(path.join(__dirname, notificationType, 'letter.md')).toString()
  }

  return data
}

const data = [
  loader('hof-resume'),
  loader('hof-stop'),
  loader('hof-warning'),
  loader('renewal')
]

module.exports = data
