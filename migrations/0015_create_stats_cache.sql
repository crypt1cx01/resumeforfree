-- Reuse the existing counters table for dashboard totals so the admin
-- dashboard reads O(1) rows instead of running COUNT(*) on every load.
-- Scope: increment-only INSERT triggers. Deletes and status changes are NOT
-- tracked here; `newMessages` stays as a live query.

INSERT OR IGNORE INTO counters (name, count) VALUES ('users', (SELECT COUNT(*) FROM users));
INSERT OR IGNORE INTO counters (name, count) VALUES ('resumes', (SELECT COUNT(*) FROM resumes));
INSERT OR IGNORE INTO counters (name, count) VALUES ('contact_messages', (SELECT COUNT(*) FROM contact_messages));

CREATE TRIGGER IF NOT EXISTS counters_users_insert
AFTER INSERT ON users
BEGIN
    UPDATE counters SET count = count + 1, updated_at = CURRENT_TIMESTAMP WHERE name = 'users';
END;

CREATE TRIGGER IF NOT EXISTS counters_resumes_insert
AFTER INSERT ON resumes
BEGIN
    UPDATE counters SET count = count + 1, updated_at = CURRENT_TIMESTAMP WHERE name = 'resumes';
END;

CREATE TRIGGER IF NOT EXISTS counters_contact_messages_insert
AFTER INSERT ON contact_messages
BEGIN
    UPDATE counters SET count = count + 1, updated_at = CURRENT_TIMESTAMP WHERE name = 'contact_messages';
END;
