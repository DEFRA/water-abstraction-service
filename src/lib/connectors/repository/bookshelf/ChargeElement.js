const { bookshelf } = require('../../../connectors/bookshelf');

module.exports = bookshelf.model('ChargeElement', {
  tableName: 'charge_elements',
  idAttribute: 'charge_element_id'
});
