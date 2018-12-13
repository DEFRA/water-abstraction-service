require('dotenv').config();

module.exports = {

  admin: {
    baseUrl: process.env.ADMIN_BASE_URL
  },

  blipp: {
    showAuth: true
  },

  jwt: {
    key: process.env.JWT_SECRET,
    verifyOptions: { algorithms: [ 'HS256' ] }
  },

  logger: {
    level: 'info',
    airbrakeKey: process.env.ERRBIT_KEY,
    airbrakeHost: process.env.ERRBIT_SERVER,
    airbrakeLevel: 'error'
  },

  // 125 available db connections
  // 2 instances each with 2 cores running 5 applicatons that use
  // the database.
  // Therefore 125 / (2 x 2 x 5) = 6.25 connections per application pool.
  pg: {
    connectionString: process.env.DATABASE_URL,
    max: 8,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  },

  pgImport: {
    connectionString: process.env.DATABASE_URL,
    max: 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  },

  pgBoss: {
    schema: 'water',
    application_name: process.env.SERVICE_NAME,
    newJobCheckIntervalSeconds: 5
  },

  s3: {
    accessKeyId: process.env.S3_KEY,
    secretAccessKey: process.env.S3_SECRET,
    region: 'eu-west-1',
    bucket: process.env.S3_BUCKET,
    proxy: process.env.PROXY
  },

  server: {
    port: process.env.PORT,
    router: {
      stripTrailingSlash: true
    }
  },

  testMode: parseInt(process.env.TEST_MODE) === 1,

  licence: {
    regimeId: 1,
    typeId: 8
  },

  abstractionReform: {
    regimeId: 1,
    typeId: 10
  },

  version: '1.0'
};
