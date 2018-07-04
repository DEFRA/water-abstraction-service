
module.exports = {

  blipp: {
    showAuth: true
  },

  jwt: {
    key: process.env.JWT_SECRET,
    verifyOptions: { algorithms: [ 'HS256' ] }
  },

  logger: {
    level: 'info',
    airbrakeKey: process.env.errbit_key,
    airbrakeHost: process.env.errbit_server,
    airbrakeLevel: 'error'
  },

  pg: {
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  },

  pgBoss: {
    connectionString: process.env.DATABASE_URL,
    schema: 'water',
    application_name: process.env.servicename,
    newJobCheckInterval: 100,
    teamSize: 5
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
