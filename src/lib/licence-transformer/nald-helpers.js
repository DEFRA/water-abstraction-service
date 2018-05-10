/**
 * Formats a NGR reference to string format
 * @param {String} sheet - the sheet string, 2 chars
 * @param {String} east - the eastings
 * @param {String} north - the northings
 * @return {String} - grid reg, eg SP 123 456
 */
function formatNGRPointStr(sheet, east, north) {
  if(!sheet) {
    return null;
  }
  return `${ sheet } ${ east.substr(0, 3)} ${ north.substr(0, 3) }`;
}

/**
 * Converts a point in NALD data to our format with {ngr1, ngr2, ngr3, ngr4, name}
 * @param {Object} NALD point data
 * @return {Object} point data
 */
function formatAbstractionPoint(point) {
  return {
    ngr1 : formatNGRPointStr(point.NGR1_SHEET, point.NGR1_EAST, point.NGR1_NORTH ),
    ngr2 : formatNGRPointStr(point.NGR2_SHEET, point.NGR2_EAST, point.NGR2_NORTH ),
    ngr3 : formatNGRPointStr(point.NGR3_SHEET, point.NGR3_EAST, point.NGR3_NORTH ),
    ngr4 : formatNGRPointStr(point.NGR4_SHEET, point.NGR4_EAST, point.NGR4_NORTH ),
    name : point.LOCAL_NAME
  }
};

/**
 * Formats an abstraction point into a string
 * Example:  name, ngr1, ngr2
 * @param {Object} point - abstraction point from licence data
 * @return {String} abstraction point info formatted as String
 */
function abstractionPointToString(point) {
  const {name, ngr1, ngr2, ngr3, ngr4} = point;
  const parts = [name, ngr1, ngr2, ngr3, ngr4].filter(x => x);
  return parts.join(', ');
}






module.exports = {
  formatAbstractionPoint,
  abstractionPointToString,
  formatNGRPointStr
}
