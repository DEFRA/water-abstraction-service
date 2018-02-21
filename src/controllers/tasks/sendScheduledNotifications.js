const Helpers = require('../../lib/helpers')
const DB = require('../../lib/connectors/db')
const Notify = require('../notify')

async function run(data) {
  var query = `
  WITH selected AS (
         SELECT *
         FROM "water"."scheduled_notification"
         WHERE
  			 status is null  and
  			 send_after <= now()
         LIMIT  50
         FOR UPDATE
         )
      UPDATE "water"."scheduled_notification" s SET status='sending'
      where id in (select id from selected)
      RETURNING * ;`
  try{
    var notificationQuery = await DB.query(query);

    notificationQuery.data.forEach(async (notification)=>{
      console.log('send '+notification.id)
      const notifyData={
        message_ref:notification.message_ref,
        recipient:notification.recipient,
        personalisation:notification.personalisation
      }

      try{
        console.log('call notify.sendNow')
        var send=await Notify.sendNow(notifyData)

        if (send.error){
          var query=`UPDATE "water"."scheduled_notification" s SET status='error', log=$2 where id=$1`
          var queryParams=[notification.id, send.error]
          recordErr=await DB.query(query,queryParams)
          console.log(recordErr)
        } else {

          var query=`UPDATE "water"."scheduled_notification" s SET status='sent', log='' where id=$1`
          var queryParams=[notification.id]
          await DB.query(query,queryParams)
          recordSuccess=await DB.query(query,queryParams)
          console.log(recordSuccess)

        }
        console.log(send)
      }catch(e){
        console.log(e)
        var query=`UPDATE "water"."scheduled_notification" s SET status='error', log='${JSON.stringify(e)}' where id=$1`
        var queryParams=[notification.id]
        await DB.query(query,queryParams)
        recordError=await DB.query(query,queryParams)
        console.log(recordSuccess)
      }

    })


    console.log(notificationQuery)
    return {
      error: null
    }
  }catch(e){
    console.log(e)
    return {
      error: e
    }
  }


}

module.exports = {
  run
}
