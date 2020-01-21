const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('Licence', {
  tableName: 'licences',
  region () {
    return this.hasOne('Region', 'region_id', 'region_id');
  }
});
