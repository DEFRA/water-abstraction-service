/* Replace with your SQL commands */

CREATE TABLE water.scheduled_notification_categories (
  category_value varchar primary key,
  category_label varchar not null,
  is_enabled boolean not null default true,
  scheduled_notification_refs varchar[]
);

INSERT INTO water.scheduled_notification_categories (category_value, category_label, is_enabled, scheduled_notification_refs)
VALUES
('legacy', 'Legacy notifications (Hands off flows and expiry notifications)', true, ARRAY ['notification_letter', 'notification_email']),
('returns_paper_forms', 'Returns: Paper form', true, ARRAY ['pdf.return_form']),
('returns.reminders', 'Returns: Reminders', true, ARRAY ['returns_reminder_licence_holder_letter',
                                                          'returns_reminder_licence_holder_letter_active_choice',
                                                          'returns_reminder_licence_holder_letter_control',
                                                          'returns_reminder_licence_holder_letter_enforcement_action',
                                                          'returns_reminder_licence_holder_letter_loss_aversion',
                                                          'returns_reminder_primary_user_email',
                                                          'returns_reminder_primary_user_email_active_choice',
                                                          'returns_reminder_primary_user_email_control',
                                                          'returns_reminder_primary_user_email_enforcement_action',
                                                          'returns_reminder_primary_user_email_loss_aversion',
                                                          'returns_reminder_returns_agent_email',
                                                          'returns_reminder_returns_agent_email_active_choice',
                                                          'returns_reminder_returns_agent_email_control',
                                                          'returns_reminder_returns_agent_email_enforcement_action',
                                                          'returns_reminder_returns_agent_email_loss_aversion',
                                                          'returns_reminder_returns_to_letter',
                                                          'returns_reminder_returns_to_letter_active_choice',
                                                          'returns_reminder_returns_to_letter_control',
                                                          'returns_reminder_returns_to_letter_enforcement_action',
                                                          'returns_reminder_returns_to_letter_loss_aversion']),
('returns.invitations', 'Returns: Invitation', true, ARRAY ['returns_invitation_letter',
                                                            'returns_invitation_licence_holder_letter',
                                                            'returns_invitation_licence_holder_letter_control',
                                                            'returns_invitation_licence_holder_letter_formality',
                                                            'returns_invitation_licence_holder_letter_moral_suasion',
                                                            'returns_invitation_licence_holder_letter_social_norm',
                                                            'returns_invitation_primary_user_email',
                                                            'returns_invitation_primary_user_email_control',
                                                            'returns_invitation_primary_user_email_formality',
                                                            'returns_invitation_primary_user_email_moral_suasion',
                                                            'returns_invitation_primary_user_email_social_norm',
                                                            'returns_invitation_returns_agent_email',
                                                            'returns_invitation_returns_agent_email_control',
                                                            'returns_invitation_returns_agent_email_formality',
                                                            'returns_invitation_returns_agent_email_moral_suasion',
                                                            'returns_invitation_returns_agent_email_social_norm',
                                                            'returns_invitation_returns_to_letter',
                                                            'returns_invitation_returns_to_letter_control',
                                                            'returns_invitation_returns_to_letter_formality',
                                                            'returns_invitation_returns_to_letter_moral_suasion',
                                                            'returns_invitation_returns_to_letter_social_norm']),
('waa.reduce', 'Water abstraction alert: Reduce', true, ARRAY ['water_abstraction_alert_reduce',
                                                            'water_abstraction_alert_reduce_or_stop']),
('waa.warning', 'Water abstraction alert: Warning', true, ARRAY ['water_abstraction_alert_reduce_warning',
                                                            'water_abstraction_alert_reduce_or_stop_warning',
                                                            'water_abstraction_alert_stop_warning']),
('waa.stop', 'Water abstraction alert: Stop', true, ARRAY ['water_abstraction_alert_stop']),
('waa.resume', 'Water abstraction alert: Resume', true, ARRAY ['water_abstraction_alert_resume']);