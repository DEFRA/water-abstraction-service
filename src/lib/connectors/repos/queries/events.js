exports.getMostRecentReturnInvitation = `
SELECT * FROM water.scheduled_notification
    WHERE event_id = (SELECT event_id FROM water.events 
      WHERE subtype = 'returnInvitation'
      AND status = 'completed'
      ORDER BY created DESC LIMIT 1)
    AND licences \\? :licenceRef
    `;

exports.getKPIReturnsMonthlyData = `
select 
  m.month, 
  m.year, 
  coalesce(sum(e.is_return), 0)::integer as return_count, 
  coalesce(sum(e.is_paper_form), 0)::integer as paper_form_count,
  coalesce(sum(e.sent_notification_count), 0)::integer as sent_notification_count,
  m.year = date_part('year', NOW()) as current_year
from (
  -- Gets a series of months beginning when WRLS began collecting returns
  select 
    date_part('month', date.ts) as month,
    date_part('year', date.ts) as year
  from ( 
    select * from generate_series(
      '2018-10-31', 
      -- last day of current month
      (date_trunc('month', now()::date) + interval '1 month' - interval '1 day')::date,
      '1 month'
    ) as ts
  ) as date
) as m
left join (
  -- Gets list of returns/return PDF form events with month and year  
  select
    e.event_id,
    date_part('year', e.created) as year,
    date_part('month', e.created) as month,
    case
      when e.type='return' then 1 else 0 end
      as is_return,
    case
      when e.subtype in ('pdf.return_form', 'paperReturnForms') then 1 else 0 end
      as is_paper_form,
    sn.sent_notification_count
  from water.events e 
  left join (
    -- Gets successfully sent notification count by event ID 
    select sn.event_id, count(id) as sent_notification_count 
      from water.scheduled_notification sn
      where 
        sn.notify_id is not null
        and sn.notify_status in ('accepted', 'delivered', 'sending', 'accepted', 'received')
        and sn.event_id is not null
        group by sn.event_id
  ) sn on e.event_id=sn.event_id
  where 
    (
      e.type='return'
      or e.subtype in ('pdf.return_form', 'paperReturnForms')
    )
    and e.status in ('sent', 'completed')
  ) e on m.month=e.month and m.year=e.year
  group by m.year, m.month
`;

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
 * - a jsonb blob of message "statuses" with counts for each event, e.g. [{ status: 'error', notify_status: null, count :3 }, ...]
 */
exports.findNotifications = `
select * from (
select e.*,
e2.recipient_count,
  e2.statuses,
  e2.message_ref,
  snc.category_value
from water.events e
left join (
  --
  -- this inner query aggregates the message counts so that there is a single row
  -- per event ID, and the status counts are aggregated into a JSON blob
  --
  select 
    n.event_id, 
    n.message_ref,
    sum(n.count) as recipient_count,
    jsonb_agg(jsonb_build_object('status', n.status, 'notify_status', n.notify_status, 'count', n.count)) as statuses
  from (
    --
    -- this inner query fetches a count of messages in each status/notify_status combination
    -- grouped by the event_id
    --
    select n.event_id, n.message_ref, n.status, n.notify_status, count(*) as "count"
    from water.scheduled_notification n
    where n.event_id is not null
    group by n.event_id, n.message_ref, n.status, n.notify_status
  ) n
  group by n.event_id, n.message_ref
) e2 on e.event_id=e2.event_id
left join water.scheduled_notification_categories snc on e2.message_ref = any(snc.scheduled_notification_refs)
where 
  e.type='notification'
  and e.status in ('sent', 'completed', 'sending')
  and (e.issuer = cast(:sender::text as varchar) or :sender::text = '')
group by e.event_id, e2.recipient_count, e2.message_ref, e2.statuses, snc.category_value
order by e.created desc
) as cte where cte.category_value = any(string_to_array(:categories, ',')) or :categories = ''
limit :limit 
offset :offset
`;

exports.findNotificationsCount = `
select count(*) from (
select e.*,
e2.recipient_count,
  e2.statuses,
  e2.message_ref,
  snc.category_value
from water.events e
left join (
  --
  -- this inner query aggregates the message counts so that there is a single row
  -- per event ID, and the status counts are aggregated into a JSON blob
  --
  select 
    n.event_id, 
    n.message_ref,
    sum(n.count) as recipient_count,
    jsonb_agg(jsonb_build_object('status', n.status, 'notify_status', n.notify_status, 'count', n.count)) as statuses
  from (
    --
    -- this inner query fetches a count of messages in each status/notify_status combination
    -- grouped by the event_id
    --
    select n.event_id, n.message_ref, n.status, n.notify_status, count(*) as "count"
    from water.scheduled_notification n
    where n.event_id is not null
    group by n.event_id, n.message_ref, n.status, n.notify_status
  ) n
  group by n.event_id, n.message_ref
) e2 on e.event_id=e2.event_id
left join water.scheduled_notification_categories snc on e2.message_ref = any(snc.scheduled_notification_refs)
where 
  e.type='notification'
  and e.status in ('sent', 'completed', 'sending')
  and (e.issuer = cast(:sender::text as varchar) or :sender::text = '')
group by e.event_id, e2.recipient_count, e2.message_ref, e2.statuses, snc.category_value
order by e.created desc
) as cte where cte.category_value = any(string_to_array(:categories, ',')) or :categories = ''
`;

exports.findNotificationCategories = `
    select category_value as value, category_label as label from water.scheduled_notification_categories where is_enabled is true;
`;
