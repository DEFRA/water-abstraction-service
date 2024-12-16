ALTER TABLE water.licence_version_purpose_condition_types
    ADD COLUMN param_1_label VARCHAR,
    ADD COLUMN param_2_label VARCHAR;

BEGIN TRANSACTION;

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Linked licence number',
    param_2_label = 'Aggregate quantity'
WHERE code = 'AGG' AND subcode = 'LLL';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Linked licence number',
    param_2_label = 'Aggregate quantity'
WHERE code = 'AGG' AND subcode = 'LLX';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Linked licence number',
    param_2_label = 'Aggregate quantity'
WHERE code = 'AGG' AND subcode = 'LPL';

UPDATE water.licence_version_purpose_condition_types
SET param_2_label = 'Aggregate quantity'
WHERE code = 'AGG' AND subcode = 'PP';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Linked licence number',
    param_2_label = 'Aggregate quantity'
WHERE code = 'AGG' AND subcode = 'PPL';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Specify flow (l/s)',
    param_2_label = 'Where measured'
WHERE code = 'BYPAS' AND subcode = 'FLOW';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Control sampling site',
    param_2_label = 'Concentration'
WHERE code = 'CES' AND subcode = 'CHE';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Licence number/scheme name',
    param_2_label = 'Threshold quantity'
WHERE code = 'CES' AND subcode = 'DEP';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'EA gauging station',
    param_2_label = 'Threshold flow'
WHERE code = 'CES' AND subcode = 'FLOW';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Control site number',
    param_2_label = 'Threshold level'
WHERE code = 'CES' AND subcode = 'GWL';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'EA gauging station',
    param_2_label = 'Threshold level'
WHERE code = 'CES' AND subcode = 'LEV';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Start date',
    param_2_label = 'End date'
WHERE code = 'CES' AND subcode = 'POL';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Licence number and suffix linked to'
WHERE code = 'COMB' AND subcode = 'LINK';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Specify flow (l/s)',
    param_2_label = 'Where measured'
WHERE code = 'COMPR' AND subcode = 'FLOW';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Type of pass or screen',
    param_2_label = 'Location of pass or screen'
WHERE code = 'EEL' AND subcode = 'REGS';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Number of days notice Agency to be given'
WHERE code = 'FILL' AND subcode = 'FILL';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Filling season start date',
    param_2_label = 'Filling season end date'
WHERE code = 'FILL' AND subcode = 'SEAS';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Type'
WHERE code = 'INFLO' AND subcode = 'TYPE';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Rate (l/s)',
    param_2_label = 'Where measured'
WHERE code = 'INFLR' AND subcode = 'RATE';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Type'
WHERE code = 'LINTY' AND subcode = 'TYPE';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Structure required',
    param_2_label = 'Season to be locked'
WHERE code = 'LOK' AND subcode = 'OFF';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Flow (l/s)',
    param_2_label = 'Where measured'
WHERE code = 'MAINT' AND subcode = 'FLOW';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Means'
WHERE code = 'MCOMP' AND subcode = 'MEANS';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Volume m3'
WHERE code = 'NSQ' AND subcode = 'M3FN';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Volume m3'
WHERE code = 'NSQ' AND subcode = 'M3MO';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Volume m3'
WHERE code = 'NSQ' AND subcode = 'M3WK';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Reference of PF site above which take occurs',
    param_2_label = 'Percentage e.g. 50%'
WHERE code = 'PTAK' AND subcode = 'PCENT';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Name of reference site',
    param_2_label = 'Rate l/s'
WHERE code = 'RAT' AND subcode = 'LPS';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Name of reference site',
    param_2_label = 'Rate m3/d'
WHERE code = 'RAT' AND subcode = 'M3D';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Name of reference site',
    param_2_label = 'Rate m3/month'
WHERE code = 'RAT' AND subcode = 'M3M';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Name of reference site',
    param_2_label = 'Rate m3/s'
WHERE code = 'RAT' AND subcode = 'M3S';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Start date',
    param_2_label = 'End date'
WHERE code = 'S57' AND subcode = 'BANI';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Start date',
    param_2_label = 'End date'
WHERE code = 'S57' AND subcode = 'BANP';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Effective date of licence plus 12 years',
    param_2_label = 'Minimum abstraction quantity'
WHERE code = 'TLTD' AND subcode = 'MINQ';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Self destruct date',
    param_2_label = 'Indication whether whole or part licence expires'
WHERE code = 'TLTD' AND subcode = 'SD';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Variation end date'
WHERE code = 'TLTD' AND subcode = 'VAR';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'From',
    param_2_label = 'To'
WHERE code = 'TRA' AND subcode = 'TRAN';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Name of reference site',
    param_2_label = 'Level (mODN) or (mBD)'
WHERE code = 'WLM' AND subcode = 'GW';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Name of reference site',
    param_2_label = 'Level (mODN) or (mBD)'
WHERE code = 'WLM' AND subcode = 'SW';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Name of reference site',
    param_2_label = 'Full chemical name e.g. ''Manganese'' not ''Mn'''
WHERE code = 'WQM' AND subcode = 'GW';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Name of reference site',
    param_2_label = 'Full chemical name e.g. ''Manganese'' not ''Mn'''
WHERE code = 'WQM' AND subcode = 'SW';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Donor / recipient licence number',
    param_2_label = 'Grid reference and local name'
WHERE code = 'WRT' AND subcode = 'PNT';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Donor / recipient licence number',
    param_2_label = 'Purpose code and description'
WHERE code = 'WRT' AND subcode = 'PUR';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'Donor / recipient licence number',
    param_2_label = 'Volume m3'
WHERE code = 'WRT' AND subcode = 'QTY';

UPDATE water.licence_version_purpose_condition_types
SET param_1_label = 'National grid reference of appropriate abstraction point',
    param_2_label = 'Other region'
WHERE code = 'XREG' AND subcode = 'PTS';

COMMIT;
