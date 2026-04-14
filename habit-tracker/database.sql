-- =====================================================
-- Smart Discipline App — MySQL Schema
-- =====================================================

CREATE DATABASE IF NOT EXISTS discipline_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE discipline_app;

-- ── Users ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100)        NOT NULL,
  email      VARCHAR(150) UNIQUE NOT NULL,
  password   VARCHAR(255)        NOT NULL,  -- bcrypt hash
  role       ENUM('user','admin') DEFAULT 'user',
  savings    DECIMAL(10,2)       DEFAULT 0,
  satisfaction TINYINT           DEFAULT 0,
  created_at TIMESTAMP           DEFAULT CURRENT_TIMESTAMP
);

-- ── Habits ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS habits (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT          NOT NULL,
  name       VARCHAR(150) NOT NULL,
  goal       VARCHAR(255) DEFAULT '',
  streak     INT          DEFAULT 0,
  reward     DECIMAL(8,2) DEFAULT 10,
  completed  BOOLEAN      DEFAULT FALSE,
  progress   TINYINT      DEFAULT 0,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Friendships ────────────────────────────────────
CREATE TABLE IF NOT EXISTS friendships (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  friend_id  INT NOT NULL,
  status     ENUM('pending','accepted') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_friendship (user_id, friend_id),
  FOREIGN KEY (user_id)   REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Messages (encrypted) ───────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  sender_id    INT  NOT NULL,
  receiver_id  INT  NOT NULL,
  content      TEXT NOT NULL,   -- AES encrypted
  iv           VARCHAR(64) NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id)   REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Admin account (password: admin1234) ────────────
INSERT IGNORE INTO users (name, email, password, role)
VALUES (
  'Admin',
  'admin@admin.ad',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin1234
  'admin'
);