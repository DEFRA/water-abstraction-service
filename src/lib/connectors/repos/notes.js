'use strict';

const { Note } = require('../bookshelf');
const helpers = require('./lib/helpers');

const withRelated = [
  'user'
];

const create = async data => helpers.create(Note, data);

const update = (noteId, changes) =>
  Note
    .forge({ noteId })
    .save(changes);

/**
 * Find single note by ID
 * @param {String} noteId
 * @return {Promise<Object>}
 */
const findOne = async noteId => helpers.findOne(Note, 'noteId', noteId, withRelated);

exports.create = create;
exports.update = update;
exports.findOne = findOne;
