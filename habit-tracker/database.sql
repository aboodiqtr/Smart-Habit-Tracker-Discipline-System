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
INSERT IGNORE INTO users (name, email, role)
VALUES (
  'Admin',
  'admin@admin.ad',
  'admin'
);
-- ============================================================
-- iTrack — Database Update Script
-- Run these in MySQL Workbench (in order)
-- ============================================================

-- 1. إضافة عمود blocked لجدول المستخدمين
ALTER TABLE users 
ADD COLUMN blocked BOOLEAN DEFAULT FALSE AFTER satisfaction;

-- 2. إضافة أعمدة التتبع لجدول العادات
ALTER TABLE habits 
ADD COLUMN last_action_date DATE NULL AFTER progress;

ALTER TABLE habits 
ADD COLUMN action_type ENUM('resisted','spent') NULL AFTER last_action_date;

-- 3. إنشاء جدول الرسائل العامة
CREATE TABLE IF NOT EXISTS public_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. تحديث البيانات القديمة
UPDATE habits SET completed = FALSE, last_action_date = NULL, action_type = NULL;

CREATE TABLE IF NOT EXISTS public_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- إذا كان لديك جدول مستخدمين، يفضل إضافة مفتاح أجنبي (اختياري)
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
-- 4. Reset old habits so they work with new logic
UPDATE habits SET completed = FALSE, last_action_date = NULL, action_type = NULL;

-- Verify
SELECT 'users columns:' as info; DESCRIBE users;
SELECT 'habits columns:' as info; DESCRIBE habits;
SELECT 'public_messages:' as info; DESCRIBE public_messages;

-- 010101