'use strict'

/**
 * Use to break arrays up into 'chunks'
 * @module Chunk
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

module.exports = {
  chunk
}
