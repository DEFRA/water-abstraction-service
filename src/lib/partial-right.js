'use strict'

/**
 * The partialRight methods return a function that takes a function with the
 * arguments partially applied to it. We can then call the return function with
 * more arguments. The right is that we are applying the arguments from right to
 * left
 */
const partialRight = (fn, ...partialArgs) => (...args) => fn(...args, ...partialArgs)

module.exports = partialRight
