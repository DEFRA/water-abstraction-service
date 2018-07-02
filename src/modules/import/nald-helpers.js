const moment = require('moment');

function dateToSortableString (str) {
  var d = moment(str, 'DD/MM/YYYY');
  if (d.isValid()) {
    return d.format('YYYYMMDD');
  } else {
    return null;
  }
}

module.exports = {
  dateToSortableString
};
