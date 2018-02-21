
/**
 * Get a random character
 * @param {String} char - the current value
 * @return {String} a randomised value
 */
function getRandomChar(char) {
  let possible;
  if(char.match(/[ABCDEFGHIJKLMNOPQRSTUVWXYZ]/)) {
    possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  }
  else if(char.match(/[abcdefghijklmnopqrstuvwxyz]/)) {
    possible = 'abcdefghijklmnopqrstuvwxyz';
  }
  else if(char.match(/[0123456789]/)) {
    possible = '0123456789';
  }
  else {
    return char;
  }
  return possible.charAt(Math.floor(Math.random() * possible.length));
}


/**
 * Randomise a single field value
 * @param {String} val - a value, e.g. a licence number, expiry date, text string
 * @return {String} a randomised version that looks similar
 */
function randomiseValue(val) {
  if(val.toLowerCase() === 'null') {
    return val;
  }
  // Dates
  if(val.match(/^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/)) {
    return '01/01/2018';
  }
  // Other strings
  let newStr = '';
  for(let i =0; i<val.length; i++) {
    newStr += getRandomChar(val.substr(i, 1));
  }
  return newStr;
}


/**
 * Randomise a row data object
 * @param {Object} row
 * @param {Array} omitFields - a list of fields to omit from randomisation
 * @return {Object} with data randomised
 */
function randomiseRow(row, omitFields = []) {
  const picked = pick(row, omitFields);
  return Object.assign({}, mapValues(row, randomiseValue), picked);
}

module.exports = {
  getRandomChar,
  randomiseValue,
  randomiseRow
}
