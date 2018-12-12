/* Replace with your SQL commands */

/* Replace with your SQL commands */

CREATE TABLE "water"."ar_analysis_licences" (
  "licence_ref" varchar NOT NULL PRIMARY KEY,
  "status" varchar NOT NULL,
  "region_code" int NOT NULL,
  "start_date" timestamp without time zone NOT NULL,
  "review_date" timestamp without time zone,
  "approved_date" timestamp without time zone,
  "contact_correct" boolean NOT NULL 
);
