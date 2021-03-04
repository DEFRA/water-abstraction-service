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

exports.findNotifications = `
select e.*,
  count(n.id) as recipient_count,
  e2.statuses
from water.events e
left join water.scheduled_notification n on e.event_id=n.event_id
left join (
  select 
    n.event_id, 
    jsonb_agg(jsonb_build_object('status', n.status, 'count', n.count)) as statuses
  from (
    select n.event_id, coalesce(n.notify_status, n.status) as status, count(*) as "count"
    from water.scheduled_notification n
    where n.event_id is not null
    group by n.event_id, n.status, n.notify_status
  ) n
  group by n.event_id
) e2 on e.event_id=e2.event_id
where 
  e.type='notification'
  and e.status in ('sent', 'completed', 'sending')
group by e.event_id, e2.statuses
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
