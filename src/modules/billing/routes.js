module.exports = {
  ...require('./routes/batches'),
  ...require('./routes/invoices'),
  ...require('./routes/two-part-tariff-review'),
  ...require('./routes/invoice-licences')
}
