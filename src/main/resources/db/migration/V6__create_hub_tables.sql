CREATE TABLE activity_materials (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    description TEXT,
    type VARCHAR(40) NOT NULL, -- COLORING_BOOK, WORKSHEET, FLASHCARD, GAME
    grade VARCHAR(40) NOT NULL,
    subject VARCHAR(80) NOT NULL,
    content TEXT NOT NULL, -- JSON string containing worksheets exercises or image prompts
    thumbnail_url VARCHAR(255),
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE presentations (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    topic VARCHAR(180) NOT NULL,
    grade VARCHAR(40) NOT NULL,
    subject VARCHAR(80) NOT NULL,
    slides_json TEXT NOT NULL, -- JSON list of slides
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_materials_type ON activity_materials(type);
CREATE INDEX idx_activity_materials_grade_subject ON activity_materials(grade, subject);
CREATE INDEX idx_activity_materials_user ON activity_materials(user_id);
CREATE INDEX idx_presentations_user ON presentations(user_id);
