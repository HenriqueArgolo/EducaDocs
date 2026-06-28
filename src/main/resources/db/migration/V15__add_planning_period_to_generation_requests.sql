ALTER TABLE generation_requests
    ADD COLUMN planning_period VARCHAR(20) NOT NULL DEFAULT 'SINGLE';
