/*
  https://eaflood.atlassian.net/browse/WATER-5410

  This is actually related to our work on dynamic due dates. In the future, due dates will be set against return logs
  when we get confirmation from Notify that the related notification was successful.

  However, we should only be doing this for specific notice and contact types.

  What we've realised is that the logic we have for this is faulty, because it only has the `messageRef` to go on. For
  example, in an ad-hoc notice, you can add a 'single-use' recipient. Because we need to set something for
  `message_ref`, we've opted to use `returns_invitation_primary_user` for email contacts and
  `returns_invitation_letter-holder` for letter contacts. These were legacy values used when it handled notices.

  But now we've lost the knowledge that this was a single-use contact, not the licence holder or primary user. Plus, we
  are applying due dates to a return log because it's a successful 'returns invitation'.

  Ideally, the two values should be separate; we are sending a **returns invitation** to the **primary user**, or a
  **paper return** to a **single-use** contact. Then, decisions like which notifications determine whether due dates are
  applied become much easier to implement.

  In this change, we are going to start making this distinct and clear.

  - A new field `contact_type` will be added to `water.scheduled_notification`
  - A new migration to populate this from existing information
  - In the same migration, update `message_ref` to contain only the notice type

  As [water-abstraction-system](https://github.com/DEFRA/water-abstraction-system) now handles everything to do with
  abstraction alert and returns notices, we're ignoring how this change affects legacy functionality (beyond fixing any
  broken unit tests).
*/

-- 1. Add an updated_at column - this is long overdue for notifications!
ALTER TABLE water.scheduled_notification ADD updated_at timestamptz DEFAULT CURRENT_TIMESTAMP;
UPDATE water.scheduled_notification sn SET updated_at = date_created;

-- 2. Add the new column
ALTER TABLE water.scheduled_notification ADD COLUMN contact_type TEXT DEFAULT NULL;

-- 3. Fill in missing template ID's where possible
UPDATE water.scheduled_notification sn SET template_id = '4fe80aed-c5dd-44c3-9044-d0289d635019', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_invitation_licence_holder_letter';
UPDATE water.scheduled_notification sn SET template_id = '4fe80aed-c5dd-44c3-9044-d0289d635019', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_invitation_licence_holder_letter_control';
UPDATE water.scheduled_notification sn SET template_id = '4a3bcd84-053e-4ce7-a66b-401f534fa0da', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_invitation_licence_holder_letter_formality';
UPDATE water.scheduled_notification sn SET template_id = '9a85085a-fcf3-4c0d-b6d6-925409433126', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_invitation_licence_holder_letter_moral_suasion';
UPDATE water.scheduled_notification sn SET template_id = '7fe2267d-0263-47a5-bbf2-620543d2764e', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_invitation_licence_holder_letter_social_norm';

UPDATE water.scheduled_notification sn SET template_id = '0e535549-99a2-44a9-84a7-589b12d00879', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_invitation_returns_to_letter';
UPDATE water.scheduled_notification sn SET template_id = '0e535549-99a2-44a9-84a7-589b12d00879', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_invitation_returns_to_letter_control';
UPDATE water.scheduled_notification sn SET template_id = '9c82e205-9566-4327-bebb-35c6ff9dead9', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_invitation_returns_to_letter_formality';
UPDATE water.scheduled_notification sn SET template_id = '505a785f-ee05-48c3-8b1b-0d0031d5ea72', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_invitation_returns_to_letter_moral_suasion';
UPDATE water.scheduled_notification sn SET template_id = '237fbb49-ce48-4338-a876-2d56d96dd3a0', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_invitation_returns_to_letter_social_norm';

UPDATE water.scheduled_notification sn SET template_id = '2fa7fc83-4df1-4f52-bccf-ff0faeb12b6f', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_invitation_primary_user_email';
UPDATE water.scheduled_notification sn SET template_id = '2fa7fc83-4df1-4f52-bccf-ff0faeb12b6f', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_invitation_primary_user_email_control';
UPDATE water.scheduled_notification sn SET template_id = '37da0d9f-5254-43c5-a3d2-abc4e91994b5', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_invitation_primary_user_email_formality';
UPDATE water.scheduled_notification sn SET template_id = 'a4bf8001-cc25-4e66-a40f-a5ca735ac69f', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_invitation_primary_user_email_moral_suasion';
UPDATE water.scheduled_notification sn SET template_id = '4176ec3b-ffcd-4085-8972-aaa5902ba7a8', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_invitation_primary_user_email_social_norm';

UPDATE water.scheduled_notification sn SET template_id = '41c45bd4-8225-4d7e-a175-b48b613b5510', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_invitation_returns_agent_email';
UPDATE water.scheduled_notification sn SET template_id = '41c45bd4-8225-4d7e-a175-b48b613b5510', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_invitation_returns_agent_email_control';
UPDATE water.scheduled_notification sn SET template_id = '40e1691d-ddbe-4f41-badf-13690b33e258', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_invitation_returns_agent_email_formality';
UPDATE water.scheduled_notification sn SET template_id = 'd4566779-67d8-4ce0-be07-014ed774d9d2', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_invitation_returns_agent_email_moral_suasion';
UPDATE water.scheduled_notification sn SET template_id = 'edb920ea-cc10-4764-ae07-16822cb9075c', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_invitation_returns_agent_email_social_norm';

UPDATE water.scheduled_notification sn SET template_id = 'c01c808b-094b-4a3a-ab9f-a6e86bad36ba', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_reminder_licence_holder_letter';
UPDATE water.scheduled_notification sn SET template_id = '25831f1e-9c9c-4e28-b0f3-97da5941fe9b', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_reminder_licence_holder_letter_active_choice';
UPDATE water.scheduled_notification sn SET template_id = 'c01c808b-094b-4a3a-ab9f-a6e86bad36ba', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_reminder_licence_holder_letter_control';
UPDATE water.scheduled_notification sn SET template_id = 'e1fa5bb4-3c8d-4358-acac-aabb42fc198e', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_reminder_licence_holder_letter_enforcement_action';
UPDATE water.scheduled_notification sn SET template_id = '5c9f369e-5bc7-4ef7-8b1c-efea86d76d66', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_reminder_licence_holder_letter_loss_aversion';

UPDATE water.scheduled_notification sn SET template_id = 'e9f132c7-a550-4e18-a5c1-78375f07aa2d', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_reminder_returns_to_letter';
UPDATE water.scheduled_notification sn SET template_id = '826140d7-562e-4d49-8bf8-37cc298a6661', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_reminder_returns_to_letter_active_choice';
UPDATE water.scheduled_notification sn SET template_id = 'e9f132c7-a550-4e18-a5c1-78375f07aa2d', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_reminder_returns_to_letter_control';
UPDATE water.scheduled_notification sn SET template_id = '3e788afa-bc7d-4fa8-b7da-32472b5d0f55', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_reminder_returns_to_letter_enforcement_action';
UPDATE water.scheduled_notification sn SET template_id = 'f80bfa93-8afa-4aef-8f87-ec64d1cb5a58', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_reminder_returns_to_letter_loss_aversion';

UPDATE water.scheduled_notification sn SET template_id = 'f1144bc7-8bdc-4e82-87cb-1a6c69445836', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_reminder_primary_user_email';
UPDATE water.scheduled_notification sn SET template_id = '0b856cf8-b76d-4f12-8085-e57900f34557', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_reminder_primary_user_email_active_choice';
UPDATE water.scheduled_notification sn SET template_id = 'f1144bc7-8bdc-4e82-87cb-1a6c69445836', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_reminder_primary_user_email_control';
UPDATE water.scheduled_notification sn SET template_id = '6bdd8ec1-49b8-4da3-af8d-07a806d4e436', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_reminder_primary_user_email_enforcement_action';
UPDATE water.scheduled_notification sn SET template_id = '71425894-deb2-40db-bb49-cc408d888bff', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_reminder_primary_user_email_loss_aversion';

UPDATE water.scheduled_notification sn SET template_id = '038e1807-d1b5-4f09-a5a6-d7eee9030a7a', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_reminder_returns_agent_email';
UPDATE water.scheduled_notification sn SET template_id = '6de9e5b3-f35e-441a-8314-50b6c04ab3b4', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_reminder_returns_agent_email_active_choice';
UPDATE water.scheduled_notification sn SET template_id = '038e1807-d1b5-4f09-a5a6-d7eee9030a7a', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_reminder_returns_agent_email_control';
UPDATE water.scheduled_notification sn SET template_id = '8ed028f7-7179-4274-91d9-a27988b9be70', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_reminder_returns_agent_email_enforcement_action';
UPDATE water.scheduled_notification sn SET template_id = 'a10f019a-9ae8-46fa-abaf-eb8adbad4563', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'returns_reminder_returns_agent_email_loss_aversion';

UPDATE water.scheduled_notification sn SET template_id = 'fafe7d77-7710-46c8-b870-3b5c1e3816d2', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'water_abstraction_alert_reduce';
UPDATE water.scheduled_notification sn SET template_id = 'd94bf110-b173-4f77-8e9a-cf7b4f95dc00', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'water_abstraction_alert_reduce_email';

UPDATE water.scheduled_notification sn SET template_id = '2d81eaa7-0c34-463b-8ac2-5ff37d5bd800', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'water_abstraction_alert_reduce_or_stop';
UPDATE water.scheduled_notification sn SET template_id = '4ebf29e1-f819-4d88-b7e4-ee47df302b9a', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'water_abstraction_alert_reduce_or_stop_email';

UPDATE water.scheduled_notification sn SET template_id = '8c77274f-6a61-46a5-82d8-66863320d608', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'water_abstraction_alert_reduce_or_stop_warning';
UPDATE water.scheduled_notification sn SET template_id = 'bf32327a-f170-4854-8abb-3068aee9cdec', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'water_abstraction_alert_reduce_or_stop_warning_email';

UPDATE water.scheduled_notification sn SET template_id = '27499bbd-e854-4f13-884e-30e0894526b6', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'water_abstraction_alert_reduce_warning';
UPDATE water.scheduled_notification sn SET template_id = '6ec7265d-8ebb-4217-a62b-9bf0216f8c9f', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'water_abstraction_alert_reduce_warning_email';

UPDATE water.scheduled_notification sn SET template_id = 'ba6b11ad-41fc-4054-87eb-7e9a168ceec2', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'water_abstraction_alert_resume';
UPDATE water.scheduled_notification sn SET template_id = '5eae5e5b-4f9a-4e2e-8d1e-c8d083533fbf', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'water_abstraction_alert_resume_email';

UPDATE water.scheduled_notification sn SET template_id = 'c2635893-0dd7-4fff-a152-774707e2175e', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'water_abstraction_alert_stop';
UPDATE water.scheduled_notification sn SET template_id = 'd7468ba1-ac65-42c4-9785-8998f9c34e01', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'water_abstraction_alert_stop_email';

UPDATE water.scheduled_notification sn SET template_id = '7ab10c86-2c23-4376-8c72-9419e7f982bb', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'water_abstraction_alert_stop_warning';
UPDATE water.scheduled_notification sn SET template_id = 'a51ace39-3224-4c18-bbb8-c803a6da9a21', updated_at = NOW() WHERE sn.template_id IS NULL AND sn.message_ref = 'water_abstraction_alert_stop_warning_email';

-- 3. Extract and populate contact_type from message_ref, then update message ref to be consistent and clearer
-- We can't do this for all notifications because not all message_refs encode both the notice and contact type. We also
-- do one message_ref at a time to make it easier to follow, plus reverse it for the down query.

-- Paper returns don't encode the contact type. We use this opportunity to use a reference that matches how the notice
-- is referred to in the service
UPDATE water.scheduled_notification sn SET message_ref = 'paper return', updated_at = NOW() WHERE sn.message_ref = 'pdf.return_form';
UPDATE water.scheduled_notification sn SET message_ref = 'paper reminder', updated_at = NOW() WHERE sn.message_ref = 'pdf.return_reminder';

-- Handle ad-hoc returns notices first. We have used the same message ref across standard and ad-hoc, till now. But we
-- can use the template ID to differentiate them in this query.
-- When the contact type was 'single use' in the journey, we used the message ref for licence holder and primary user
-- depending on whether it was a letter or an email. This means we cannot be certain for these notifications it was the
-- licensee. To play it safe, we set them to single use.
UPDATE water.scheduled_notification sn SET message_ref = 'returns invitation ad-hoc', contact_type = 'single use', updated_at = NOW() WHERE sn.template_id = '4b47cf1c-043c-4a0c-8659-5be06cb2b860';
UPDATE water.scheduled_notification sn SET message_ref = 'returns invitation ad-hoc', contact_type = 'returns to', updated_at = NOW() WHERE sn.template_id = '73b4c395-4423-4976-8ab4-c82e2cb6beee';
UPDATE water.scheduled_notification sn SET message_ref = 'returns invitation ad-hoc', contact_type = 'single use', updated_at = NOW() WHERE sn.template_id = '7bb89469-1dbc-458a-9526-fad8ab71285f';
UPDATE water.scheduled_notification sn SET message_ref = 'returns invitation ad-hoc', contact_type = 'returns agent', updated_at = NOW() WHERE sn.template_id = 'cbc4efe2-f3b5-4642-8f6d-3532df73ee94';

UPDATE water.scheduled_notification sn SET message_ref = 'returns reminder ad-hoc', contact_type = 'single use', updated_at = NOW() WHERE sn.template_id = '62224316-35c4-4b02-98c2-81332817f3dc';
UPDATE water.scheduled_notification sn SET message_ref = 'returns reminder ad-hoc', contact_type = 'returns to', updated_at = NOW() WHERE sn.template_id = 'eca3e1d0-a8a6-4eb1-b166-23891fe3a9e5';
UPDATE water.scheduled_notification sn SET message_ref = 'returns reminder ad-hoc', contact_type = 'single use', updated_at = NOW() WHERE sn.template_id = '87dceeb3-aa2b-4ff5-aff9-97755a71532b';
UPDATE water.scheduled_notification sn SET message_ref = 'returns reminder ad-hoc', contact_type = 'returns agent', updated_at = NOW() WHERE sn.template_id = 'c8076bbd-7d93-4743-81b3-755a5c5f1d50';

-- Handle the standard returns notices
UPDATE water.scheduled_notification sn SET message_ref = 'returns invitation', contact_type = 'licence holder', updated_at = NOW() WHERE sn.message_ref = 'returns_invitation_licence_holder_letter';
UPDATE water.scheduled_notification sn SET message_ref = 'returns invitation', contact_type = 'licence holder', updated_at = NOW() WHERE sn.message_ref = 'returns_invitation_licence_holder_letter_control';
UPDATE water.scheduled_notification sn SET message_ref = 'returns invitation', contact_type = 'licence holder', updated_at = NOW() WHERE sn.message_ref = 'returns_invitation_licence_holder_letter_formality';
UPDATE water.scheduled_notification sn SET message_ref = 'returns invitation', contact_type = 'licence holder', updated_at = NOW() WHERE sn.message_ref = 'returns_invitation_licence_holder_letter_moral_suasion';
UPDATE water.scheduled_notification sn SET message_ref = 'returns invitation', contact_type = 'licence holder', updated_at = NOW() WHERE sn.message_ref = 'returns_invitation_licence_holder_letter_social_norm';

UPDATE water.scheduled_notification sn SET message_ref = 'returns invitation', contact_type = 'returns to', updated_at = NOW() WHERE sn.message_ref = 'returns_invitation_returns_to_letter';
UPDATE water.scheduled_notification sn SET message_ref = 'returns invitation', contact_type = 'returns to', updated_at = NOW() WHERE sn.message_ref = 'returns_invitation_returns_to_letter_control';
UPDATE water.scheduled_notification sn SET message_ref = 'returns invitation', contact_type = 'returns to', updated_at = NOW() WHERE sn.message_ref = 'returns_invitation_returns_to_letter_formality';
UPDATE water.scheduled_notification sn SET message_ref = 'returns invitation', contact_type = 'returns to', updated_at = NOW() WHERE sn.message_ref = 'returns_invitation_returns_to_letter_moral_suasion';
UPDATE water.scheduled_notification sn SET message_ref = 'returns invitation', contact_type = 'returns to', updated_at = NOW() WHERE sn.message_ref = 'returns_invitation_returns_to_letter_social_norm';

UPDATE water.scheduled_notification sn SET message_ref = 'returns invitation', contact_type = 'primary user', updated_at = NOW() WHERE sn.message_ref = 'returns_invitation_primary_user_email';
UPDATE water.scheduled_notification sn SET message_ref = 'returns invitation', contact_type = 'primary user', updated_at = NOW() WHERE sn.message_ref = 'returns_invitation_primary_user_email_control';
UPDATE water.scheduled_notification sn SET message_ref = 'returns invitation', contact_type = 'primary user', updated_at = NOW() WHERE sn.message_ref = 'returns_invitation_primary_user_email_formality';
UPDATE water.scheduled_notification sn SET message_ref = 'returns invitation', contact_type = 'primary user', updated_at = NOW() WHERE sn.message_ref = 'returns_invitation_primary_user_email_moral_suasion';
UPDATE water.scheduled_notification sn SET message_ref = 'returns invitation', contact_type = 'primary user', updated_at = NOW() WHERE sn.message_ref = 'returns_invitation_primary_user_email_social_norm';

UPDATE water.scheduled_notification sn SET message_ref = 'returns invitation', contact_type = 'returns agent', updated_at = NOW() WHERE sn.message_ref = 'returns_invitation_returns_agent_email';
UPDATE water.scheduled_notification sn SET message_ref = 'returns invitation', contact_type = 'returns agent', updated_at = NOW() WHERE sn.message_ref = 'returns_invitation_returns_agent_email_control';
UPDATE water.scheduled_notification sn SET message_ref = 'returns invitation', contact_type = 'returns agent', updated_at = NOW() WHERE sn.message_ref = 'returns_invitation_returns_agent_email_formality';
UPDATE water.scheduled_notification sn SET message_ref = 'returns invitation', contact_type = 'returns agent', updated_at = NOW() WHERE sn.message_ref = 'returns_invitation_returns_agent_email_moral_suasion';
UPDATE water.scheduled_notification sn SET message_ref = 'returns invitation', contact_type = 'returns agent', updated_at = NOW() WHERE sn.message_ref = 'returns_invitation_returns_agent_email_social_norm';

UPDATE water.scheduled_notification sn SET message_ref = 'returns reminder', contact_type = 'licence holder', updated_at = NOW() WHERE sn.message_ref = 'returns_reminder_licence_holder_letter';
UPDATE water.scheduled_notification sn SET message_ref = 'returns reminder', contact_type = 'licence holder', updated_at = NOW() WHERE sn.message_ref = 'returns_reminder_licence_holder_letter_active_choice';
UPDATE water.scheduled_notification sn SET message_ref = 'returns reminder', contact_type = 'licence holder', updated_at = NOW() WHERE sn.message_ref = 'returns_reminder_licence_holder_letter_control';
UPDATE water.scheduled_notification sn SET message_ref = 'returns reminder', contact_type = 'licence holder', updated_at = NOW() WHERE sn.message_ref = 'returns_reminder_licence_holder_letter_enforcement_action';
UPDATE water.scheduled_notification sn SET message_ref = 'returns reminder', contact_type = 'licence holder', updated_at = NOW() WHERE sn.message_ref = 'returns_reminder_licence_holder_letter_loss_aversion';

UPDATE water.scheduled_notification sn SET message_ref = 'returns reminder', contact_type = 'returns to', updated_at = NOW() WHERE sn.message_ref = 'returns_reminder_returns_to_letter';
UPDATE water.scheduled_notification sn SET message_ref = 'returns reminder', contact_type = 'returns to', updated_at = NOW() WHERE sn.message_ref = 'returns_reminder_returns_to_letter_active_choice';
UPDATE water.scheduled_notification sn SET message_ref = 'returns reminder', contact_type = 'returns to', updated_at = NOW() WHERE sn.message_ref = 'returns_reminder_returns_to_letter_control';
UPDATE water.scheduled_notification sn SET message_ref = 'returns reminder', contact_type = 'returns to', updated_at = NOW() WHERE sn.message_ref = 'returns_reminder_returns_to_letter_enforcement_action';
UPDATE water.scheduled_notification sn SET message_ref = 'returns reminder', contact_type = 'returns to', updated_at = NOW() WHERE sn.message_ref = 'returns_reminder_returns_to_letter_loss_aversion';

UPDATE water.scheduled_notification sn SET message_ref = 'returns reminder', contact_type = 'primary user', updated_at = NOW() WHERE sn.message_ref = 'returns_reminder_primary_user_email';
UPDATE water.scheduled_notification sn SET message_ref = 'returns reminder', contact_type = 'primary user', updated_at = NOW() WHERE sn.message_ref = 'returns_reminder_primary_user_email_active_choice';
UPDATE water.scheduled_notification sn SET message_ref = 'returns reminder', contact_type = 'primary user', updated_at = NOW() WHERE sn.message_ref = 'returns_reminder_primary_user_email_control';
UPDATE water.scheduled_notification sn SET message_ref = 'returns reminder', contact_type = 'primary user', updated_at = NOW() WHERE sn.message_ref = 'returns_reminder_primary_user_email_enforcement_action';
UPDATE water.scheduled_notification sn SET message_ref = 'returns reminder', contact_type = 'primary user', updated_at = NOW() WHERE sn.message_ref = 'returns_reminder_primary_user_email_loss_aversion';

UPDATE water.scheduled_notification sn SET message_ref = 'returns reminder', contact_type = 'returns agent', updated_at = NOW() WHERE sn.message_ref = 'returns_reminder_returns_agent_email';
UPDATE water.scheduled_notification sn SET message_ref = 'returns reminder', contact_type = 'returns agent', updated_at = NOW() WHERE sn.message_ref = 'returns_reminder_returns_agent_email_active_choice';
UPDATE water.scheduled_notification sn SET message_ref = 'returns reminder', contact_type = 'returns agent', updated_at = NOW() WHERE sn.message_ref = 'returns_reminder_returns_agent_email_control';
UPDATE water.scheduled_notification sn SET message_ref = 'returns reminder', contact_type = 'returns agent', updated_at = NOW() WHERE sn.message_ref = 'returns_reminder_returns_agent_email_enforcement_action';
UPDATE water.scheduled_notification sn SET message_ref = 'returns reminder', contact_type = 'returns agent', updated_at = NOW() WHERE sn.message_ref = 'returns_reminder_returns_agent_email_loss_aversion';

-- In production this shouldn't apply as this migration shipped the same time as automatic sending of returns
-- invitations. But during development we changed what we were setting the message_ref too. So, this just covers all
-- bases if run in other environments before then.
UPDATE water.scheduled_notification sn SET message_ref = 'returns invitation failed', contact_type = 'licence holder', updated_at = NOW() WHERE sn.message_ref = 'failed_invitation_licence_holder_letter';
UPDATE water.scheduled_notification sn SET message_ref = 'returns invitation failed', contact_type = 'licence holder', updated_at = NOW() WHERE sn.template_id = '791ba6a9-e821-4df6-b49f-4ab3bb15248f';

-- Abstraction alerts don't encode the contact type. We use this opportunity to use to remove duplication in the message
-- ref and to adopt the pattern we've adopted above
UPDATE water.scheduled_notification sn SET message_ref = 'abstraction alert reduce', updated_at = NOW() WHERE sn.message_ref = 'water_abstraction_alert_reduce';
UPDATE water.scheduled_notification sn SET message_ref = 'abstraction alert reduce', updated_at = NOW() WHERE sn.message_ref = 'water_abstraction_alert_reduce_email';

UPDATE water.scheduled_notification sn SET message_ref = 'abstraction alert reduce or stop', updated_at = NOW() WHERE sn.message_ref = 'water_abstraction_alert_reduce_or_stop';
UPDATE water.scheduled_notification sn SET message_ref = 'abstraction alert reduce or stop', updated_at = NOW() WHERE sn.message_ref = 'water_abstraction_alert_reduce_or_stop_email';

UPDATE water.scheduled_notification sn SET message_ref = 'abstraction alert reduce or stop warning', updated_at = NOW() WHERE sn.message_ref = 'water_abstraction_alert_reduce_or_stop_warning';
UPDATE water.scheduled_notification sn SET message_ref = 'abstraction alert reduce or stop warning', updated_at = NOW() WHERE sn.message_ref = 'water_abstraction_alert_reduce_or_stop_warning_email';

UPDATE water.scheduled_notification sn SET message_ref = 'abstraction alert reduce warning', updated_at = NOW() WHERE sn.message_ref = 'water_abstraction_alert_reduce_warning';
UPDATE water.scheduled_notification sn SET message_ref = 'abstraction alert reduce warning', updated_at = NOW() WHERE sn.message_ref = 'water_abstraction_alert_reduce_warning_email';

UPDATE water.scheduled_notification sn SET message_ref = 'abstraction alert resume', updated_at = NOW() WHERE sn.message_ref = 'water_abstraction_alert_resume';
UPDATE water.scheduled_notification sn SET message_ref = 'abstraction alert resume', updated_at = NOW() WHERE sn.message_ref = 'water_abstraction_alert_resume_email';

UPDATE water.scheduled_notification sn SET message_ref = 'abstraction alert stop', updated_at = NOW() WHERE sn.message_ref = 'water_abstraction_alert_stop';
UPDATE water.scheduled_notification sn SET message_ref = 'abstraction alert stop', updated_at = NOW() WHERE sn.message_ref = 'water_abstraction_alert_stop_email';

UPDATE water.scheduled_notification sn SET message_ref = 'abstraction alert stop warning', updated_at = NOW() WHERE sn.message_ref = 'water_abstraction_alert_stop_warning';
UPDATE water.scheduled_notification sn SET message_ref = 'abstraction alert stop warning', updated_at = NOW() WHERE sn.message_ref = 'water_abstraction_alert_stop_warning_email';
