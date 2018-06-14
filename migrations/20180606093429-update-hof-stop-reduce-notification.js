'use strict';

var dbm;
var type; // eslint-disable-line no-unused-vars
var seed; // eslint-disable-line no-unused-vars
var fs = require('fs');
var path = require('path');
var Promise;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
  Promise = options.Promise;
};

const runQuery = (db, sqlName) => {
  const filePath = path.join(__dirname, 'sqls', sqlName);
  return new Promise(function (resolve, reject) {
    fs.readFile(filePath, {encoding: 'utf-8'}, function (err, data) {
      if (err) return reject(err);

      console.log('received data: ' + data);
      resolve(data);
    });
  }).then(function (data) {
    return db.runSql(data);
  });
};

exports.up = function (db) {
  return runQuery(db, '20180606093429-update-hof-stop-reduce-notification-up.sql');
};

exports.down = function (db) {
  return runQuery(db, '20180606093429-update-hof-stop-reduce-notification-down.sql');
};

exports._meta = { 'version': 1 };
