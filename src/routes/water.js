/*
API page, pending real back end - uses fs to read and write to lkocal json files...

*/


const version = '1.0'

module.exports = [
  { method: 'GET', path: '/status', handler: function(request,reply){return reply('ok').code(200)}, config:{auth: false,description:'Get all entities'}},
]
/**
{ method: 'GET', path: '/API/' + version + '/test', handler: test },
{ method: 'POST', path: '/API/' + version + '/licences', handler: licencesPostHandler },
{ method: 'GET', path: '/API/' + version + '/licences/{id}', handler: licenceGetHandler },
{ method: 'PUT', path: '/API/' + version + '/licences/{id}', handler: licencePutHandler  }

{ method: 'GET', path: '/API/' + version + '/orgs/{regime_id}/types/{type_id}/licences', handler: getLicencesByOrgandType },
{ method: 'GET', path: '/API/' + version + '/orgs/{regime_id}/types/{type_id}/licences/{licence_id}', handler: getLicenceByOrgTypeID },
{ method: 'POST', path: '/API/' + version + '/orgs/{regime_id}/types/{type_id}/licences', handler: addLicenceByOrgTypeID },

**/
