
const Nald = require('../../lib/nald')
const Helpers = require('../../lib/helpers')
const Permit = require('../../lib/connectors/permit');
const DB = require('../../lib/connectors/db')

async function run(data){
  console.log('request for ',data.licence_ref)
  var licence = await Nald.licence(data.licence_ref)
  licence.vmlVersion=2
  var exp = await exportLicence(data.licence_ref,1,8,licence)
  return {error:null}
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
  console.log(licence_data)

  crmData.regime_entity_id = '0434dc31-a34e-7158-5775-4694af7a60cf'

  crmData.system_id = 'permit-repo'
  crmData.system_internal_id = licence_id
  crmData.system_external_id = licence_ref

  crmData.metadata = JSON.stringify({
     Name : licence_data.LIC_HOLDERS_NAME,
     Salutation : "",
     AddressLine1 : "licence.addressLine1",
     AddressLine2 : "licence.addressLine2",
     AddressLine3 : "licence.addressLine3",
     AddressLine4 : "licence.addressLine4",
     Town : "licence.town",
     County : "licence.county",
     Postcode : "licence.postCode",
     Country : "licence.country",
  });
  return crmData
}

async function addLicenceToCRM(data){
  var url=  process.env.CRM_URI + '/documentHeader'
  console.log(url)
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
