CREATE TABLE lesson_kits (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    source_document_id BIGINT NOT NULL REFERENCES documents(id),
    title VARCHAR(180) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_lesson_kits_source UNIQUE (source_document_id)
);

CREATE TABLE lesson_kit_materials (
    id BIGSERIAL PRIMARY KEY,
    lesson_kit_id BIGINT NOT NULL REFERENCES lesson_kits(id) ON DELETE CASCADE,
    type VARCHAR(40) NOT NULL,
    status VARCHAR(20) NOT NULL,
    content TEXT NOT NULL DEFAULT '{}',
    generation_error VARCHAR(500),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_lesson_kit_material_type UNIQUE (lesson_kit_id, type)
);

CREATE INDEX idx_lesson_kits_user_created ON lesson_kits(user_id, created_at DESC);
CREATE INDEX idx_lesson_kit_materials_kit ON lesson_kit_materials(lesson_kit_id);
