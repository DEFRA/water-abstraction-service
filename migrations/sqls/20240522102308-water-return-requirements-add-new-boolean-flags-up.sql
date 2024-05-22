ALTER TABLE water.return_requirements
  ADD gravity_fill bool NOT NULL DEFAULT false,
  ADD reabstraction bool NOT NULL DEFAULT false,
  ADD two_part_tariff bool NOT NULL DEFAULT false,
  ADD fixty_six_exception bool NOT NULL DEFAULT false;
