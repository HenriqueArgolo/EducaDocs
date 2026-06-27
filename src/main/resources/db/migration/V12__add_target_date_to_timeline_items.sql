ALTER TABLE classroom_timeline_items ADD COLUMN target_date TIMESTAMPTZ;
UPDATE classroom_timeline_items SET target_date = created_at;
