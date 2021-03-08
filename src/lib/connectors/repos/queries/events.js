exports.getMostRecentReturnInvitation = `
SELECT * FROM water.scheduled_notification
    WHERE event_id = (SELECT event_id FROM water.events 
      WHERE subtype = 'returnInvitation'
      AND status = 'completed'
      ORDER BY created DESC LIMIT 1)
    AND licences \\? :licenceRef
    `;

exports.getKPIReturnsMonthlyData = `
SELECT date_part('month', created)::integer AS month, 
date_part('year', created)::integer AS year,
SUM(CASE 
  WHEN subtype = 'pdf.return_form' THEN 1
  WHEN subtype = 'paperReturnForms' THEN jsonb_array_length(licences)
  ELSE 0
END)::integer AS request,
SUM(CASE WHEN "type" = 'return' and subtype <> 'pdf.return_form' THEN 1 ELSE 0 END)::integer AS return, 
CASE WHEN date_part('year', created)::integer = date_part('year', CURRENT_DATE) THEN true ELSE false END AS current_year
FROM water.events 
WHERE "type" = 'return' OR subtype IN ('pdf.return_form', 'paperReturnForms')      
AND date_part('year', created) = date_part('year', CURRENT_DATE)  
GROUP BY  current_year, month
ORDER BY current_year asc, month desc;`;

exports.getKPILicenceNamesData = `
SELECT date_part('month', created)::integer AS month, 
date_part('year', CURRENT_DATE)::integer AS year,
SUM (CASE WHEN subtype = 'name' THEN 1 ELSE 0 END)::integer AS named,
SUM (CASE WHEN subtype = 'rename' THEN 1 ELSE 0 END)::integer AS renamed,
CASE WHEN date_part('year', CURRENT_DATE) = date_part('year', created) THEN true ELSE false END AS current_year
FROM water.events  
WHERE type = 'licence:name'
GROUP BY month, year, current_year ORDER BY year desc, month desc;`;

/**
 * The findNotifications query finds:
 *
 * - events with a type of "notification" and a status which is one of
 *   "sent", "completed", "sending"
 * - a "recipient_count" for each event (count of related rows in water.scheduled_notifications)
 * - a jsonb blob of message "statuses" with counts for each event, e.g. [{ status: 'error', count :3 }, ...]
 */
exports.findNotifications = `
select e.*,
  e2.recipient_count,
  e2.statuses
from water.events e
left join (
  --
  -- this inner query aggregates the message counts so that there is a single row
  -- per event ID, and the status counts are aggregated into a JSON blob
  --
  select 
    n.event_id, 
    sum(n.count) as recipient_count,
    jsonb_agg(jsonb_build_object('status', n.status, 'notify_status', n.notify_status, 'count', n.count)) as statuses
  from (
    --
    -- this inner query fetches a count of messages in each status, grouped by 
    -- the event_id
    --
    -- the "status" and "notify_status" columns are coalesced because once we have received
    -- a notify status, this is preferred over the "status" column for determining the fate
    -- of the message 
    --
    select n.event_id, n.status, n.notify_status, count(*) as "count"
    from water.scheduled_notification n
    where n.event_id is not null
    group by n.event_id, n.status, n.notify_status
  ) n
  group by n.event_id
) e2 on e.event_id=e2.event_id
where 
  e.type='notification'
  and e.status in ('sent', 'completed', 'sending')
group by e.event_id, e2.recipient_count, e2.statuses
order by e.created desc
limit :limit 
offset :offset
`;

exports.findNotificationsCount = `
select count(e.*)
  from water.events e
where 
  e.type='notification'
  and e.status in ('sent', 'completed', 'sending')
`;
