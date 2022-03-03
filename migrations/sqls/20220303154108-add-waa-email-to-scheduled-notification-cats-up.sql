/* Replace with your SQL commands */

UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'water_abstraction_alert_resume_email') WHERE category_value = 'waa.resume';
UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'water_abstraction_alert_stop_email') WHERE category_value = 'waa.stop';
UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'water_abstraction_alert_reduce_or_stop_email') WHERE category_value = 'waa.reduce';
UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'water_abstraction_alert_reduce_email') WHERE category_value = 'waa.reduce';
UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'water_abstraction_alert_stop_warning_email') WHERE category_value = 'waa.warning';
UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'water_abstraction_alert_reduce_or_stop_warning_email') WHERE category_value = 'waa.warning';
UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'water_abstraction_alert_reduce_warning_email') WHERE category_value = 'waa.warning';
