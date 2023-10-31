UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_invitation_letter') WHERE category_value = 'returns.invitations';

UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_invitation_licence_holder_letter_formality') WHERE category_value = 'returns.invitations';
UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_invitation_licence_holder_letter_control') WHERE category_value = 'returns.invitations';
UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_invitation_licence_holder_letter_moral_suasion') WHERE category_value = 'returns.invitations';
UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_invitation_licence_holder_letter_social_norm') WHERE category_value = 'returns.invitations';

UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_invitation_primary_user_email_formality') WHERE category_value = 'returns.invitations';
UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_invitation_primary_user_email_control') WHERE category_value = 'returns.invitations';
UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_invitation_primary_user_email_moral_suasion') WHERE category_value = 'returns.invitations';
UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_invitation_primary_user_email_social_norm') WHERE category_value = 'returns.invitations';

UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_invitation_returns_agent_email_formality') WHERE category_value = 'returns.invitations';
UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_invitation_returns_agent_email_control') WHERE category_value = 'returns.invitations';
UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_invitation_returns_agent_email_moral_suasion') WHERE category_value = 'returns.invitations';
UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_invitation_returns_agent_email_social_norm') WHERE category_value = 'returns.invitations';

UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_invitation_returns_to_letter_formality') WHERE category_value = 'returns.invitations';
UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_invitation_returns_to_letter_control') WHERE category_value = 'returns.invitations';
UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_invitation_returns_to_letter_moral_suasion') WHERE category_value = 'returns.invitations';
UPDATE water.scheduled_notification_categories SET scheduled_notification_refs = array_append(scheduled_notification_refs, 'returns_invitation_returns_to_letter_social_norm') WHERE category_value = 'returns.invitations';
