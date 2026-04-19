-- Drop the role column and its index from users. The admin worker runs in a
-- separate deployment with its own admin_users table, so the main DB no longer
-- has the concept of privilege tiers on users.
DROP INDEX IF EXISTS idx_users_role;
ALTER TABLE users DROP COLUMN role;
