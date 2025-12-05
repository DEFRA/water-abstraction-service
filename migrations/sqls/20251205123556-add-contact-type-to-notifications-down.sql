/* Revert our changes */

-- Paper forms
UPDATE water.scheduled_notification sn SET message_ref = 'pdf.return_form' WHERE sn.message_ref = 'paper return';
UPDATE water.scheduled_notification sn SET message_ref = 'pdf.return_reminder' WHERE sn.message_ref = 'paper reminder';

-- Standard returns notices
UPDATE water.scheduled_notification sn SET message_ref = 'returns_invitation_licence_holder_letter' WHERE sn.template_id = '4fe80aed-c5dd-44c3-9044-d0289d635019';
UPDATE water.scheduled_notification sn SET message_ref = 'returns_invitation_licence_holder_letter_formality' WHERE sn.template_id = '4a3bcd84-053e-4ce7-a66b-401f534fa0da';
UPDATE water.scheduled_notification sn SET message_ref = 'returns_invitation_licence_holder_letter_moral_suasion' WHERE sn.template_id = '9a85085a-fcf3-4c0d-b6d6-925409433126';
UPDATE water.scheduled_notification sn SET message_ref = 'returns_invitation_licence_holder_letter_social_norm' WHERE sn.template_id = '7fe2267d-0263-47a5-bbf2-620543d2764e';

UPDATE water.scheduled_notification sn SET message_ref = 'returns_invitation_returns_to_letter' WHERE sn.template_id = '0e535549-99a2-44a9-84a7-589b12d00879';
UPDATE water.scheduled_notification sn SET message_ref = 'returns_invitation_returns_to_letter_formality' WHERE sn.template_id = '9c82e205-9566-4327-bebb-35c6ff9dead9';
UPDATE water.scheduled_notification sn SET message_ref = 'returns_invitation_returns_to_letter_moral_suasion' WHERE sn.template_id = '505a785f-ee05-48c3-8b1b-0d0031d5ea72';
UPDATE water.scheduled_notification sn SET message_ref = 'returns_invitation_returns_to_letter_social_norm' WHERE sn.template_id = '237fbb49-ce48-4338-a876-2d56d96dd3a0';

UPDATE water.scheduled_notification sn SET message_ref = 'returns_invitation_primary_user_email' WHERE sn.template_id = '2fa7fc83-4df1-4f52-bccf-ff0faeb12b6f';
UPDATE water.scheduled_notification sn SET message_ref = 'returns_invitation_primary_user_email_formality' WHERE sn.template_id = '37da0d9f-5254-43c5-a3d2-abc4e91994b5';
UPDATE water.scheduled_notification sn SET message_ref = 'returns_invitation_primary_user_email_moral_suasion' WHERE sn.template_id = 'a4bf8001-cc25-4e66-a40f-a5ca735ac69f';
UPDATE water.scheduled_notification sn SET message_ref = 'returns_invitation_primary_user_email_social_norm' WHERE sn.template_id = '4176ec3b-ffcd-4085-8972-aaa5902ba7a8';

UPDATE water.scheduled_notification sn SET message_ref = 'returns_invitation_returns_agent_email' WHERE sn.template_id = '41c45bd4-8225-4d7e-a175-b48b613b5510';
UPDATE water.scheduled_notification sn SET message_ref = 'returns_invitation_returns_agent_email_formality' WHERE sn.template_id = '40e1691d-ddbe-4f41-badf-13690b33e258';
UPDATE water.scheduled_notification sn SET message_ref = 'returns_invitation_returns_agent_email_moral_suasion' WHERE sn.template_id = 'd4566779-67d8-4ce0-be07-014ed774d9d2';
UPDATE water.scheduled_notification sn SET message_ref = 'returns_invitation_returns_agent_email_social_norm' WHERE sn.template_id = 'edb920ea-cc10-4764-ae07-16822cb9075c';

UPDATE water.scheduled_notification sn SET message_ref = 'returns_reminder_licence_holder_letter' WHERE sn.template_id = 'c01c808b-094b-4a3a-ab9f-a6e86bad36ba';
UPDATE water.scheduled_notification sn SET message_ref = 'returns_reminder_licence_holder_letter_active_choice' WHERE sn.template_id = '25831f1e-9c9c-4e28-b0f3-97da5941fe9b';
UPDATE water.scheduled_notification sn SET message_ref = 'returns_reminder_licence_holder_letter_enforcement_action' WHERE sn.template_id = 'e1fa5bb4-3c8d-4358-acac-aabb42fc198e';
UPDATE water.scheduled_notification sn SET message_ref = 'returns_reminder_licence_holder_letter_loss_aversion' WHERE sn.template_id = '5c9f369e-5bc7-4ef7-8b1c-efea86d76d66';

UPDATE water.scheduled_notification sn SET message_ref = 'returns_reminder_returns_to_letter' WHERE sn.template_id = 'e9f132c7-a550-4e18-a5c1-78375f07aa2d';
UPDATE water.scheduled_notification sn SET message_ref = 'returns_reminder_returns_to_letter_active_choice' WHERE sn.template_id = '826140d7-562e-4d49-8bf8-37cc298a6661';
UPDATE water.scheduled_notification sn SET message_ref = 'returns_reminder_returns_to_letter_enforcement_action' WHERE sn.template_id = '3e788afa-bc7d-4fa8-b7da-32472b5d0f55';
UPDATE water.scheduled_notification sn SET message_ref = 'returns_reminder_returns_to_letter_loss_aversion' WHERE sn.template_id = 'f80bfa93-8afa-4aef-8f87-ec64d1cb5a58';

UPDATE water.scheduled_notification sn SET message_ref = 'returns_reminder_primary_user_email' WHERE sn.template_id = 'f1144bc7-8bdc-4e82-87cb-1a6c69445836';
UPDATE water.scheduled_notification sn SET message_ref = 'returns_reminder_primary_user_email_active_choice' WHERE sn.template_id = '0b856cf8-b76d-4f12-8085-e57900f34557';
UPDATE water.scheduled_notification sn SET message_ref = 'returns_reminder_primary_user_email_enforcement_action' WHERE sn.template_id = '6bdd8ec1-49b8-4da3-af8d-07a806d4e436';
UPDATE water.scheduled_notification sn SET message_ref = 'returns_reminder_primary_user_email_loss_aversion' WHERE sn.template_id = '71425894-deb2-40db-bb49-cc408d888bff';

UPDATE water.scheduled_notification sn SET message_ref = 'returns_reminder_returns_agent_email' WHERE sn.template_id = '038e1807-d1b5-4f09-a5a6-d7eee9030a7a';
UPDATE water.scheduled_notification sn SET message_ref = 'returns_reminder_returns_agent_email_active_choice' WHERE sn.template_id = '6de9e5b3-f35e-441a-8314-50b6c04ab3b4';
UPDATE water.scheduled_notification sn SET message_ref = 'returns_reminder_returns_agent_email_enforcement_action' WHERE sn.template_id = '8ed028f7-7179-4274-91d9-a27988b9be70';
UPDATE water.scheduled_notification sn SET message_ref = 'returns_reminder_returns_agent_email_loss_aversion' WHERE sn.template_id = 'a10f019a-9ae8-46fa-abaf-eb8adbad4563';

-- Ad-hoc template IDs
UPDATE water.scheduled_notification sn SET message_ref = 'returns_invitation_licence_holder_letter' WHERE sn.template_id = '4b47cf1c-043c-4a0c-8659-5be06cb2b860';
UPDATE water.scheduled_notification sn SET message_ref = 'returns_invitation_returns_to_letter' WHERE sn.template_id = '73b4c395-4423-4976-8ab4-c82e2cb6beee';
UPDATE water.scheduled_notification sn SET message_ref = 'returns_invitation_primary_user_email' WHERE sn.template_id = '7bb89469-1dbc-458a-9526-fad8ab71285f';
UPDATE water.scheduled_notification sn SET message_ref = 'returns_invitation_returns_agent_email' WHERE sn.template_id = 'cbc4efe2-f3b5-4642-8f6d-3532df73ee94';

UPDATE water.scheduled_notification sn SET message_ref = 'returns_reminder_licence_holder_letter' WHERE sn.template_id = '62224316-35c4-4b02-98c2-81332817f3dc';
UPDATE water.scheduled_notification sn SET message_ref = 'returns_reminder_returns_to_letter' WHERE sn.template_id = 'eca3e1d0-a8a6-4eb1-b166-23891fe3a9e5';
UPDATE water.scheduled_notification sn SET message_ref = 'returns_reminder_primary_user_email' WHERE sn.template_id = '87dceeb3-aa2b-4ff5-aff9-97755a71532b';
UPDATE water.scheduled_notification sn SET message_ref = 'returns_reminder_returns_agent_email' WHERE sn.template_id = 'c8076bbd-7d93-4743-81b3-755a5c5f1d50';

-- Failed invitation
UPDATE water.scheduled_notification sn SET message_ref = 'failed_invitation_licence_holder_letter' WHERE sn.template_id = '791ba6a9-e821-4df6-b49f-4ab3bb15248f';

-- Abstraction alerts
UPDATE water.scheduled_notification sn SET message_ref = 'water_abstraction_alert_reduce' WHERE sn.template_id = 'fafe7d77-7710-46c8-b870-3b5c1e3816d2';
UPDATE water.scheduled_notification sn SET message_ref = 'water_abstraction_alert_reduce_email' WHERE sn.template_id = 'd94bf110-b173-4f77-8e9a-cf7b4f95dc00';

UPDATE water.scheduled_notification sn SET message_ref = 'water_abstraction_alert_reduce_or_stop' WHERE sn.template_id = '2d81eaa7-0c34-463b-8ac2-5ff37d5bd800';
UPDATE water.scheduled_notification sn SET message_ref = 'water_abstraction_alert_reduce_or_stop_email' WHERE sn.template_id = '4ebf29e1-f819-4d88-b7e4-ee47df302b9a';

UPDATE water.scheduled_notification sn SET message_ref = 'water_abstraction_alert_reduce_or_stop_warning' WHERE sn.template_id = '8c77274f-6a61-46a5-82d8-66863320d608';
UPDATE water.scheduled_notification sn SET message_ref = 'water_abstraction_alert_reduce_or_stop_warning_email' WHERE sn.template_id = 'bf32327a-f170-4854-8abb-3068aee9cdec';

UPDATE water.scheduled_notification sn SET message_ref = 'water_abstraction_alert_reduce_warning' WHERE sn.template_id = '27499bbd-e854-4f13-884e-30e0894526b6';
UPDATE water.scheduled_notification sn SET message_ref = 'water_abstraction_alert_reduce_warning_email' WHERE sn.template_id = '6ec7265d-8ebb-4217-a62b-9bf0216f8c9f';

UPDATE water.scheduled_notification sn SET message_ref = 'water_abstraction_alert_resume' WHERE sn.template_id = 'ba6b11ad-41fc-4054-87eb-7e9a168ceec2';
UPDATE water.scheduled_notification sn SET message_ref = 'water_abstraction_alert_resume_email' WHERE sn.template_id = '5eae5e5b-4f9a-4e2e-8d1e-c8d083533fbf';

UPDATE water.scheduled_notification sn SET message_ref = 'water_abstraction_alert_stop' WHERE sn.template_id = 'c2635893-0dd7-4fff-a152-774707e2175e';
UPDATE water.scheduled_notification sn SET message_ref = 'water_abstraction_alert_stop_email' WHERE sn.template_id = 'd7468ba1-ac65-42c4-9785-8998f9c34e01';

UPDATE water.scheduled_notification sn SET message_ref = 'water_abstraction_alert_stop_warning' WHERE sn.template_id = '7ab10c86-2c23-4376-8c72-9419e7f982bb';
UPDATE water.scheduled_notification sn SET message_ref = 'water_abstraction_alert_stop_warning_email' WHERE sn.template_id = 'a51ace39-3224-4c18-bbb8-c803a6da9a21';

-- Drop the new columns
ALTER TABLE water.scheduled_notification DROP COLUMN updated_at;
ALTER TABLE water.scheduled_notification DROP COLUMN contact_type;
