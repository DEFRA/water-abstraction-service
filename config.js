require('dotenv').config();

module.exports = {

  blipp: {
    showAuth: true
  },

  jwt: {
    key: process.env.JWT_SECRET,
    verifyOptions: { algorithms: [ 'HS256' ] }
  },

  logger: {
    level: 'info'
    // airbrakeKey: process.env.errbit_key,
    // airbrakeHost: process.env.errbit_server,
    // airbrakeLevel: 'error'
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
    application_name: process.env.servicename,
    newJobCheckIntervalSeconds: 5
  },

  s3: {
    accessKeyId: process.env.s3_key,
    secretAccessKey: process.env.s3_secret,
    region: 'eu-west-1',
    bucket: process.env.s3_bucket,
    proxy: process.env.proxy
  },

  server: {
    port: process.env.PORT,
    router: {
      stripTrailingSlash: true
    }
  }

};
