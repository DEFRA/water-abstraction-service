ALTER TABLE water.scheduled_notification
    ADD notification_type numeric null,
    ADD job_id varchar null,
    ADD UNIQUE (job_id);
