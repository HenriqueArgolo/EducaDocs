CREATE TABLE classrooms (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    subject VARCHAR(120) NOT NULL,
    grade VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE classroom_timeline_items (
    id BIGSERIAL PRIMARY KEY,
    classroom_id BIGINT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    title VARCHAR(180) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'PLANNED', -- PLANNED, IN_PROGRESS, COMPLETED
    document_id BIGINT REFERENCES documents(id) ON DELETE SET NULL,
    activity_id BIGINT REFERENCES activity_materials(id) ON DELETE SET NULL,
    presentation_id BIGINT REFERENCES presentations(id) ON DELETE SET NULL,
    type VARCHAR(40) NOT NULL DEFAULT 'CUSTOM_EVENT', -- PLAN, SLIDES, ACTIVITY, EXAM, CUSTOM_EVENT
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_classrooms_user ON classrooms(user_id);
CREATE INDEX idx_classroom_timeline_items_classroom ON classroom_timeline_items(classroom_id);
