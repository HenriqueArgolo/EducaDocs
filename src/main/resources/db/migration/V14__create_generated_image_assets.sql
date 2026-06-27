CREATE TABLE generated_image_assets (
    id BIGSERIAL PRIMARY KEY,
    cache_key VARCHAR(64) NOT NULL UNIQUE,
    subject VARCHAR(500) NOT NULL,
    prompt TEXT NOT NULL,
    model VARCHAR(100) NOT NULL,
    mime_type VARCHAR(50) NOT NULL,
    image_data BYTEA NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_generated_image_assets_subject ON generated_image_assets(subject);

