/**
 * Builds config object for renewal notification
 */
const fs = require('fs');
const path = require('path');

const data = require('./config.json');

data.config.content = {
  email: fs.readFileSync(path.join(__dirname, 'email.md')).toString(),
  letter: fs.readFileSync(path.join(__dirname, 'letter.md')).toString()
};

module.exports = data;
