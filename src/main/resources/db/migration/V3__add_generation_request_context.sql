ALTER TABLE generation_requests
    ADD COLUMN grade VARCHAR(120),
    ADD COLUMN subject VARCHAR(180),
    ADD COLUMN duration VARCHAR(80);
