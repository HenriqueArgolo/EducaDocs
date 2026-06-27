DELETE FROM activity_materials WHERE content LIKE '%"isPdf":true%';
ALTER TABLE activity_materials ADD COLUMN pdf_file BYTEA;
