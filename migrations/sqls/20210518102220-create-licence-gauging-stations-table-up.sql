CREATE TYPE water.licence_gauging_stations_sources as enum ('wrls', 'digitise');
CREATE TYPE water.water_abstraction_restriction_type as enum ('flow', 'level');
CREATE TYPE water.water_abstraction_restriction_status as enum ('warning', 'reduce', 'stop', 'resume');

CREATE TABLE IF NOT EXISTS water.licence_gauging_stations (
    licence_gauging_station_id uuid PRIMARY KEY DEFAULT public.gen_random_uuid(),
    licence_id uuid not null references licences(licence_id),
    gauging_station_id uuid not null references gauging_stations(gauging_station_id),
    source licence_gauging_stations_sources NOT NULL,
    licence_version_purpose_condition_id uuid references licence_version_purpose_conditions(licence_version_purpose_condition_id),
    abstraction_period_start_day smallint,
    abstraction_period_start_month smallint,
    abstraction_period_end_day smallint,
    abstraction_period_end_month smallint,
    restriction_type water_abstraction_restriction_type NOT NULL,
    threshold_unit varchar NOT NULL,
    threshold_value numeric NOT NULL,
    status water_abstraction_restriction_status NOT NULL DEFAULT 'resume',
    date_status_updated timestamp not null,
    date_created timestamp not null,
    date_updated timestamp not null,
    date_deleted timestamp default null
);
