'use strict';
const { get } = require('lodash');
const { updateCustomer } = require('../../../lib/connectors/charge-module/customers-with-retry');
const JOB_NAME = 'customer.updateAccount.*';

const createMessage = async (invoiceAccountId) => {
  // const data = await getInvoiceAccountData(invoiceAccountId);

  return {
    name: JOB_NAME.replace('*', invoiceAccountId),
    data: {
      invoiceAccountId
    }
  };
};

const handleUpdateCustomer = async job => {
  const invoiceAccountId = get(job, 'data.invoiceAccountId');
  return updateCustomer(invoiceAccountId);
};

exports.createMessage = createMessage;
exports.handler = handleUpdateCustomer;
exports.jobName = JOB_NAME;
