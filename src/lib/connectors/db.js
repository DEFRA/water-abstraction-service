const config = require('../../../config.js');
const { Pool } = require('pg');

const pool = new Pool(config.pg);

function promiseQuery (queryString, params) {
  return new Promise((resolve, reject) => {
    query(queryString, params, (res) => {
      resolve(res);
    });
  });
}

function query (queryString, params, cb) {
  pool.query(queryString, params)
    .then((res) => {
      //      console.log(res)
      cb({data: res.rows, error: null});
    }) // brianc
    .catch(err => {
      cb({error: err.stack, data: null});
    });
}

module.exports = {

  query: promiseQuery,
  pool

};
