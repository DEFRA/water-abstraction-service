'use strict'

/* This regex is converting any string into Camel Case
 * [^a-zA-Z0-9] is matching any character except those inside the square brackets.
 * This could be a dash (-), space ( ), underscore (_) or (.)
 * +(.) is matching the first character after the dash, space or underscore.
 * /g. Replaces all the global matches and not just the first match, so the whole string can be converted.
 * if statement is checking if the string has a dash (-), space ( ), underscore (_) or dot (.)
 * This stops any strings that are alrady camelCase from going through the regex.
 * A camelCase string going through the regex won't work becuase it will lowercase the string first
 * making it all one word rather then a camelCase word.
*/
const toCamelCase = (key) => {
  let result = key

  if (key.includes('_') || key.includes('.') || key.includes(' ') || key.includes('-')) {
    const lowercaseKey = key.toLowerCase()
    result = lowercaseKey.replace(/[^a-zA-Z0-9]+(.)/g, (match, char) => char.toUpperCase())
  }
  return result
}

module.exports = toCamelCase
