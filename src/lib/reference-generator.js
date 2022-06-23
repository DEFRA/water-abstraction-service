/**
 * Make a random string of given length, from pre-defined list of chars
 * to avoid confusion - e.g don't include O and 0
 * @see {@link https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript}
 * @param {Number} length - the length of the random string
 * @return {String}
 */
function randomString (length) {
  let text = ''
  const possible = 'ABCDEFGHJKLMNPQRTUVWXYZ0123456789'
  for (let i = 0; i < length; i++) { text += possible.charAt(Math.floor(Math.random() * possible.length)) }
  return text
}

/**
 * A function to generate a pseudo-unique reference for a batch of messages
 * @param {String} prefix - e.g HOF-  EXPIRY-
 * @return {String} reference, e.g. EXPIRY-A14GB8
 */
function generateReference (prefix) {
  if (!prefix) {
    return null
  }
  return prefix + randomString(6)
}

module.exports = generateReference
