'use strict'

/**
 * Collection of helper functions that allowed us to move away from Lodash
 * @module ObjectHelpers
 */

/**
 * Returns an array of the array to chunk 'chunked' into smaller arrays
 *
 * Often needed where you have something you need to break down into batches, for example, records to persist to a
 * DB. You pass in the array of records along with your batch size, and this will return an array of smaller arrays
 * of the size you specified.
 *
 * When the array is not fully divisible by the `chunkSize` any remainders will be returned in the last array chunk. If
 * the `chunkSize` is greater than the array size you'll just an array with an array inside!
 *
 * If `chunkSize` is 0 or less you'll get an empty array returned
 *
 * @param {Array} arrayToChunk The array to break into smaller chunks
 * @param {Number} chunkSize What size 'chunks' the array should be broken up into. Note, the last chunk may be equal or
 * less than `chunkSize`
 *
 * @returns {Array[Array]} a single array containing the `arrayToChunk` split into smaller arrays
 */
function chunk (arrayToChunk, chunkSize) {
  const tmp = [...arrayToChunk]
  const cache = []

  if (chunkSize <= 0) {
    return cache
  }

  while (tmp.length) {
    cache.push(tmp.splice(0, chunkSize))
  }

  return cache
}

/**
 * Returns a new function with some arguments partially applied to the original function
 * from the right.
 *
 * @param {Function} func - The function to partially apply arguments to.
 * @param {...*} cachedArgs - The arguments to be partially applied to `func` from the right.
 * @returns {Function} - A new function that takes an arbitrary number of arguments and
 * applies them to `func` along with the `cachedArgs` array, using the spread operator.
 */
function partialRight (func, ...cachedArgs) {
  return function (...args) {
    return func(...args, ...cachedArgs)
  }
}

/**
 * Returns a modified version of the `key` parameter in camel case.
 *
 * @param {string} key - The string to be converted to camel case.
 * @returns {string} - The modified string in camel case.
 *
 * [^a-zA-Z0-9]: Matches any character that is not a letter or number.
 * +: Matches one or more of the previous character class
 * (i.e., one or more non-alphanumeric characters).
 * (.): Matches any letter or number that comes immediately after one or more
 * non-alphanumeric characters. The parentheses capture this letter or number as a group.
 *
 * The g flag at the end of the regular expression makes the replace method replace
 * all matches in the string, rather than just the first match.
 */
function toCamelCase (key) {
  let result = key

  if (key.includes('_') || key.includes('.') || key.includes(' ') || key.includes('-')) {
    const lowercaseKey = key.toLowerCase()
    result = lowercaseKey.replace(/[^a-zA-Z0-9]+(.)/g, function (match, char) {
      return char.toUpperCase()
    })
  }

  return result
}

/**
 * Truncates a string to a specified length, adding an ellipsis at the end to
 * indicate that the string has been shortened.
 *
 * @param {string} string - The string to be truncated.
 * @param {number} length - The maximum length to the truncated string.
 * @returns {string} - The truncated string.
 */

function truncate (string, length) {
  if (string?.length > length) {
    return string.slice(0, (length - 3)) + '...'
  }

  return string
}

/**
 * Groups the elements of an array based on a key selector function.
 *
 * @param {Array} array - The array to group.
 * @param {Function} keyFn - A function that takes an array element as input
 *  and returns the key used to group the element.
 * @returns {Object} An object whose keys are the unique group keys and whose values
 *  are arrays of elements that belong to that group
 */
const groupBy = (array, keySelector) => {
  const groups = {}
  array.forEach(item => {
    const key = keySelector(item)
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(item)
  })
  return groups
}

module.exports = {
  chunk,
  partialRight,
  toCamelCase,
  truncate,
  groupBy
}
