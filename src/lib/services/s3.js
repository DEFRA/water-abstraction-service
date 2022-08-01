const fs = require('fs')

const config = require('../../../config.js')

const s3Connector = require('../connectors/s3')

const getOptions = (key, options = {}) => ({
  Bucket: config.s3.bucket,
  Key: key,
  ...options
})

/**
 * Uploads specified file to s3
 * @param {String} filename - on s3 bucket
 * @param {*} buffer - buffer for file
 * @return {Promise}
 */
const upload = async (filename, buffer) => {
  const options = getOptions(filename, { Body: buffer })
  return s3Connector.getS3().upload(options).promise()
}

const callS3MethodWithKey = (method, key) => {
  const options = getOptions(key)
  return s3Connector.getS3()[method](options).promise()
}

/**
 * Wraps the call to getObject from the sdk returning a Promise.
 * @param {Sting} key - on s3 bucket
 * @return {Promise}
 */
const getObject = key => callS3MethodWithKey('getObject', key)

/**
 * Downloads file with key 'key' from bucket and places
 * in destination
 * @param {String} key - filename in S3 bucket
 * @param {String} destination - destination in local file structure
 * @return {Promise}
 */
const download = async (key, destination) => {
  return new Promise((resolve, reject) => {
    const options = getOptions(key)
    const file = fs.createWriteStream(destination)

    file.on('close', () => resolve())

    return s3Connector.getS3().getObject(options)
      .createReadStream()
      .on('error', err => reject(err))
      .pipe(file)
  })
}

/**
 * Gets header information about specified file
 * @param {String} key
 * @return {Promise}
 */
const getHead = key => callS3MethodWithKey('headObject', key)

exports.upload = upload
exports.getObject = getObject
exports.download = download
exports.getHead = getHead
