INSERT INTO water.application_state (application_state_id, key, data, date_created, date_updated)
VALUES ('59ea3257-7123-4077-a391-d3cf7867fb84', 'gauging-stations-import', '{"etag": "etag-will-be-populated-here-after-first-download"}', NOW(), NOW()) ON CONFLICT DO NOTHING;
