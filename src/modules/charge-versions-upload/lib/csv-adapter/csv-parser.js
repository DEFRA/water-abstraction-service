'use strict';

const util = require('util');
const parseCsv = util.promisify(require('csv-parse'));

const parseOptions = {
  skip_lines_with_empty_values: true,
  skip_empty_lines: true,
  trim: true
};

exports.parseCsv = str => parseCsv(str, parseOptions);
