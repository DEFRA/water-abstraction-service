let idCounter = 1000000000;

function getNextId () {
  idCounter++;
  return idCounter;
}

module.exports = getNextId;
