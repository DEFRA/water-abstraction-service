const { writeFileSync, existsSync, mkdirSync } = require('fs');
const path = require('path');
const { getUploadFilename } = require('./lib/charge-information-upload');

const saveJson = (event, data) => {
  const filename = getUploadFilename(event, 'json');
  const fullFilename = path.join(process.cwd(), 'temp', filename);
  const dir = fullFilename.substr(0, fullFilename.lastIndexOf('/'));
  if (!existsSync(dir)) {
    mkdirSync(dir, {
      recursive: true
    });
  }
  writeFileSync(fullFilename, JSON.stringify(data, null, 2), error => {
    if (error) {
      console.log(`Failed to write ${filename}`, error);
      return;
    }
    console.log(`${filename} written successfully to disk`);
  });
};

exports.saveJson = saveJson;
