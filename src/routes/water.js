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



//start node cron
const cron = require('node-cron');
const IDM= require('../lib/connectors/idm')
const Slack= require('../lib/slack')
cron.schedule('0 8,10,17 * * *', function(){
  console.log('running a task now and again...');
  users()
});

function users(){
  IDM.getUsers().then((users)=>{
    stats={loggedin:{users:[],domains:[]},notloggedin:{users:[],domains:[]}}
    for(userRef in users){
      var user=users[userRef]
      if(user.last_login != null){
        status="loggedin"
      } else {
        status="notloggedin"
      }
      stats[status].users.push(user.user_name)
      var domain=user.user_name.split('@')[1].trim()
      if(!stats[status][domain]){
        stats[status].domains[domain]=[user.user_name]
      }
      stats[status].domains[domain].push()
//      console.log(user.last_login, domain)
    }
//    console.log(stats)

    report=`Login Activity Summary (${process.env.environment})`;
    for (type in stats){
      report+=`\n\n ${type}`
//      console.log(type)
        for (domain in stats[type].domains){
          report+=`\n\t@${domain}: ${domain.length}`
//          console.log(domain,domain.length)
        }
    }


    Slack.post(report).then(()=>{
      console.log('slack posted')
    }).catch((err)=>{
      console.log(err)
    })
    console.log(report)
  })
}
