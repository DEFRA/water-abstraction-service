UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_reminder_licence_holder_letter_active_choice') WHERE category_value = 'returns.reminders';
UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_reminder_licence_holder_letter_control') WHERE category_value = 'returns.reminders';
UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_reminder_licence_holder_letter_enforcement_action') WHERE category_value = 'returns.reminders';
UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_reminder_licence_holder_letter_loss_aversion') WHERE category_value = 'returns.reminders';

UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_reminder_primary_user_email_active_choice') WHERE category_value = 'returns.reminders';
UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_reminder_primary_user_email_control') WHERE category_value = 'returns.reminders';
UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_reminder_primary_user_email_enforcement_action') WHERE category_value = 'returns.reminders';
UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_reminder_primary_user_email_loss_aversion') WHERE category_value = 'returns.reminders';

UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_reminder_returns_agent_email_active_choice') WHERE category_value = 'returns.reminders';
UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_reminder_returns_agent_email_control') WHERE category_value = 'returns.reminders';
UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_reminder_returns_agent_email_enforcement_action') WHERE category_value = 'returns.reminders';
UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_reminder_returns_agent_email_loss_aversion') WHERE category_value = 'returns.reminders';

UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_reminder_returns_to_letter_active_choice') WHERE category_value = 'returns.reminders';
UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_reminder_returns_to_letter_control') WHERE category_value = 'returns.reminders';
UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_reminder_returns_to_letter_enforcement_action') WHERE category_value = 'returns.reminders';
UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_reminder_returns_to_letter_loss_aversion') WHERE category_value = 'returns.reminders';

