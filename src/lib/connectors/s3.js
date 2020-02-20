const fs = require('fs');
const aws = require('aws-sdk');
const proxyAgent = require('proxy-agent');

const config = require('../../../config.js');
const { bucket, ...credentials } = config.s3;

const getS3 = () => {
  const { proxy } = config;
  const awsConfig = {
    ...credentials,
    ...proxy && {
      httpOptions: {
        agent: proxyAgent(proxy)
      }
    }
  };
  console.log(awsConfig);
  aws.config.update(awsConfig);
  return new aws.S3();
};

const s3 = getS3();

const upload = async (filename, buffer) => {
  const options = {
    Bucket: bucket,
    Key: filename,
    Body: buffer
  };

  return s3.upload(options).promise();
};

/**
 * Wraps the call to getObject from the sdk returning a Promise.
 */
const getObject = key => {
  const options = { Bucket: bucket, Key: key };
  return s3.getObject(options).promise();
};

/**
 * Downloads file with key 'key' from bucket and places
 * in destination
 * @param {String} key - filename in S3 bucket
 * @param {String} destination - destination in local file structure
 */
const download = async (key, destination) => {
  return new Promise((resolve, reject) => {
    const options = { Bucket: bucket, Key: key };
    const file = fs.createWriteStream(destination);

    file.on('close', () => resolve());

    return s3.getObject(options)
      .createReadStream()
      .on('error', err => reject(err))
      .pipe(file);
  });
};

exports.getS3 = getS3;
exports.upload = upload;
exports.getObject = getObject;
exports.download = download;
