/* Replace with your SQL commands */
CREATE TABLE water.change_reasons (
  change_reason_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  description varchar not null,
  position integer,
  date_created timestamp not null,
  date_updated timestamp
);

INSERT INTO water.change_reasons
  (description, position, date_created)
  VALUES
  ('Major change', 0, NOW()),
  ('Minor change', 1, NOW()),
  ('Succession or transfer of licence', 2, NOW()),
  ('Succession to a remainder licence or licence apportionment', 3, NOW()),
  ('New special agreement', 4, NOW()),
  ('Change to a special agreement', 5, NOW()),
  ('New licence in part succession or licence apportionment', 6, NOW()),
  ('New licence', 7, NOW()),
  ('Licence holder name or address change', 8, NOW()),
  ('Licence transferred and now chargeable', 9, NOW()),
  ('Billing contact change', 10, NOW()),
  ('Limited extension of licence validity (LEV)', 11, NOW()),
  ('Charge information cancelled before licence expiry date', 12, NOW());
