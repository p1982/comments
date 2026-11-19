CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP,
  full_name varchar(100) NOT NULL,
  email varchar(255) NOT NULL,
  password_hash varchar(255),
  homepage varchar(500)
);

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP,
  user_id uuid NOT NULL REFERENCES users(id),
  parent_id uuid,
  root_id uuid NOT NULL,
  text text NOT NULL
);

CREATE TABLE IF NOT EXISTS attachments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP,
  comment_id uuid NOT NULL REFERENCES comments(id),
  file_name varchar(255) NOT NULL,
  file_type varchar(50) NOT NULL,
  mime_type varchar(50) NOT NULL,
  file_size integer NOT NULL,
  storage_key varchar(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS outbox_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  aggregate_type varchar(255) NOT NULL,
  aggregated_id uuid NOT NULL,
  event_type varchar(100) NOT NULL,
  payload jsonb NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  error_message varchar(100),
  processed_at TIMESTAMP
);
