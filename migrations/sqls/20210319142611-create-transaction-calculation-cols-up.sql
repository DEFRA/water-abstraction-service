ALTER TABLE water.billing_transactions
    ADD COLUMN calc_source_factor NUMERIC,
    ADD COLUMN calc_season_factor NUMERIC,
    ADD COLUMN calc_loss_factor NUMERIC,
    ADD COLUMN calc_suc_factor NUMERIC,
    ADD COLUMN calc_s_126_factor NUMERIC,
    ADD COLUMN calc_s_127_factor NUMERIC,
    ADD COLUMN calc_eiuc_factor NUMERIC,
    ADD COLUMN calc_eiuc_source_factor NUMERIC;
