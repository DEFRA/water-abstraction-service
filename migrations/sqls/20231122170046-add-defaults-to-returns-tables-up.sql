ALTER TABLE returns.returns ALTER COLUMN regime SET DEFAULT 'water';

ALTER TABLE returns.returns ALTER COLUMN licence_type SET DEFAULT 'abstraction';

ALTER TABLE returns.lines ALTER COLUMN substance SET DEFAULT 'water';

ALTER TABLE returns.lines ALTER COLUMN unit SET DEFAULT 'm³';
