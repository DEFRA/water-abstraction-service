'use strict';

const { ChargePurpose } = require('../bookshelf');

const helpers = require('./lib/helpers');

const create = data => helpers.create(ChargePurpose, data);

exports.create = create;
