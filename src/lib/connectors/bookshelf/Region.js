const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('Region', {
  tableName: 'regions'
});
