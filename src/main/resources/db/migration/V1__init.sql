CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bncc_skills (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    subject VARCHAR(80) NOT NULL,
    grade VARCHAR(40) NOT NULL
);

CREATE TABLE generation_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    document_type VARCHAR(40) NOT NULL,
    topic VARCHAR(180) NOT NULL,
    additional_instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE generation_request_bncc_skill_ids (
    generation_request_id BIGINT NOT NULL REFERENCES generation_requests(id) ON DELETE CASCADE,
    bncc_skill_id BIGINT NOT NULL
);

CREATE TABLE documents (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    generation_request_id BIGINT REFERENCES generation_requests(id),
    type VARCHAR(40) NOT NULL,
    title VARCHAR(180) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE daily_usage (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    usage_date DATE NOT NULL,
    generation_count INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT uk_daily_usage_user_date UNIQUE (user_id, usage_date)
);

CREATE INDEX idx_bncc_grade_subject ON bncc_skills(grade, subject);
CREATE INDEX idx_bncc_code ON bncc_skills(code);
CREATE INDEX idx_documents_user_created ON documents(user_id, created_at DESC);
CREATE INDEX idx_generation_requests_user_created ON generation_requests(user_id, created_at DESC);
