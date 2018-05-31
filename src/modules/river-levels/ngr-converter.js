/**
 * @TODO check implementation
 * Adapted from JScoord {@link http://www.jstott.me.uk/jscoord/#download}
 */

function OSRefToSixFigureString (easting, northing) {
  if (!easting || !northing) {
    return null;
  }

  var hundredkmE = Math.floor(easting / 100000);
  var hundredkmN = Math.floor(northing / 100000);
  var firstLetter = '';
  if (hundredkmN < 5) {
    if (hundredkmE < 5) {
      firstLetter = 'S';
    } else {
      firstLetter = 'T';
    }
  } else if (hundredkmN < 10) {
    if (hundredkmE < 5) {
      firstLetter = 'N';
    } else {
      firstLetter = 'O';
    }
  } else {
    firstLetter = 'H';
  }

  var secondLetter = '';
  var index = 65 + ((4 - (hundredkmN % 5)) * 5) + (hundredkmE % 5);
  if (index >= 73) index++;
  secondLetter = String.fromCharCode(index);

  var e = Math.floor((easting - (100000 * hundredkmE)) / 100);
  var n = Math.floor((northing - (100000 * hundredkmN)) / 100);
  var es = e;
  if (e < 100) es = '0' + es;
  if (e < 10) es = '0' + es;
  var ns = n;
  if (n < 100) ns = '0' + ns;
  if (n < 10) ns = '0' + ns;

  return firstLetter + secondLetter + es + ns;
}

module.exports = OSRefToSixFigureString;
