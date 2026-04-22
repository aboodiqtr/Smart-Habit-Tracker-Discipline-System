 -- 1. تهيئة قاعدة البيانات
CREATE DATABASE IF NOT EXISTS discipline_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE discipline_app;

-- 2. جدول المستخدمين (تم دمج عمود blocked هنا)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- bcrypt hash
    role ENUM('user','admin') DEFAULT 'user',
    savings DECIMAL(10,2) DEFAULT 0,
    satisfaction TINYINT DEFAULT 0,
    blocked BOOLEAN DEFAULT FALSE, -- أضيف مباشرة هنا
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. جدول العادات (تم دمج أعمدة التتبع الجديدة)
CREATE TABLE IF NOT EXISTS habits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    goal VARCHAR(255) DEFAULT '',
    streak INT DEFAULT 0,
    reward DECIMAL(8,2) DEFAULT 10,
    completed BOOLEAN DEFAULT FALSE,
    progress TINYINT DEFAULT 0,
    last_action_date DATE NULL,        -- أضيف مباشرة هنا
    action_type ENUM('resisted','spent') NULL, -- أضيف مباشرة هنا
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. جدول الصداقات (علاقة مزدوجة كما في الديجرام)
CREATE TABLE IF NOT EXISTS friendships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    friend_id INT NOT NULL,
    status ENUM('pending','accepted') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_friendship (user_id, friend_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. جدول الرسائل الخاصة (علاقة مزدوجة كما في الديجرام)
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    content TEXT NOT NULL,
    iv VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. جدول الرسائل العامة
CREATE TABLE IF NOT EXISTS public_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. إضافة حساب الأدمن (مع كلمة المرور المشفرة)
-- الباسورد هنا هو: admin1234
INSERT IGNORE INTO users (name, email, role)
VALUES (
    'Admin',
    'admin@admin.ad',
    'admin'
);