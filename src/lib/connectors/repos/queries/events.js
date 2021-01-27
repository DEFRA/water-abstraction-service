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
