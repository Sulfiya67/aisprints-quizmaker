CREATE TABLE mcqs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  question TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mcqs_user_id ON mcqs(user_id);
CREATE INDEX idx_mcqs_updated_at ON mcqs(updated_at);

CREATE TABLE mcq_choices (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  mcq_id TEXT NOT NULL REFERENCES mcqs(id) ON DELETE CASCADE,
  choice_text TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0 CHECK (is_correct IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mcq_choices_mcq_id ON mcq_choices(mcq_id);

CREATE TABLE mcq_attempts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  mcq_id TEXT NOT NULL REFERENCES mcqs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  selected_choice_id TEXT NOT NULL REFERENCES mcq_choices(id) ON DELETE CASCADE,
  is_correct INTEGER NOT NULL CHECK (is_correct IN (0, 1)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mcq_attempts_mcq_id ON mcq_attempts(mcq_id);
CREATE INDEX idx_mcq_attempts_user_id ON mcq_attempts(user_id);
