require('dotenv').config();
const testMode = parseInt(process.env.TEST_MODE) === 1;

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
    level: testMode ? 'info' : 'error',
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
    port: 8001,
    router: {
      stripTrailingSlash: true
    }
  },

  testMode,

  licence: {
    regimeId: 1,
    typeId: 8
  },

  abstractionReform: {
    regimeId: 1,
    typeId: 10
  },

  version: '1.0',

  idm: {
    application: 'water_vml'
  },

  notify: {
    templates: {
      returns_invitation_letter: 'd31d05d3-66fe-4203-8626-22e63f9bccd6'
    }
  },

  services: {
    crm: process.env.CRM_URI || 'http://127.0.0.1:8002/crm/1.0',
    idm: process.env.IDM_URI || 'http://127.0.0.1:8003/idm/1.0',
    permits: process.env.PERMIT_URI || 'http://127.0.0.1:8004/API/1.0/',
    returns: process.env.RETURNS_URI || 'http://127.0.0.1:8006/returns/1.0',
    import: process.env.IMPORT_URI || 'http://127.0.0.1:8007/import/1.0'
  }
};
