module.exports = {
  ...require('./routes/agreements'),
  ...require('./routes/charge-versions'),
  ...require('./routes/documents'),
  ...require('./routes/licences'),
  ...require('./routes/invoices'),
  ...require('./routes/licence-version-purpose-conditions')
};
