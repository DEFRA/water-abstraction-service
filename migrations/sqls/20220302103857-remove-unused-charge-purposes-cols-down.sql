ALTER table water.charge_purposes add column IF NOT EXISTS season water.charge_element_season;

ALTER table water.charge_purposes add column IF NOT EXISTS source water.charge_element_source;

ALTER table water.charge_purposes add column IF NOT EXISTS season_derived water.charge_element_season;
