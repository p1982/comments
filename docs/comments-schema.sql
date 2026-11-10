-- MySQL 8 schema for MySQL Workbench.
-- Tables match the comments diagram: users, comments, attachments, outbox_events.
-- uuid is CHAR(36). jsonb is JSON.

CREATE DATABASE IF NOT EXISTS comments
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE comments;

CREATE TABLE users (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  homepage VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
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
  KEY idx_comments_parent_id (parent_id),
  KEY idx_comments_root_id (root_id),
  KEY idx_comments_created_at (created_at),
  KEY idx_comments_user_id (user_id),
  KEY idx_comments_root_id_created_at (root_id, created_at),
  KEY idx_comments_created_at_id (created_at DESC, id DESC),
  CONSTRAINT fk_comments_user_id
    FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_comments_parent_id
    FOREIGN KEY (parent_id) REFERENCES comments (id),
  CONSTRAINT fk_comments_root_id
    FOREIGN KEY (root_id) REFERENCES comments (id)
) ENGINE=InnoDB;

CREATE TABLE attachments (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  comment_id CHAR(36) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
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
  aggregate_id CHAR(36) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSON NOT NULL,
  attempts INT NOT NULL,
  error_message TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  KEY idx_outbox_created_at (created_at),
  KEY idx_outbox_aggregate (aggregate_type, aggregate_id)
) ENGINE=InnoDB;
