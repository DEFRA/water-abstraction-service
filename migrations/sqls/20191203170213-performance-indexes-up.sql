create index scheduled_notification_idx_send_after on water.scheduled_notification(send_after);

create index pending_import_idx_status_priority on water.pending_import(status, priority);
