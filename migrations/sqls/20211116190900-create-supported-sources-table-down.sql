drop table water.billing_supported_sources;

delete from water.application_state where key = 'supported-sources-import';
