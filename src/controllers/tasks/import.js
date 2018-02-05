
const Nald = require('../../lib/nald')
const Helpers = require('../../lib/helpers')
const Permit = require('../../lib/connectors/permit');
const DB = require('../../lib/connectors/db')

async function run(data){
  console.log('run!')
  if(data.licence_ref=='-'){
    console.log('request for next pending licence')

    var query = `
    select * from water.pending_import where status=0 limit 250;`
    var licenceQuery = await DB.query(query);
    if(licenceQuery.data){

      for(licenceNo in licenceQuery.data){

      licence_ref=licenceQuery.data[licenceNo].licence_ref;
      var licence = await Nald.licence(licence_ref)
      licence.vmlVersion=2
      var exp = await exportLicence(licence_ref,1,8,licence)

      var query = `
      update water.pending_import set status=1 where licence_ref=$1;`
      var licenceStatusUpdate = await DB.query(query,[licence_ref]);
      }
      return {error:null}
    } else {
        console.log('no licences waiting')
        return {error:null}
    }
    return {error:null}
  } else {
    console.log('request for ',data.licence_ref)
    var licence = await Nald.licence(data.licence_ref)

    if(licence) {
      licence.vmlVersion=2
      var exp = await exportLicence(data.licence_ref,1,8,licence)
      return {error:null}
    }
    else {
      return {error: `Licence data for ${data.licence_ref} is undefined`};   
    }
    console.log('Licence data:', licence);

  }


}



async function exportLicence(licence_ref, regime_id, licence_type_id,data) {
  //console.log('xxx: build packet for export')
  var requestBody = {
    licence_ref: licence_ref,
    licence_start_dt: "2017-01-01T00:00:00.000Z",
    licence_end_dt: "2019-01-01T00:00:00.000Z",
    licence_status_id: "1",
    licence_type_id: licence_type_id,
    licence_regime_id: regime_id,
    licence_data_value: JSON.stringify(data)
  }
  delete requestBody.regime_id;
  var {data, error} = await Permit.licences.create(requestBody)
  if(error) {
    if(error.code=='23505'){
      console.log('licence already imported')
      throw error
    } else {
      throw error;
    }
  }
//    console.log(`Added ID ${data.licence_id} to Permit repo`);
    var crmPacket=buildCRMPacket(requestBody,licence_ref,data.licence_id)
    var crm=await addLicenceToCRM(crmPacket)
//    console.log('Added '+crmPacket.system_external_id+'to CRM');
    return {error:null}
}


function buildCRMPacket(licence_data,licence_ref,licence_id){
  var crmData = {}

  crmData.regime_entity_id = '0434dc31-a34e-7158-5775-4694af7a60cf'

  crmData.system_id = 'permit-repo'
  crmData.system_internal_id = licence_id
  crmData.system_external_id = licence_ref

try{



  var baseLicence=JSON.parse(licence_data.licence_data_value).data.versions[0];
  var baseParty=baseLicence.ACON_APAR_ID;
  var baseAddress=baseLicence.ACON_AADD_ID;

  var party = baseLicence.parties.filter(function(value){ return value.ID==baseParty;})[0]
  var contacts = party.contacts.filter(function(value){ return value.AADD_ID==baseAddress;})[0]
  var address=contacts.party_address

  var metadata={
     Name : party.NAME,
     Salutation : party.SALUTATION,
     Initials : party.INITIALS,
     Forename : party.FORENAME,
     AddressLine1 : address.ADDR_LINE1,
     AddressLine2 : address.ADDR_LINE2,
     AddressLine3 : address.ADDR_LINE3,
     AddressLine4 : address.ADDR_LINE4,
     Town : address.TOWN,
     County : address.COUNTY,
     Postcode : address.POSTCODE,
     Country : address.COUNTRY,
  }

  for (attr in metadata){
    if (metadata[attr]=='null'){
      metadata[attr]=''
    }
  }

  console.log(metadata)

  crmData.metadata = JSON.stringify(metadata);

}catch(e){
  console.log('METADATA ERROR!!! OH NOES!!!')
  console.log(e)
}

console.log("crmData")
  console.log(crmData)

  return crmData
}

async function addLicenceToCRM(data){

console.log(data)

  var url=  process.env.CRM_URI + '/documentHeader'

  res = await Helpers.makeURIRequestWithBody(
    url,
    'post',
    data,
    {
      Authorization : process.env.JWT_TOKEN
    }
  )
  return res
}

module.exports={
  run
}
