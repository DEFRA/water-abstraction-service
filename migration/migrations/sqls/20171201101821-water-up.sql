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

 Date: 01/12/2017 10:17:51
*/

set schema 'water';

-- ----------------------------
-- Table structure for config
-- ----------------------------
DROP TABLE IF EXISTS "config";
CREATE TABLE "config" (
  "config_item" varchar COLLATE "pg_catalog"."default" NOT NULL,
  "config_value" varchar COLLATE "pg_catalog"."default"
)
;


-- ----------------------------
-- Primary Key structure for table config
-- ----------------------------
ALTER TABLE "config" ADD CONSTRAINT "config_pkey" PRIMARY KEY ("config_item");
