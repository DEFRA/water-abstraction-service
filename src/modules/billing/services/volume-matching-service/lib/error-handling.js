'use strict';

const getErrorIfSome = (arr, predicate, error) => {
  return arr.some(predicate) ? error : null;
};

const getErrorIfEvery = (arr, predicate, error) => {
  return arr.every(predicate) ? error : null;
};

exports.getErrorIfSome = getErrorIfSome;
exports.getErrorIfEvery = getErrorIfEvery;
