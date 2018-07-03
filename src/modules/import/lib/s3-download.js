/**
 * Download a file from S3 bucket and store locally on disk
 */
const proxyAgent = require('proxy-agent');
const AWS = require('aws-sdk');
const fs = require('fs');

// Configure S3
const config = require('../../../../config.js');
const { bucket, proxy, ...credentials } = config.s3;
AWS.config.update(credentials);

if (proxy) {
  AWS.config.update({
    httpOptions: { agent: proxyAgent(proxy) }
  });
}

const s3 = new AWS.S3();

/**
 * Downloads file with key 'key' from bucket and places
 * in destination
 * @param {String} key - filename in DS3 bucket
 * @param {String} destination - destination in local file structure
 */
const download = async (key, destination) => {
  return new Promise((resolve, reject) => {
    const options = {
      Bucket: bucket,
      Key: key
    };
    const file = fs.createWriteStream(destination);
    file.on('close', function () {
      resolve();
    });

    s3.getObject(options).createReadStream().on('error', function (err) {
      reject(err);
    }).pipe(file);
  });
};

module.exports = {
  download
};
