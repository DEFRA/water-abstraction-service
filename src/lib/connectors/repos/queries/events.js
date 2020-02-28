exports.getMostRecentReturnInvitation = `
SELECT * FROM water.scheduled_notification
    WHERE event_id = (SELECT event_id FROM water.events 
      WHERE subtype = 'returnInvitation'
      ORDER BY created DESC LIMIT 1)
    AND licences \\? :licenceRef
    `;
