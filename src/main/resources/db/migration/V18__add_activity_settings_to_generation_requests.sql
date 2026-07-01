ALTER TABLE generation_requests ADD COLUMN activity_count INTEGER;
ALTER TABLE generation_requests ADD COLUMN exercises_per_activity INTEGER;
ALTER TABLE generation_requests ADD COLUMN activity_format VARCHAR(30);
ALTER TABLE generation_requests ADD COLUMN activity_purpose VARCHAR(30);
ALTER TABLE generation_requests ADD COLUMN activity_difficulty VARCHAR(30);
ALTER TABLE generation_requests ADD COLUMN activity_modality VARCHAR(30);
