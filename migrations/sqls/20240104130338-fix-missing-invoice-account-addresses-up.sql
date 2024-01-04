/*
 * Add missing invoice_account_address records
 *
 * https://eaflood.atlassian.net/browse/WATER-4318
 *
 * When testing WATER-4223 we found 36 billing accounts (out of 38K) which didn't have a crm_v2.invoice_account_address
 * record. Every billing account (crm_v2.invoice_accounts) should have at least one of these. This script will
 * dynamically add the missing records.
 *
 * It populates the missing record using existing data. Every crm_v2.invoice_accounts record has to have a company_id.
 * We can look this up in the crm_v2.company_addresses table, which will have a corresponding address_id. This, plus
 * the invoice account ID, start, created and updated dates are all we need to create the missing records.
 *
 * The complication we have is crm_v2.company_addresses will have multiple entries per company. It, like
 * invoice_account_addresses has the concept of a start and end date. So, we only care about the last created that also
 * has a NULL end date (meaning it is the current record.)
 *
 * But a company can also appear multiple times due to the role assigned to the crm_v2.company_addresses record. We only
 * care for those where the role is 'billing'.
*/

INSERT INTO crm_v2.invoice_account_addresses(
	invoice_account_id, address_id, start_date, date_created, date_updated
)
SELECT
	ia.invoice_account_id, car.address_id, ia.start_date, ia.date_created, ia.date_updated
FROM crm_v2.invoice_accounts ia
INNER JOIN (
  -- The data we are dealing with being rubbish there is the possibility of the query returning 2 records with a NULL
  -- end date, matching company_id and a role of 'billing'. We can exploit a feature of PostgreSQL in this case.
  -- DISTINCT ON keeps only the first row from the results. So, should this query hit that scenario, by ordering by
  -- date_created DESC we'll pluck the address_id from the most recently created record thanks to DISTINCT ON
	SELECT DISTINCT ON (ca.company_id) ca.company_id, ca.address_id
	FROM crm_v2.company_addresses ca
	WHERE ca.end_date IS NULL
	AND ca.role_id = (SELECT ro.role_id FROM crm_v2.roles ro WHERE ro.name = 'billing')
	ORDER BY ca.company_id, ca.date_created DESC
) car ON car.company_id = ia.company_id
WHERE ia.invoice_account_id NOT IN (
  SELECT DISTINCT iaa.invoice_account_id FROM crm_v2.invoice_account_addresses iaa
);
