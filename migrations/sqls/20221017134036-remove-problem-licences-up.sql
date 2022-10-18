/* This query is deleting bad data that was transfered over from NALD. Due to
the database being relational and therefore the tables being joined multiple
record id's had to be searched and deleted*/

BEGIN;
DELETE FROM water.return_requirement_purposes WHERE return_requirement_purpose_id IN (
SELECT rp.return_requirement_purpose_id FROM water.licences l
INNER JOIN water.return_versions rv ON rv.licence_id = l.licence_id
INNER JOIN water.return_requirements rr ON rr.return_version_id = rv.return_version_id
INNER JOIN water.return_requirement_purposes rp ON rp.return_requirement_id = rr.return_requirement_id
WHERE licence_ref
IN ('`MD/054/0021/030', '03/28/27/0005 S/G'));

DELETE FROM water.return_requirements WHERE return_requirement_id IN (
SELECT rr.return_requirement_id FROM water.licences l
INNER JOIN water.return_versions rv ON rv.licence_id = l.licence_id
INNER JOIN water.return_requirements rr ON rr.return_version_id = rv.return_version_id
WHERE licence_ref
IN ('`MD/054/0021/030', '03/28/27/0005 S/G'));

DELETE FROM water.return_versions WHERE return_version_id IN (
SELECT rv.return_version_id FROM water.licences l
INNER JOIN water.return_versions rv ON rv.licence_id = l.licence_id
WHERE licence_ref
IN ('`MD/054/0021/030', '03/28/27/0005 S/G'));

DELETE FROM water.charge_versions WHERE charge_version_id IN (
SELECT cv.charge_version_id FROM water.licences l
INNER JOIN water.charge_versions cv ON cv.licence_id = l.licence_id
WHERE l.licence_ref
IN ('`MD/054/0021/030', '03/28/27/0005 S/G'));

DELETE FROM water.licence_version_purposes  WHERE licence_version_id  IN (
SELECT lv.licence_version_id FROM water.licences l
INNER JOIN water.licence_versions lv ON lv.licence_id = l.licence_id
WHERE l.licence_ref
IN ('`MD/054/0021/030', '03/28/27/0005 S/G'));

DELETE FROM water.licence_versions  WHERE licence_id  IN (
SELECT l.licence_id FROM water.licences l
WHERE l.licence_ref
IN ('`MD/054/0021/030', '03/28/27/0005 S/G'));

DELETE FROM water.licences WHERE licence_ref
IN ('`MD/054/0021/030', '03/28/27/0005 S/G');
COMMIT;
