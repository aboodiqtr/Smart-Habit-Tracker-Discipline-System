import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import CryptoJS from "crypto-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const http = createServer(app);
const io = new Server(http, { 
  cors: { 
    origin: "*", // اسمح لجميع المصادر بالاتصال بالـ Socket
    methods: ["GET", "POST"]
  } 
});

app.use(cors({ origin: "*" }));
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "discipline_secret_key_2024";
const AES_KEY    = process.env.AES_KEY    || "discipline_aes_key_32chars_here!";

const db = await mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  // هذا الجزء ضروري جداً لـ Aiven
  ssl: {
    rejectUnauthorized: false // يسمح بالاتصال عبر SSL بدون ملف الشهادة يدوياً
  },
  waitForConnections: true,
  connectionLimit: 10,
});

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: "Invalid token" }); }
}

function adminMiddleware(req, res, next) {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
  next();
}

function encryptMsg(text) {
  const iv = CryptoJS.lib.WordArray.random(16).toString();
  const encrypted = CryptoJS.AES.encrypt(text, CryptoJS.enc.Utf8.parse(AES_KEY), {
    iv: CryptoJS.enc.Hex.parse(iv), mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7,
  }).toString();
  return { encrypted, iv };
}

function decryptMsg(encrypted, iv) {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, CryptoJS.enc.Utf8.parse(AES_KEY), {
      iv: CryptoJS.enc.Hex.parse(iv), mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7,
    });
    return bytes.toString(CryptoJS.enc.Utf8) || "[Decryption error]";
  } catch { return "[Unreadable]"; }
}

function todayStr() { return new Date().toISOString().split('T')[0]; }

function formatHabit(h) {
  const today = todayStr();
  const lastDate = h.last_action_date ? new Date(h.last_action_date).toISOString().split('T')[0] : null;
  return { ...h, last_action_date: lastDate, actedToday: lastDate === today };
}

// AUTH
app.post("/api/auth/check-email", async (req, res) => {
  const [rows] = await db.query("SELECT id FROM users WHERE email = ?", [req.body.email]);
  res.json({ exists: rows.length > 0 });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  if (!rows.length) return res.status(404).json({ error: "Email not found" });
  if (rows[0].blocked) return res.status(403).json({ error: "Your account has been blocked. Contact support." });
  const valid = await bcrypt.compare(password, rows[0].password);
  if (!valid) return res.status(401).json({ error: "Wrong password" });
  const token = jwt.sign({ id: rows[0].id, email, role: rows[0].role, name: rows[0].name }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: rows[0].id, name: rows[0].name, email, role: rows[0].role } });
});

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
  if (existing.length) return res.status(409).json({ error: "Email already exists" });
  const hashed = await bcrypt.hash(password, 10);
  const [result] = await db.query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [name, email, hashed]);
  const token = jwt.sign({ id: result.insertId, email, role: "user", name }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: result.insertId, name, email, role: "user" } });
});

// USER
app.get("/api/me", authMiddleware, async (req, res) => {
  const [users] = await db.query("SELECT id, name, email, role, savings, satisfaction FROM users WHERE id = ?", [req.user.id]);
  const [habits] = await db.query("SELECT * FROM habits WHERE user_id = ?", [req.user.id]);
  res.json({ ...users[0], habits: habits.map(formatHabit) });
});

app.patch("/api/me/satisfaction", authMiddleware, async (req, res) => {
  const { score } = req.body;
  await db.query("UPDATE users SET satisfaction = ? WHERE id = ?", [score, req.user.id]);
  res.json({ ok: true });
});

// HABITS — reward = daily_cost
// resisted today → savings += daily_cost, streak++
// spent today    → no savings, streak resets to 0

app.post("/api/habits", authMiddleware, async (req, res) => {
  const { name, goal, daily_cost, habit_type } = req.body;
  const type = habit_type === "non_spendable" ? "non_spendable" : "spendable";
  const [result] = await db.query(
    "INSERT INTO habits (user_id, name, goal, reward, habit_type) VALUES (?, ?, ?, ?, ?)",
    [req.user.id, name.trim(), goal?.trim() || "", type === "spendable" ? (Number(daily_cost) || 10) : 0, type]
  );
  const [rows] = await db.query("SELECT * FROM habits WHERE id = ?", [result.insertId]);
  res.json(formatHabit(rows[0]));
});

app.patch("/api/habits/:id/action", authMiddleware, async (req, res) => {
  const { type } = req.body;
  if (!['resisted', 'spent', 'did', 'didnt'].includes(type)) return res.status(400).json({ error: "Invalid type" });

  const [rows] = await db.query("SELECT * FROM habits WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
  if (!rows.length) return res.status(404).json({ error: "Not found" });
  const habit = rows[0];

  const today = todayStr();
  const lastDate = habit.last_action_date ? new Date(habit.last_action_date).toISOString().split('T')[0] : null;
  if (lastDate === today) return res.status(400).json({ error: "Already acted today" });

  const isPositive = type === 'resisted' || type === 'did';
  const newStreak   = isPositive ? habit.streak + 1 : 0;
  const newProgress = isPositive ? Math.min(100, habit.progress + 20) : Math.max(0, habit.progress - 5);
  const savedAmount = type === 'resisted' ? Number(habit.reward || 0) : 0;

  await db.query(
    "UPDATE habits SET streak = ?, progress = ?, last_action_date = ?, action_type = ? WHERE id = ?",
    [newStreak, newProgress, today, type, habit.id]
  );

  if (savedAmount > 0) {
    await db.query("UPDATE users SET savings = savings + ? WHERE id = ?", [savedAmount, req.user.id]);
  }

  res.json({ ok: true, newStreak, newProgress, savedAmount, actionType: type });
});

app.delete("/api/habits/:id", authMiddleware, async (req, res) => {
  await db.query("DELETE FROM habits WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
  res.json({ ok: true });
});

// FRIENDS
app.get("/api/users/search", authMiddleware, async (req, res) => {
  const q = `%${req.query.q || ""}%`;
  const [rows] = await db.query(
    "SELECT id, name, email FROM users WHERE (name LIKE ? OR email LIKE ?) AND id != ? AND role != 'admin' AND (blocked IS NULL OR blocked = 0)",
    [q, q, req.user.id]
  );
  res.json(rows);
});

app.post("/api/friends/request", authMiddleware, async (req, res) => {
  await db.query("INSERT IGNORE INTO friendships (user_id, friend_id) VALUES (?, ?)", [req.user.id, req.body.friendId]);
  res.json({ ok: true });
});

app.patch("/api/friends/:id/accept", authMiddleware, async (req, res) => {
  await db.query("UPDATE friendships SET status = 'accepted' WHERE friend_id = ? AND user_id = ?", [req.user.id, req.params.id]);
  await db.query("INSERT IGNORE INTO friendships (user_id, friend_id, status) VALUES (?, ?, 'accepted')", [req.user.id, req.params.id]);
  res.json({ ok: true });
});

app.get("/api/friends", authMiddleware, async (req, res) => {
  const [rows] = await db.query(
    `SELECT u.id, u.name, u.email, u.savings, f.status FROM friendships f JOIN users u ON u.id = f.friend_id WHERE f.user_id = ?`,
    [req.user.id]
  );
  res.json(rows);
});

app.get("/api/friends/pending", authMiddleware, async (req, res) => {
  const [rows] = await db.query(
    `SELECT u.id, u.name, u.email FROM friendships f JOIN users u ON u.id = f.user_id WHERE f.friend_id = ? AND f.status = 'pending'`,
    [req.user.id]
  );
  res.json(rows);
});

// PRIVATE MESSAGES
app.get("/api/messages/:friendId", authMiddleware, async (req, res) => {
  const [rows] = await db.query(
    `SELECT m.*, u.name as sender_name FROM messages m JOIN users u ON u.id = m.sender_id
     WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
     ORDER BY m.created_at ASC`,
    [req.user.id, req.params.friendId, req.params.friendId, req.user.id]
  );
  res.json(rows.map(m => ({ ...m, content: decryptMsg(m.content, m.iv) })));
});

// PUBLIC CHAT
app.get("/api/public-messages", authMiddleware, async (req, res) => {
  const [rows] = await db.query(
    `SELECT pm.id, pm.sender_id, pm.content, pm.created_at, u.name as sender_name, u.role as sender_role
     FROM public_messages pm JOIN users u ON u.id = pm.sender_id
     ORDER BY pm.created_at ASC LIMIT 200`
  );
  res.json(rows);
});

app.delete("/api/admin/public-messages/:id", authMiddleware, adminMiddleware, async (req, res) => {
  await db.query("DELETE FROM public_messages WHERE id = ?", [req.params.id]);
  io.emit("public_message_deleted", { id: parseInt(req.params.id) });
  res.json({ ok: true });
});

// ADMIN
app.get("/api/admin/users", authMiddleware, adminMiddleware, async (req, res) => {
  const [users] = await db.query(
    "SELECT id, name, email, savings, satisfaction, created_at, blocked FROM users WHERE role = 'user'"
  );
  const result = await Promise.all(users.map(async u => {
    const [habits] = await db.query("SELECT * FROM habits WHERE user_id = ?", [u.id]);
    return { ...u, habits: habits.map(formatHabit) };
  }));
  res.json(result);
});

app.delete("/api/admin/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
  await db.query("DELETE FROM users WHERE id = ? AND role != 'admin'", [req.params.id]);
  res.json({ ok: true });
});

app.patch("/api/admin/users/:id/block", authMiddleware, adminMiddleware, async (req, res) => {
  const { blocked } = req.body;
  await db.query("UPDATE users SET blocked = ? WHERE id = ? AND role != 'admin'", [blocked ? 1 : 0, req.params.id]);
  if (blocked) {
    const socketId = [...onlineUsers.entries()].find(([uid]) => uid === parseInt(req.params.id))?.[1];
    if (socketId) io.to(socketId).emit("account_blocked");
  }
  res.json({ ok: true });
});

// SOCKET
const onlineUsers = new Map();

io.use((socket, next) => {
  try { socket.user = jwt.verify(socket.handshake.auth.token, JWT_SECRET); next(); }
  catch { next(new Error("Unauthorized")); }
});

io.on("connection", (socket) => {
  socket.join(socket.user.id.toString());
  onlineUsers.set(socket.user.id, socket.id);
  io.emit("online_users", [...onlineUsers.keys()]);

  socket.on("send_message", async ({ receiverId, text }) => {
    const { encrypted, iv } = encryptMsg(text);
    const [result] = await db.query(
      "INSERT INTO messages (sender_id, receiver_id, content, iv) VALUES (?, ?, ?, ?)",
      [socket.user.id, receiverId, encrypted, iv]
    );
    const msg = { id: result.insertId, sender_id: socket.user.id, receiver_id: receiverId, content: text, sender_name: socket.user.name, created_at: new Date() };
    socket.emit("new_message", msg);
    const receiverSocket = onlineUsers.get(parseInt(receiverId));
    if (receiverSocket) io.to(receiverSocket).emit("new_message", msg);
  });

  socket.on("send_public_message", async ({ text }) => {
    if (!text?.trim()) return;
    const content = text.trim().substring(0, 500);
    const [result] = await db.query(
      "INSERT INTO public_messages (sender_id, content) VALUES (?, ?)",
      [socket.user.id, content]
    );
    const msg = { id: result.insertId, sender_id: socket.user.id, sender_name: socket.user.name, sender_role: socket.user.role, content, created_at: new Date() };
    io.emit("new_public_message", msg);
  });

  socket.on("disconnect", () => {
    onlineUsers.delete(socket.user.id);
    io.emit("online_users", [...onlineUsers.keys()]);
  });
});

// http.listen(3001, () => console.log("✅ iTrack Server running on http://localhost:3001"));
// أضف '0.0.0.0' لتجعل السيرفر متاحاً لأي جهاز في الشبكة (مثل هاتفك)
const PORT = process.env.PORT;
http.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ iTrack Server running on http://0.0.0.0:${PORT}`);
});