drop table if exists "water"."scheduled_notification";

CREATE TABLE "water"."scheduled_notification" (
  "id" varchar,
  "recipient" varchar,
  "message_type" varchar,
  "message_ref" varchar,
	"personalisation" jsonb,
  "send_after" timestamp(0),
  "status" varchar,
  "log" varchar
)
;


ALTER TABLE "water"."scheduled_notification" ADD CONSTRAINT "scheduled_notification_pkey" PRIMARY KEY ("id");


delete from "water"."scheduler";
INSERT INTO "water"."scheduler"( "task_type", "licence_ref", "task_config", "next_run", "last_run", "log", "status", "running", "date_created", "date_updated") VALUES ( 'scheduleRenewalEmails', '-', '{"count":"60","period":"minute"}', '2018-03-07 09:06:35', '2018-02-14 13:06:35', '{"error":null}', NULL, 0, '2018-02-13 12:44:54', '2018-02-13 12:44:54');
INSERT INTO "water"."scheduler"( "task_type", "licence_ref", "task_config", "next_run", "last_run", "log", "status", "running", "date_created", "date_updated") VALUES ( 'sendScheduledNotifications', '-', '{"count":"30","period":"second"}', '2018-02-14 13:59:05', '2018-02-14 13:58:35', '{"error":null}', NULL, 0, '2018-02-14 11:05:48', '2018-02-14 11:05:48');
INSERT INTO "water"."scheduler"( "task_type", "licence_ref", "task_config", "next_run", "last_run", "log", "status", "running", "date_created", "date_updated") VALUES ( 'import', '-', '{"count":"1","period":"minute"}', '2018-02-14 13:17:28', '2018-02-14 13:16:28', '{"error":null}', NULL, 1, '2018-02-08 08:54:34', '2018-02-08 08:54:34');


DROP TABLE IF EXISTS "notify_templates";
CREATE TABLE "notify_templates" (
  "message_ref" varchar NOT NULL,
  "template_id" varchar NOT NULL,
  "notes" varchar ,
  "notify_key" varchar
)
;

-- ----------------------------
-- Primary Key structure for table notify_templates
-- ----------------------------
ALTER TABLE "notify_templates" ADD CONSTRAINT "notify_templates_pkey" PRIMARY KEY ("message_ref");
INSERT INTO "water"."notify_templates"("message_ref", "template_id", "notes", "notify_key") VALUES ('share_new_user', '145e2919-da41-4f4d-9570-17f5bb12f119', NULL, 'livewaterabstraction-2232718f-fc58-4413-9e41-135496648da7-42fdc373-c22d-4ce6-a006-a9c7070a97d2');
INSERT INTO "water"."notify_templates"("message_ref", "template_id", "notes", "notify_key") VALUES ('share_existing_user', '725e399e-772b-4c91-835b-68f4995ab6ff', NULL, 'livewaterabstraction-2232718f-fc58-4413-9e41-135496648da7-42fdc373-c22d-4ce6-a006-a9c7070a97d2');
INSERT INTO "water"."notify_templates"("message_ref", "template_id", "notes", "notify_key") VALUES ('security_code_letter', 'd48d29cc-ed03-4a01-b496-5cce90beb889', NULL, 'livewaterabstraction-2232718f-fc58-4413-9e41-135496648da7-42fdc373-c22d-4ce6-a006-a9c7070a97d2');
INSERT INTO "water"."notify_templates"("message_ref", "template_id", "notes", "notify_key") VALUES ('existing_user_verification_email', 'd9654596-a533-47e9-aa27-2cf869c6aa13', NULL, 'livewaterabstraction-2232718f-fc58-4413-9e41-135496648da7-42fdc373-c22d-4ce6-a006-a9c7070a97d2');
INSERT INTO "water"."notify_templates"("message_ref", "template_id", "notes", "notify_key") VALUES ('new_user_verification_email', '3d25b496-abbd-49bb-b943-016019082988', NULL, 'livewaterabstraction-2232718f-fc58-4413-9e41-135496648da7-42fdc373-c22d-4ce6-a006-a9c7070a97d2');
INSERT INTO "water"."notify_templates"("message_ref", "template_id", "notes", "notify_key") VALUES ('password_locked_email', '985907b6-8930-4985-9d27-17369b07e22a', NULL, 'livewaterabstraction-2232718f-fc58-4413-9e41-135496648da7-42fdc373-c22d-4ce6-a006-a9c7070a97d2');
INSERT INTO "water"."notify_templates"("message_ref", "template_id", "notes", "notify_key") VALUES ('password_reset_email', 'a699123a-fa28-4938-8d64-5729a36f4437', NULL, 'livewaterabstraction-2232718f-fc58-4413-9e41-135496648da7-42fdc373-c22d-4ce6-a006-a9c7070a97d2');
INSERT INTO "water"."notify_templates"("message_ref", "template_id", "notes", "notify_key") VALUES ('expiry_notification_email', '03772305-d22a-41f8-b643-7b982af549af', NULL, 'whitelistwaterabstraction-2232718f-fc58-4413-9e41-135496648da7-92e8ed20-9ae2-4420-a297-90fb9717ca29');
