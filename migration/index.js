var DBMigrate = require('db-migrate');

//getting an instance of dbmigrate
var dbm = DBMigrate.getInstance(true);
dbm.up()
.then(function() {

  console.log('successfully migrated up');
  return;
});
