-- MySQL 8 DDL for MySQL Workbench (File → Run SQL Script / reverse engineer).
-- Current schema after TypeORM migrations (do not edit the start snapshot).
--
-- Start snapshot (unchanged): docs/comments-schema.sql
-- This file: docs/comments-schema-current.sql
--
-- Verified against apps/api/src/database/migrations:
--   1794313601862-migration.ts              — users, comments, attachments, outbox_events
--   1794313723207-comments-created-at-desc.ts
--   1794405058847-comments-parent-id-nullable.ts
--   1794479372905-migration.ts              — partial root indexes (Postgres; see notes)
--   1794999343771-migration.ts              — users.password_hash
--   1795200000000-outbox-nullable-columns.ts — outbox error_message / processed_at nullable
--
-- Runtime DB is PostgreSQL 16. Types below are Workbench-friendly MySQL equivalents:
--   uuid → CHAR(36), jsonb → JSON.
-- Differences vs start snapshot: full_name (not username), password_hash,
-- parent_id nullable, aggregated_id (not aggregate_id), mime_type length 50,
-- no parent/root FKs (migrations only FK user_id + attachments.comment_id).

CREATE DATABASE IF NOT EXISTS comments
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE comments;

CREATE TABLE users (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NULL,
  homepage VARCHAR(500) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  KEY idx_users_full_name (full_name),
  KEY idx_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE comments (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  parent_id CHAR(36) NULL,
  root_id CHAR(36) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  KEY idx_comments_user_id (user_id),
  KEY idx_comments_parent_id (parent_id),
  KEY idx_comments_root_id_created_at (root_id, created_at),
  KEY idx_comments_created_at_id (created_at DESC, id DESC),
  -- Postgres only (migration 1794479372905), not expressible as MySQL partial indexes:
  --   IDX_comments_roots_created_at_id (created_at DESC, id DESC)
  --     WHERE parent_id IS NULL AND deleted_at IS NULL
  --   IDX_comments_roots_user_created_at_id (user_id, created_at DESC, id DESC)
  --     WHERE parent_id IS NULL AND deleted_at IS NULL
  CONSTRAINT fk_comments_user_id
    FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE attachments (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  comment_id CHAR(36) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  file_size INT NOT NULL,
  storage_key VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  KEY idx_attachments_comment_id (comment_id),
  CONSTRAINT fk_attachments_comment_id
    FOREIGN KEY (comment_id) REFERENCES comments (id)
) ENGINE=InnoDB;

CREATE TABLE outbox_events (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  aggregate_type VARCHAR(255) NOT NULL,
  aggregated_id CHAR(36) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSON NOT NULL,
  attempts INT NOT NULL,
  error_message VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  KEY idx_outbox_aggregate (aggregate_type, aggregated_id),
  KEY idx_outbox_created_at (created_at)
) ENGINE=InnoDB;
