/*
 Navicat PostgreSQL Data Transfer

 Source Server         : local
 Source Server Type    : PostgreSQL
 Source Server Version : 90603
 Source Host           : localhost:5432
 Source Catalog        : permits
 Source Schema         : water

 Target Server Type    : PostgreSQL
 Target Server Version : 90603
 File Encoding         : 65001

 Date: 19/01/2018 12:20:58
*/


-- ----------------------------
-- Table structure for notify_templates
-- ----------------------------
DROP TABLE IF EXISTS "notify_templates";
CREATE TABLE "notify_templates" (
  "message_ref" varchar COLLATE "pg_catalog"."default" NOT NULL,
  "template_id" varchar COLLATE "pg_catalog"."default" NOT NULL,
  "notes" varchar COLLATE "pg_catalog"."default"
)
;
ALTER TABLE "notify_templates" OWNER TO "postgres";

-- ----------------------------
-- Records of notify_templates
-- ----------------------------
BEGIN;
INSERT INTO "notify_templates" VALUES ('password_reset_email', 'a699123a-fa28-4938-8d64-5729a36f4437', NULL);
INSERT INTO "notify_templates" VALUES ('password_locked_email', '985907b6-8930-4985-9d27-17369b07e22a', NULL);
INSERT INTO "notify_templates" VALUES ('new_user_verification_email', '3d25b496-abbd-49bb-b943-016019082988', NULL);
INSERT INTO "notify_templates" VALUES ('existing_user_verification_email', 'd9654596-a533-47e9-aa27-2cf869c6aa13', NULL);
INSERT INTO "notify_templates" VALUES ('security_code_letter', 'd48d29cc-ed03-4a01-b496-5cce90beb889', NULL);
INSERT INTO "notify_templates" VALUES ('share_existing_user', '725e399e-772b-4c91-835b-68f4995ab6ff', NULL);
INSERT INTO "notify_templates" VALUES ('share_new_user', '145e2919-da41-4f4d-9570-17f5bb12f119', NULL);
COMMIT;

-- ----------------------------
-- Primary Key structure for table notify_templates
-- ----------------------------
ALTER TABLE "notify_templates" ADD CONSTRAINT "notify_templates_pkey" PRIMARY KEY ("message_ref");
