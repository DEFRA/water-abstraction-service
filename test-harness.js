require('dotenv').config();
const job = require('./src/modules/returns/lib/jobs/start-xml-upload');

job.handler()
  .then(res => console.log(res))
  .catch(err => console.error(err));
