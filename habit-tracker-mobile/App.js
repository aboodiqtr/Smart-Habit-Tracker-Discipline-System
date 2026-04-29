import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, Modal, Dimensions,
  ActivityIndicator, StatusBar, FlatList
} from "react-native";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import {
  TrendingUp, Smile, Plus, Home, Users, LogOut, Globe, ShieldCheck,
  Search, X, BarChart2, Zap, Eye, EyeOff, User, AlertCircle, Heart,
  Send, UserPlus, MessageCircle, Trash2, CheckCircle, Trophy, Ban, Shield
} from "lucide-react-native";
import { io } from "socket.io-client";

// ── CONFIG ──────────────────────────────────────────────────────────────────
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const API_BASE = "https://pushing-blighted-esteemed.ngrok-free.dev"; // ← Replace with your ngrok URL
const API = `${API_BASE}/api`;

// ── COLORS ──────────────────────────────────────────────────────────────────
const C = {
  primary: "#6366f1",
  light: "#818cf8",
  bg: "#f5f5fb",
  card: "white",
  border: "#efefff",
  text: "#111827",
  muted: "#6b7280",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  darkBg: "#0d0d1f",
  darkCard: "#161630",
  darkBorder: "#252550",
  darkMuted: "#8080b0",
};

// ── TRANSLATIONS ─────────────────────────────────────────────────────────────
const T = {
  en: {
    appName: "iTrack", login: "Sign In", register: "Create Account", logout: "Sign Out",
    email: "Email", password: "Password", name: "Full Name",
    welcome: "Welcome back,", savings: "TOTAL SAVINGS (₺)",
    dailyTasks: "Daily Habits", myProgress: "My Progress",
    resisted: "💪 I Resisted", spent: "😔 I Spent",
    resistedDone: "✅ Resisted — Saved", spentDone: "❌ Spent today",
    quiz: "How do you feel?", quizSub: "Rate your self-discipline (1–10)",
    addHabit: "Add Habit", habitName: "Habit name", habitDesc: "Description (optional)",
    dailyCost: "Daily Cost (₺)", search: "Search habits…",
    home: "Home", community: "Community", profile: "Profile", friends: "Friends",
    adminPanel: "Admin Panel", totalUsers: "Total Users",
    avgSatisfaction: "Avg Satisfaction", totalHabits: "Total Habits",
    usersTable: "Users", progress: "Progress", satisfaction: "Satisfaction",
    noHabits: "No habits yet. Add your first one!",
    loginError: "Invalid email or password.",
    blocked: "Your account has been blocked. Contact support.",
    sendMsg: "Type a message…", addFriend: "Add Friend", friendReq: "Friend Requests",
    myFriends: "My Friends", searchUsers: "Search by name or email…",
    chat: "Chat", deleteUser: "Delete", blockUser: "Block", unblockUser: "Unblock",
    noMessages: "No messages yet. Say hi!", online: "Online",
    communityTitle: "Community", publicChat: "Public Chat", members: "Members",
    typePublic: "Message everyone…", noPublicMsgs: "No messages yet. Start the conversation!",
    adminBadge: "Admin",
    habitTypeQ: "What type of habit is this?",
    habitTypeSpend: "💸 Spendable",
    habitTypeSpendDesc: "Has a daily cost (e.g. smoking, coffee)",
    habitTypeNonSpend: "🏃 Non-Spendable",
    habitTypeNonSpendDesc: "Activity-based (e.g. running, sleeping early)",
    did: "✅ I Did It", didnt: "❌ I Didn't",
    didDone: "✅ Done — Great job!", didntDone: "❌ Skipped today",
    back: "← Back", continueBtn: "Continue →", skip: "SKIP",
    todaySaved: "Today saved", resisted_count: "Resisted",
    activityBadge: "🏃 Activity", resistedLabel: "Resisted/Did = savings or streak",
    spentLabel: "Spent/Didn't = streak resets", blocked_count: "Blocked",
    avgProgress: "Avg Progress", publicChatMod: "Public Chat — Moderation",
    messages: "messages", noPublicMsgsMod: "No public messages yet.",
    del: "Del", joinedDate: "Joined", habits: "habits", savings_label: "savings",
    ifResist: "If you resist:", addedToSavings: "added to savings each day",
    willLog: "You'll log", or: "or", daily: "daily", streakBuilds: "Streak builds with each success!",
  },
  ar: {
    appName: "iTrack", login: "تسجيل الدخول", register: "إنشاء حساب", logout: "خروج",
    email: "البريد", password: "كلمة المرور", name: "الاسم الكامل",
    welcome: "أهلاً،", savings: "إجمالي التوفير (₺)",
    dailyTasks: "العادات اليومية", myProgress: "تقدمي",
    resisted: "💪 صمدت", spent: "😔 أنفقت",
    resistedDone: "✅ صمدت — وفّرت", spentDone: "❌ أنفقت اليوم",
    quiz: "كيف تشعر؟", quizSub: "قيّم انضباطك من 1 إلى 10",
    addHabit: "إضافة عادة", habitName: "اسم العادة", habitDesc: "وصف (اختياري)",
    dailyCost: "التكلفة اليومية (₺)", search: "ابحث…",
    home: "الرئيسية", community: "المجتمع", profile: "حسابي", friends: "الأصدقاء",
    adminPanel: "لوحة المسؤول", totalUsers: "المستخدمون",
    avgSatisfaction: "متوسط الرضا", totalHabits: "العادات",
    usersTable: "المستخدمون", progress: "التقدم", satisfaction: "الرضا",
    noHabits: "لا توجد عادات. أضف عادتك الأولى!",
    loginError: "البريد أو كلمة المرور غير صحيحة.",
    blocked: "حسابك محظور. تواصل مع الدعم.",
    sendMsg: "اكتب رسالة…", addFriend: "إضافة صديق", friendReq: "طلبات الصداقة",
    myFriends: "أصدقائي", searchUsers: "ابحث بالاسم أو البريد…",
    chat: "محادثة", deleteUser: "حذف", blockUser: "حظر", unblockUser: "رفع الحظر",
    noMessages: "لا رسائل بعد.", online: "متصل",
    communityTitle: "المجتمع", publicChat: "دردشة عامة", members: "الأعضاء",
    typePublic: "اكتب للجميع…", noPublicMsgs: "لا رسائل بعد. ابدأ المحادثة!",
    adminBadge: "مسؤول",
    habitTypeQ: "ما نوع هذه العادة؟",
    habitTypeSpend: "💸 قابلة للصرف",
    habitTypeSpendDesc: "لها تكلفة يومية (مثل التدخين، القهوة)",
    habitTypeNonSpend: "🏃 غير قابلة للصرف",
    habitTypeNonSpendDesc: "نشاط يومي (مثل الركض، النوم مبكراً)",
    did: "✅ فعلت", didnt: "❌ لم أفعل",
    didDone: "✅ أحسنت! تم اليوم", didntDone: "❌ لم تُكمل اليوم",
    back: "→ رجوع", continueBtn: "متابعة →", skip: "تخطي",
    todaySaved: "وفّرت اليوم", resisted_count: "صمدت",
    activityBadge: "🏃 نشاط", resistedLabel: "صمدت/فعلت = توفير أو streak",
    spentLabel: "أنفقت/لم أفعل = إعادة streak", blocked_count: "محظور",
    avgProgress: "متوسط التقدم", publicChatMod: "الدردشة العامة — إشراف",
    messages: "رسائل", noPublicMsgsMod: "لا توجد رسائل عامة بعد.",
    del: "حذف", joinedDate: "انضم", habits: "عادات", savings_label: "مدخرات",
    ifResist: "إذا صمدت:", addedToSavings: "تُضاف للمدخرات يومياً",
    willLog: "ستسجّل", or: "أو", daily: "يومياً", streakBuilds: "الـ streak يبنى مع كل نجاح!",
  }
};

// ── HELPERS ──────────────────────────────────────────────────────────────────
const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
const safeNum = v => parseFloat(v) || 0;

async function apiFetch(path, options = {}) {
  const token = await AsyncStorage.getItem("token");
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
  
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ── AVATAR COMPONENT ─────────────────────────────────────────────────────────
function Avatar({ name, id, size = 40, isOnline = false }) {
  const hue = ((id || 0) * 67) % 360;
  const bg = `hsl(${hue},55%,88%)`;
  const color = `hsl(${hue},55%,35%)`;
  return (
    <View style={{ width: size, height: size }}>
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: bg, alignItems: "center", justifyContent: "center",
      }}>
        <Text style={{ fontWeight: "700", color, fontSize: size * 0.38 }}>
          {(name || "?").charAt(0).toUpperCase()}
        </Text>
      </View>
      {isOnline && (
        <View style={{
          position: "absolute", bottom: 0, right: 0,
          width: size * 0.27, height: size * 0.27,
          borderRadius: size * 0.135, backgroundColor: C.success,
          borderWidth: 2, borderColor: "white",
        }} />
      )}
    </View>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState("en");
  const [page, setPage] = useState("check-email");
  const [tab, setTab] = useState("home");
  const [currentUser, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [onlineIds, setOnlineIds] = useState([]);

  // Auth
  const [emailInput, setEmailInput] = useState("");
  const [passInput, setPassInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setLoading] = useState(false);

  // Habits
  const [habits, setHabits] = useState([]);
  const [searchQ, setSearchQ] = useState("");
  const [showRating, setShowRating] = useState(false);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [habitStep, setHabitStep] = useState("type");
  const [newHabit, setNewHabit] = useState({ name: "", goal: "", daily_cost: "", habit_type: "" });

  // Friends & Chat
  const [friends, setFriends] = useState([]);
  const [pendingReqs, setPending] = useState([]);
  const [searchUsers, setSearchUsers] = useState([]);
  const [userSearchQ, setUserSearchQ] = useState("");
  const [chatFriend, setChatFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const msgEnd = useRef(null);

  // Community
  const [publicMessages, setPublicMessages] = useState([]);
  const [publicMsgInput, setPublicMsgInput] = useState("");
  const [communitySubTab, setCommunitySubTab] = useState("chat");
  const [communityUsers, setCommunityUsers] = useState([]);
  const pubMsgEnd = useRef(null);

  // Admin
  const [adminUsers, setAdminUsers] = useState([]);

  const t = T[lang];

  // ── INIT ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      try {
        const u = await apiFetch("/me");
        setUser(u);
        setHabits(u.habits || []);
        setPage(u.role === "admin" ? "admin" : "home");
        connectSocket(token);
      } catch {
        await AsyncStorage.removeItem("token");
      }
    })();
  }, []);

  useEffect(() => {
    if (tab === "friends" && currentUser) {
      apiFetch("/friends").then(setFriends).catch(() => {});
      apiFetch("/friends/pending").then(setPending).catch(() => {});
    }
    if (tab === "community" && currentUser) {
      apiFetch("/public-messages").then(setPublicMessages).catch(() => {});
      apiFetch("/users/search?q=").then(setCommunityUsers).catch(() => {});
    }
  }, [tab, currentUser]);

  useEffect(() => {
    if (page === "admin") apiFetch("/admin/users").then(setAdminUsers).catch(() => {});
  }, [page]);

  // ── SOCKET ────────────────────────────────────────────────────────────────
  function connectSocket(token) {
    const s = io(API_BASE, { auth: { token } });
    s.on("online_users", ids => setOnlineIds(ids));
    s.on("new_message", msg => setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]));
    s.on("new_public_message", msg => setPublicMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]));
    s.on("public_message_deleted", ({ id }) => setPublicMessages(prev => prev.filter(m => m.id !== id)));
    s.on("account_blocked", async () => {
      Alert.alert("Blocked", t.blocked);
      await handleLogout();
    });
    setSocket(s);
  }

  // ── AUTH ──────────────────────────────────────────────────────────────────
  async function handleCheckEmail() {
    if (!emailInput.trim()) return;
    setLoading(true); setAuthError("");
    try {
      const { exists } = await apiFetch("/auth/check-email", { method: "POST", body: { email: emailInput } });
      setPage(exists ? "login" : "register");
    } catch (e) { setAuthError(e.message); }
    setLoading(false);
  }

  async function handleLogin() {
    setLoading(true); setAuthError("");
    try {
      const { token, user } = await apiFetch("/auth/login", { method: "POST", body: { email: emailInput, password: passInput } });
      await AsyncStorage.setItem("token", token);
      setUser(user);
      const me = await apiFetch("/me");
      setHabits(me.habits || []);
      setPage(user.role === "admin" ? "admin" : "home");
      connectSocket(token);
    } catch (e) { setAuthError(e.message || t.loginError); }
    setLoading(false);
  }

  async function handleRegister() {
    if (!nameInput.trim() || !passInput.trim()) return;
    setLoading(true); setAuthError("");
    try {
      const { token, user } = await apiFetch("/auth/register", { method: "POST", body: { name: nameInput, email: emailInput, password: passInput } });
      await AsyncStorage.setItem("token", token);
      setUser(user); setHabits([]);
      setPage("home"); connectSocket(token);
    } catch (e) { setAuthError(e.message); }
    setLoading(false);
  }

  async function handleLogout() {
    await AsyncStorage.removeItem("token");
    socket?.disconnect();
    setUser(null); setHabits([]); setSocket(null);
    setPage("check-email"); setEmailInput(""); setPassInput("");
  }

  // ── HABITS ────────────────────────────────────────────────────────────────
  async function handleHabitAction(habitId, type) {
    try {
      const res = await apiFetch(`/habits/${habitId}/action`, { method: "PATCH", body: { type } });
      const saved = safeNum(res.savedAmount);
      setHabits(prev => prev.map(h =>
        h.id === habitId
          ? { ...h, actedToday: true, action_type: type, streak: res.newStreak, progress: res.newProgress }
          : h
      ));
      if (type === "resisted" && saved > 0) {
        setUser(u => ({ ...u, savings: (safeNum(u.savings)) + saved }));
      }
      setShowRating(true);
    } catch (e) { console.error(e); }
  }

  async function handleRating(score) {
    try {
      await apiFetch("/me/satisfaction", { method: "PATCH", body: { score } });
      setUser(u => ({ ...u, satisfaction: score }));
    } catch (e) { console.error(e); }
    setShowRating(false);
  }

  async function handleAddHabit() {
    if (!newHabit.name.trim()) return;
    try {
      const habit = await apiFetch("/habits", { method: "POST", body: newHabit });
      setHabits(prev => [...prev, habit]);
      setNewHabit({ name: "", goal: "", daily_cost: "", habit_type: "" });
      setHabitStep("type");
      setShowAddHabit(false);
    } catch (e) { console.error(e); }
  }

  async function handleDeleteHabit(habitId) {
    Alert.alert("Delete Habit", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await apiFetch(`/habits/${habitId}`, { method: "DELETE" });
        setHabits(prev => prev.filter(h => h.id !== habitId));
      }}
    ]);
  }

  // ── FRIENDS ───────────────────────────────────────────────────────────────
  async function searchForUsers() {
    if (!userSearchQ.trim()) return;
    const r = await apiFetch(`/users/search?q=${encodeURIComponent(userSearchQ)}`);
    setSearchUsers(r);
  }

  async function sendFriendReq(friendId) {
    await apiFetch("/friends/request", { method: "POST", body: { friendId } });
    setSearchUsers(prev => prev.filter(u => u.id !== friendId));
  }

  async function acceptReq(userId) {
    await apiFetch(`/friends/${userId}/accept`, { method: "PATCH" });
    setPending(prev => prev.filter(u => u.id !== userId));
    apiFetch("/friends").then(setFriends);
  }

  async function openChat(friend) {
    setChatFriend(friend); setTab("chat");
    const msgs = await apiFetch(`/messages/${friend.id}`);
    setMessages(msgs);
  }

  function sendMessage() {
    if (!msgInput.trim() || !socket || !chatFriend) return;
    socket.emit("send_message", { receiverId: chatFriend.id, text: msgInput });
    setMsgInput("");
  }

  function sendPublicMessage() {
    if (!publicMsgInput.trim() || !socket) return;
    socket.emit("send_public_message", { text: publicMsgInput });
    setPublicMsgInput("");
  }

  async function deletePublicMessage(id) {
    await apiFetch(`/admin/public-messages/${id}`, { method: "DELETE" });
  }

  async function blockUser(id, blocked) {
    await apiFetch(`/admin/users/${id}/block`, { method: "PATCH", body: { blocked } });
    setAdminUsers(prev => prev.map(u => u.id === id ? { ...u, blocked } : u));
  }

  async function deleteUser(id) {
    Alert.alert("Delete User", "Permanently delete this user and all their data?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await apiFetch(`/admin/users/${id}`, { method: "DELETE" });
        setAdminUsers(prev => prev.filter(u => u.id !== id));
      }}
    ]);
  }

  const visibleHabits = habits.filter(h => h.name.toLowerCase().includes(searchQ.toLowerCase()));
  const savedToday = habits.filter(h => h.actedToday && h.action_type === "resisted").reduce((s, h) => s + safeNum(h.reward), 0);
  const resistedCount = habits.filter(h => h.actedToday && h.action_type === "resisted").length;

  // ─────────────────────────────────────────────────────────────────────────
  // AUTH SCREENS
  // ─────────────────────────────────────────────────────────────────────────
  if (page === "check-email" || page === "login" || page === "register") {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={C.darkBg} />
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: C.darkBg }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={S.authScroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo + Brand */}
            <View style={S.authHeader}>
              <LinearGradient colors={[C.primary, C.light]} style={S.authLogo}>
                <Zap size={30} color="white" />
              </LinearGradient>
              <Text style={S.authBrandName}>iTrack</Text>
              <Text style={S.authSlogan}>Track habits. Save money. Build discipline.</Text>
            </View>

            {/* Card */}
            <View style={S.authCard}>
              {/* Language Toggle */}
              <TouchableOpacity
                style={S.langBtn}
                onPress={() => setLang(l => l === "en" ? "ar" : "en")}
              >
                <Globe size={13} color={C.darkMuted} />
                <Text style={S.langBtnText}>{lang === "en" ? "العربية" : "English"}</Text>
              </TouchableOpacity>

              {/* Check Email */}
              {page === "check-email" && <>
                <Text style={S.fieldLabel}>{t.email}</Text>
                <TextInput
                  value={emailInput}
                  onChangeText={v => { setEmailInput(v); setAuthError(""); }}
                  onSubmitEditing={handleCheckEmail}
                  style={S.darkInput}
                  placeholder="you@example.com"
                  placeholderTextColor="#505080"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {authError ? (
                  <View style={S.authError}>
                    <AlertCircle size={14} color={C.danger} />
                    <Text style={S.authErrorText}>{authError}</Text>
                  </View>
                ) : null}
                <TouchableOpacity onPress={handleCheckEmail} disabled={authLoading}>
                  <LinearGradient colors={[C.primary, C.light]} style={S.authBtn}>
                    {authLoading
                      ? <ActivityIndicator color="white" />
                      : <Text style={S.authBtnText}>{t.continueBtn}</Text>
                    }
                  </LinearGradient>
                </TouchableOpacity>
                <View style={S.demoBox}>
                  <Text style={S.demoTitle}>Demo:</Text>
                  <Text style={S.demoText}>Admin: admin@admin.ad / admin1234</Text>
                </View>
              </>}

              {/* Login */}
              {page === "login" && <>
                <TouchableOpacity onPress={() => setPage("check-email")}>
                  <Text style={S.backLink}>{t.back}</Text>
                </TouchableOpacity>
                <Text style={S.fieldLabel}>{t.email}</Text>
                <View style={[S.darkInput, { opacity: 0.5 }]}>
                  <Text style={{ color: "white", fontSize: 14 }}>{emailInput}</Text>
                </View>
                <Text style={[S.fieldLabel, { marginTop: 12 }]}>{t.password}</Text>
                <View style={S.passwordRow}>
                  <TextInput
                    value={passInput}
                    onChangeText={v => { setPassInput(v); setAuthError(""); }}
                    onSubmitEditing={handleLogin}
                    style={[S.darkInput, { flex: 1, marginBottom: 0, paddingRight: 48 }]}
                    placeholder="••••••••"
                    placeholderTextColor="#505080"
                    secureTextEntry={!showPass}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={S.eyeBtn}
                    onPress={() => setShowPass(p => !p)}
                  >
                    {showPass ? <EyeOff size={16} color="#6060a0" /> : <Eye size={16} color="#6060a0" />}
                  </TouchableOpacity>
                </View>
                {authError ? (
                  <View style={S.authError}>
                    <AlertCircle size={14} color={C.danger} />
                    <Text style={S.authErrorText}>{authError}</Text>
                  </View>
                ) : null}
                <TouchableOpacity onPress={handleLogin} disabled={authLoading} style={{ marginTop: 16 }}>
                  <LinearGradient colors={[C.primary, C.light]} style={S.authBtn}>
                    {authLoading
                      ? <ActivityIndicator color="white" />
                      : <Text style={S.authBtnText}>{t.login}</Text>
                    }
                  </LinearGradient>
                </TouchableOpacity>
              </>}

              {/* Register */}
              {page === "register" && <>
                <TouchableOpacity onPress={() => setPage("check-email")}>
                  <Text style={S.backLink}>{t.back}</Text>
                </TouchableOpacity>
                {[
                  { label: t.name, val: nameInput, set: setNameInput, type: "default", ph: "Your full name" },
                  { label: t.email, val: emailInput, set: setEmailInput, type: "email-address", ph: "you@example.com" },
                  { label: t.password, val: passInput, set: setPassInput, type: "default", ph: "••••••••", secure: true },
                ].map(f => (
                  <View key={f.label}>
                    <Text style={[S.fieldLabel, { marginTop: 12 }]}>{f.label}</Text>
                    <TextInput
                      value={f.val}
                      onChangeText={v => { f.set(v); setAuthError(""); }}
                      style={S.darkInput}
                      placeholder={f.ph}
                      placeholderTextColor="#505080"
                      keyboardType={f.type}
                      secureTextEntry={f.secure}
                      autoCapitalize="none"
                    />
                  </View>
                ))}
                {authError ? (
                  <View style={S.authError}>
                    <AlertCircle size={14} color={C.danger} />
                    <Text style={S.authErrorText}>{authError}</Text>
                  </View>
                ) : null}
                <TouchableOpacity onPress={handleRegister} disabled={authLoading} style={{ marginTop: 16 }}>
                  <LinearGradient colors={[C.primary, C.light]} style={S.authBtn}>
                    {authLoading
                      ? <ActivityIndicator color="white" />
                      : <Text style={S.authBtnText}>{t.register}</Text>
                    }
                  </LinearGradient>
                </TouchableOpacity>
              </>}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaProvider>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN PANEL
  // ─────────────────────────────────────────────────────────────────────────
  if (page === "admin") {
    const totalH = adminUsers.reduce((s, u) => s + u.habits.length, 0);
    const avgSat = avg(adminUsers.map(u => u.satisfaction));
    const avgPr = avg(adminUsers.flatMap(u => u.habits.map(h => h.progress)));

    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#08080f" />
        <SafeAreaView style={{ flex: 1, backgroundColor: "#08080f" }}>
          {/* Admin Header */}
          <View style={S.adminHeader}>
            <View style={S.adminBrand}>
              <LinearGradient colors={["#f59e0b", "#ef4444"]} style={S.adminIcon}>
                <ShieldCheck size={18} color="white" />
              </LinearGradient>
              <View>
                <Text style={S.adminTitle}>{t.adminPanel} — {t.appName}</Text>
                <Text style={S.adminEmail}>{currentUser?.email}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                style={S.adminLangBtn}
                onPress={() => setLang(l => l === "en" ? "ar" : "en")}
              >
                <Globe size={14} color="#8080b0" />
              </TouchableOpacity>
              <TouchableOpacity style={S.adminLogoutBtn} onPress={handleLogout}>
                <LogOut size={14} color="#f87171" />
                <Text style={{ color: "#f87171", fontSize: 12, marginLeft: 4 }}>{t.logout}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {/* Stats Grid */}
            <View style={S.statsGrid}>
              {[
                { label: t.totalUsers, value: adminUsers.length, color: "#6366f1" },
                { label: t.avgSatisfaction, value: `${avgSat}/10`, color: "#ec4899" },
                { label: t.totalHabits, value: totalH, color: "#10b981" },
                { label: t.avgProgress, value: `${avgPr}%`, color: "#f59e0b" },
                { label: t.blocked_count, value: adminUsers.filter(u => u.blocked).length, color: "#ef4444" },
              ].map(stat => (
                <View key={stat.label} style={[S.statCard, { borderColor: "#1a1a35" }]}>
                  <Text style={[S.statValue, { color: stat.color }]}>{stat.value}</Text>
                  <Text style={S.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            {/* Satisfaction Chart */}
            <View style={S.adminSection}>
              <Text style={S.adminSectionTitle}>Satisfaction Distribution</Text>
              <View style={S.chartRow}>
                {[1,2,3,4,5,6,7,8,9,10].map(score => {
                  const count = adminUsers.filter(u => u.satisfaction === score).length;
                  const barH = count ? Math.max(12, count * 20) : 4;
                  const barColor = score >= 7 ? "#10b981" : score >= 4 ? "#f59e0b" : "#ef4444";
                  return (
                    <View key={score} style={S.chartCol}>
                      <View style={[S.chartBar, { height: barH, backgroundColor: barColor }]} />
                      <Text style={S.chartLabel}>{score}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Public Chat Moderation */}
            <View style={S.adminSection}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <MessageCircle size={16} color="#818cf8" />
                <Text style={[S.adminSectionTitle, { marginLeft: 8, marginBottom: 0 }]}>{t.publicChatMod}</Text>
                <Text style={{ marginLeft: "auto", fontSize: 12, color: "#6060a0" }}>{publicMessages.length} {t.messages}</Text>
              </View>
              {publicMessages.length === 0
                ? <Text style={{ color: "#6060a0", fontSize: 13 }}>{t.noPublicMsgsMod}</Text>
                : publicMessages.slice(-20).map(m => (
                  <View key={m.id} style={S.adminMsg}>
                    <Avatar name={m.sender_name} id={m.sender_id} size={28} />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: "#a0a0e0" }}>{m.sender_name}</Text>
                      <Text style={{ fontSize: 13, color: "#d0d0f0", marginTop: 2 }}>{m.content}</Text>
                    </View>
                    <TouchableOpacity
                      style={S.delBtn}
                      onPress={() => deletePublicMessage(m.id)}
                    >
                      <Trash2 size={11} color="#f87171" />
                      <Text style={{ color: "#f87171", fontSize: 10, marginLeft: 2 }}>{t.del}</Text>
                    </TouchableOpacity>
                  </View>
                ))
              }
            </View>

            {/* Users Table */}
            <View style={S.adminSection}>
              <Text style={S.adminSectionTitle}>{t.usersTable}</Text>
              {adminUsers.map(u => (
                <View key={u.id} style={[S.adminUserRow, { opacity: u.blocked ? 0.65 : 1 }]}>
                  <Avatar name={u.name} id={u.id} size={42} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={S.adminUserName}>{u.name}</Text>
                      {u.blocked && (
                        <View style={S.blockedBadge}>
                          <Text style={{ color: "#f87171", fontSize: 9, fontWeight: "700" }}>BLOCKED</Text>
                        </View>
                      )}
                    </View>
                    <Text style={S.adminUserEmail}>{u.email}</Text>
                    <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
                      <Text style={{ fontSize: 11, color: "#818cf8" }}>{u.habits.length} {t.habits}</Text>
                      <Text style={{ fontSize: 11, color: "#10b981" }}>₺{u.savings} {t.savings_label}</Text>
                      <Text style={{ fontSize: 11, color: "#f59e0b" }}>{u.satisfaction}/10</Text>
                    </View>
                    {/* Progress bar */}
                    <View style={{ height: 4, backgroundColor: "#1a1a35", borderRadius: 99, marginTop: 6, overflow: "hidden" }}>
                      <View style={{ height: "100%", backgroundColor: C.primary, borderRadius: 99, width: `${u.habits.length ? avg(u.habits.map(h => h.progress)) : 0}%` }} />
                    </View>
                  </View>
                  <View style={{ gap: 6 }}>
                    <TouchableOpacity
                      style={[S.adminAction, { borderColor: u.blocked ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)", backgroundColor: u.blocked ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)" }]}
                      onPress={() => blockUser(u.id, !u.blocked)}
                    >
                      {u.blocked
                        ? <><Shield size={12} color="#10b981" /><Text style={{ color: "#10b981", fontSize: 10, marginLeft: 3 }}>{t.unblockUser}</Text></>
                        : <><Ban size={12} color="#f59e0b" /><Text style={{ color: "#f59e0b", fontSize: 10, marginLeft: 3 }}>{t.blockUser}</Text></>
                      }
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[S.adminAction, { borderColor: "rgba(239,68,68,0.2)", backgroundColor: "rgba(239,68,68,0.08)" }]}
                      onPress={() => deleteUser(u.id)}
                    >
                      <Trash2 size={12} color="#f87171" />
                      <Text style={{ color: "#f87171", fontSize: 10, marginLeft: 3 }}>{t.deleteUser}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN USER APP
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        {/* Header */}
        <View style={S.appHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <LinearGradient colors={[C.primary, C.light]} style={S.headerLogo}>
              <Zap size={14} color="white" />
            </LinearGradient>
            <Text style={S.headerBrand}>{t.appName}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <TouchableOpacity
              style={S.langToggle}
              onPress={() => setLang(l => l === "en" ? "ar" : "en")}
            >
              <Globe size={13} color={C.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout}>
              <LogOut size={18} color={C.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── HOME ── */}
        {tab === "home" && (
          <ScrollView contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={S.welcomeText}>
              {t.welcome} <Text style={{ fontWeight: "900", color: C.text }}>{currentUser?.name}</Text>
            </Text>

            {/* Savings Card */}
            <LinearGradient colors={["#4338ca", "#7c3aed"]} style={S.savingsCard}>
              <Text style={S.savingsLabel}>{t.savings}</Text>
              <Text style={S.savingsValue}>₺{safeNum(currentUser?.savings).toFixed(2)}</Text>
              <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
                <Text style={S.savingsSub}>{t.todaySaved}: <Text style={{ color: "rgba(255,255,255,0.9)", fontWeight: "700" }}>₺{savedToday.toFixed(2)}</Text></Text>
                <Text style={S.savingsSub}>{t.resisted_count}: <Text style={{ color: "rgba(255,255,255,0.9)", fontWeight: "700" }}>{resistedCount}/{habits.length}</Text></Text>
              </View>
              <View style={S.savingsBar}>
                <View style={[S.savingsBarFill, { width: `${Math.min(100, (safeNum(currentUser?.savings) / 1000) * 100)}%` }]} />
              </View>
            </LinearGradient>

            {/* Search + Add */}
            <View style={S.searchRow}>
              <View style={S.searchBox}>
                <Search size={16} color={C.muted} />
                <TextInput
                  value={searchQ}
                  onChangeText={setSearchQ}
                  placeholder={t.search}
                  style={S.searchInput}
                  placeholderTextColor={C.muted}
                />
              </View>
              <TouchableOpacity onPress={() => setShowAddHabit(true)}>
                <LinearGradient colors={[C.primary, C.light]} style={S.addBtn}>
                  <Plus size={15} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Legend */}
            <View style={S.legend}>
              <View style={S.legendItem}><View style={[S.legendDot, { backgroundColor: C.success }]} /><Text style={S.legendText}>{t.resistedLabel}</Text></View>
              <View style={S.legendItem}><View style={[S.legendDot, { backgroundColor: C.danger }]} /><Text style={S.legendText}>{t.spentLabel}</Text></View>
            </View>

            {/* Empty State */}
            {habits.length === 0 && (
              <View style={S.emptyState}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>🎯</Text>
                <Text style={{ color: C.muted, fontSize: 14 }}>{t.noHabits}</Text>
              </View>
            )}

            {/* Habits Grid */}
            <View style={S.habitGrid}>
              {visibleHabits.map(h => {
                const isPositive = h.action_type === "resisted" || h.action_type === "did";
                const actedBg = isPositive ? "#f0fdf8" : "#fff5f5";
                const actedBorder = isPositive ? "#a7f3d0" : "#fecaca";
                const progressColor = h.actedToday ? (isPositive ? C.success : C.danger) : C.primary;

                return (
                  <View key={h.id} style={[S.habitCard, h.actedToday && { backgroundColor: actedBg, borderColor: actedBorder }]}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      {h.habit_type === "non_spendable"
                        ? <View style={S.activityBadge}><Text style={{ color: "#0369a1", fontSize: 9, fontWeight: "800" }}>{t.activityBadge}</Text></View>
                        : <View style={S.costBadge}><Text style={{ color: C.primary, fontSize: 9, fontWeight: "800" }}>₺{safeNum(h.reward)}/day</Text></View>
                      }
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={{ fontSize: 10, color: "#f59e0b", fontWeight: "700" }}>🔥{h.streak}</Text>
                        <TouchableOpacity onPress={() => handleDeleteHabit(h.id)}>
                          <Trash2 size={12} color="#fca5a5" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={S.habitTitle} numberOfLines={2}>{h.name}</Text>
                    {h.goal ? <Text style={S.habitGoal} numberOfLines={1}>{h.goal}</Text> : null}
                    <View style={S.progressBar}>
                      <View style={[S.progressFill, { width: `${h.progress}%`, backgroundColor: progressColor }]} />
                    </View>
                    {h.actedToday ? (
                      <View style={[S.statusBadge, { backgroundColor: isPositive ? "#dcfce7" : "#fee2e2" }]}>
                        <Text style={[S.statusText, { color: isPositive ? "#059669" : "#dc2626" }]}>
                          {h.action_type === "resisted" ? `${t.resistedDone} ₺${safeNum(h.reward)}!`
                            : h.action_type === "did" ? t.didDone
                            : h.action_type === "spent" ? t.spentDone
                            : t.didntDone}
                        </Text>
                      </View>
                    ) : (
                      <View style={{ flexDirection: "row", gap: 5, marginTop: 4 }}>
                        {h.habit_type === "non_spendable" ? (
                          <>
                            <TouchableOpacity style={[S.actionBtnPrimary, { flex: 1 }]} onPress={() => handleHabitAction(h.id, "did")}>
                              <Text style={S.actionBtnText}>{t.did}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[S.actionBtnDanger, { flex: 1 }]} onPress={() => handleHabitAction(h.id, "didnt")}>
                              <Text style={S.actionBtnText}>{t.didnt}</Text>
                            </TouchableOpacity>
                          </>
                        ) : (
                          <>
                            <TouchableOpacity style={[S.actionBtnPrimary, { flex: 1 }]} onPress={() => handleHabitAction(h.id, "resisted")}>
                              <Text style={S.actionBtnText}>{t.resisted}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[S.actionBtnDanger, { flex: 1 }]} onPress={() => handleHabitAction(h.id, "spent")}>
                              <Text style={S.actionBtnText}>{t.spent}</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Progress Section */}
            {habits.length > 0 && (
              <View style={S.progressSection}>
                <Text style={S.sectionTitle}>{t.myProgress}</Text>
                {habits.map(h => (
                  <View key={h.id} style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: C.text }}>{h.name}</Text>
                      <Text style={{ fontSize: 12, fontWeight: "800", color: C.primary }}>{h.progress}%</Text>
                    </View>
                    <View style={S.progressBar}>
                      <View style={[S.progressFill, { width: `${h.progress}%`, backgroundColor: h.actedToday && h.action_type === "resisted" ? C.success : C.primary }]} />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}

        {/* ── COMMUNITY ── */}
        {tab === "community" && (
          <View style={{ flex: 1 }}>
            <View style={S.tabHeader}>
              <Text style={S.tabTitle}>{t.communityTitle}</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {[
                  { id: "chat", label: `💬 ${t.publicChat}` },
                  { id: "members", label: `👥 ${t.members}` },
                ].map(s => (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => setCommunitySubTab(s.id)}
                    style={[S.subTab, communitySubTab === s.id && S.subTabActive]}
                  >
                    <Text style={[S.subTabText, communitySubTab === s.id && { color: "white" }]}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 99, backgroundColor: C.success }} />
                  <Text style={{ fontSize: 11, color: C.muted }}>{onlineIds.length}</Text>
                </View>
              </View>
            </View>

            {communitySubTab === "members" && (
              <ScrollView contentContainerStyle={{ padding: 16, flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {communityUsers.map(u => (
                  <View key={u.id} style={[S.memberCard, { width: (SCREEN_WIDTH - 42) / 2 }]}>
                    <Avatar name={u.name} id={u.id} size={52} isOnline={onlineIds.includes(u.id)} />
                    <Text style={{ fontWeight: "700", fontSize: 14, color: C.text, marginTop: 8 }}>{u.name}</Text>
                    {onlineIds.includes(u.id) && <Text style={{ fontSize: 11, color: C.success, fontWeight: "600" }}>{t.online}</Text>}
                  </View>
                ))}
              </ScrollView>
            )}

            {communitySubTab === "chat" && (
              <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={90}>
                <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderBottomWidth: 1, borderColor: C.border, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "white" }}>
                  <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: C.success }} />
                  <Text style={{ fontSize: 12, color: C.muted }}>Public chat — visible to everyone</Text>
                </View>
                <ScrollView
                  ref={pubMsgEnd}
                  contentContainerStyle={{ padding: 16, gap: 10 }}
                  onContentSizeChange={() => pubMsgEnd.current?.scrollToEnd({ animated: true })}
                >
                  {publicMessages.length === 0 && (
                    <Text style={{ textAlign: "center", color: C.muted, fontSize: 13, marginTop: 40 }}>{t.noPublicMsgs}</Text>
                  )}
                  {publicMessages.map(m => {
                    const mine = m.sender_id === currentUser?.id;
                    const isAdmin = m.sender_role === "admin";
                    return (
                      <View key={m.id} style={{ flexDirection: mine ? "row-reverse" : "row", gap: 8, alignItems: "flex-end" }}>
                        <Avatar name={m.sender_name} id={m.sender_id} size={30} />
                        <View style={{ maxWidth: "72%", alignItems: mine ? "flex-end" : "flex-start" }}>
                          <Text style={{ fontSize: 10, color: isAdmin ? C.primary : C.muted, fontWeight: "700", marginBottom: 2 }}>
                            {mine ? "You" : m.sender_name}{isAdmin ? ` [${t.adminBadge}]` : ""}
                          </Text>
                          <View style={{
                            padding: 10, borderRadius: 16,
                            borderBottomRightRadius: mine ? 4 : 16,
                            borderBottomLeftRadius: mine ? 16 : 4,
                            backgroundColor: mine ? C.primary : isAdmin ? "#ede9fe" : "#f5f5fb",
                          }}>
                            <Text style={{ color: mine ? "white" : C.text, fontSize: 14 }}>{m.content}</Text>
                            <Text style={{ fontSize: 10, opacity: 0.6, marginTop: 3, textAlign: "right", color: mine ? "white" : C.muted }}>
                              {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </Text>
                          </View>
                        </View>
                        {currentUser?.role === "admin" && !mine && (
                          <TouchableOpacity onPress={() => deletePublicMessage(m.id)}>
                            <Trash2 size={13} color="#fca5a5" />
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
                <View style={S.chatInputRow}>
                  <TextInput
                    value={publicMsgInput}
                    onChangeText={setPublicMsgInput}
                    onSubmitEditing={sendPublicMessage}
                    placeholder={t.typePublic}
                    style={S.chatInput}
                    placeholderTextColor={C.muted}
                  />
                  <TouchableOpacity onPress={sendPublicMessage}>
                    <LinearGradient colors={[C.primary, C.light]} style={S.sendBtn}>
                      <Send size={15} color="white" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            )}
          </View>
        )}

        {/* ── FRIENDS ── */}
        {tab === "friends" && (
          <ScrollView contentContainerStyle={S.scrollContent}>
            <Text style={S.tabTitle}>{t.friends}</Text>

            {/* Search Users */}
            <View style={S.card}>
              <Text style={S.cardTitle}>{t.addFriend}</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TextInput
                  value={userSearchQ}
                  onChangeText={setUserSearchQ}
                  onSubmitEditing={searchForUsers}
                  placeholder={t.searchUsers}
                  style={[S.lightInput, { flex: 1 }]}
                  placeholderTextColor={C.muted}
                />
                <TouchableOpacity onPress={searchForUsers} style={S.searchBtn}>
                  <Search size={15} color="white" />
                </TouchableOpacity>
              </View>
              {searchUsers.map(u => (
                <View key={u.id} style={S.userRow}>
                  <Avatar name={u.name} id={u.id} size={34} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={{ fontWeight: "700", fontSize: 13, color: C.text }}>{u.name}</Text>
                    <Text style={{ fontSize: 11, color: C.muted }}>{u.email}</Text>
                  </View>
                  <TouchableOpacity style={S.addFriendBtn} onPress={() => sendFriendReq(u.id)}>
                    <UserPlus size={13} color={C.primary} />
                    <Text style={{ color: C.primary, fontSize: 12, fontWeight: "700", marginLeft: 4 }}>Add</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Pending Requests */}
            {pendingReqs.length > 0 && (
              <View style={[S.card, { borderColor: "#fde68a", backgroundColor: "#fffbeb" }]}>
                <Text style={[S.cardTitle, { color: "#92400e" }]}>{t.friendReq} ({pendingReqs.length})</Text>
                {pendingReqs.map(u => (
                  <View key={u.id} style={[S.userRow, { marginTop: 8 }]}>
                    <Avatar name={u.name} id={u.id} size={34} />
                    <Text style={{ flex: 1, marginLeft: 10, fontWeight: "700", fontSize: 13, color: C.text }}>{u.name}</Text>
                    <TouchableOpacity style={S.acceptBtn} onPress={() => acceptReq(u.id)}>
                      <Text style={{ color: "white", fontSize: 12, fontWeight: "700" }}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* My Friends */}
            <Text style={[S.cardTitle, { marginBottom: 10 }]}>{t.myFriends}</Text>
            {friends.filter(f => f.status === "accepted").map(f => (
              <View key={f.id} style={S.friendCard}>
                <Avatar name={f.name} id={f.id} size={42} isOnline={onlineIds.includes(f.id)} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ fontWeight: "700", fontSize: 14, color: C.text }}>{f.name}</Text>
                  <Text style={{ fontSize: 11, color: onlineIds.includes(f.id) ? C.success : C.muted }}>
                    {onlineIds.includes(f.id) ? t.online : f.email}
                  </Text>
                </View>
                <TouchableOpacity style={S.chatBtn} onPress={() => openChat(f)}>
                  <MessageCircle size={13} color={C.primary} />
                  <Text style={{ color: C.primary, fontSize: 12, fontWeight: "700", marginLeft: 4 }}>{t.chat}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* ── PRIVATE CHAT ── */}
        {tab === "chat" && chatFriend && (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={90}>
            <View style={S.privateChatHeader}>
              <TouchableOpacity onPress={() => setTab("friends")} style={S.backBtn}>
                <Text style={{ color: C.primary, fontWeight: "600" }}>←</Text>
              </TouchableOpacity>
              <Avatar name={chatFriend.name} id={chatFriend.id} size={36} />
              <View style={{ marginLeft: 10 }}>
                <Text style={{ fontWeight: "700", fontSize: 14, color: C.text }}>{chatFriend.name}</Text>
                <Text style={{ fontSize: 11, color: C.muted }}>🔒 End-to-end encrypted</Text>
              </View>
            </View>
            <ScrollView
              ref={msgEnd}
              contentContainerStyle={{ padding: 16, gap: 8 }}
              onContentSizeChange={() => msgEnd.current?.scrollToEnd({ animated: true })}
            >
              {messages.length === 0 && (
                <Text style={{ textAlign: "center", color: C.muted, fontSize: 13, marginTop: 40 }}>{t.noMessages}</Text>
              )}
              {messages.map(m => {
                const mine = m.sender_id === currentUser.id;
                return (
                  <View key={m.id} style={{ alignItems: mine ? "flex-end" : "flex-start" }}>
                    <View style={{
                      maxWidth: "75%", padding: 10,
                      borderRadius: 18,
                      borderBottomRightRadius: mine ? 4 : 18,
                      borderBottomLeftRadius: mine ? 18 : 4,
                      backgroundColor: mine ? C.primary : "white",
                      borderWidth: mine ? 0 : 1.5, borderColor: C.border,
                    }}>
                      <Text style={{ color: mine ? "white" : C.text, fontSize: 14 }}>{m.content}</Text>
                      <Text style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: "right", color: mine ? "white" : C.muted }}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
            <View style={S.chatInputRow}>
              <TextInput
                value={msgInput}
                onChangeText={setMsgInput}
                onSubmitEditing={sendMessage}
                placeholder={t.sendMsg}
                style={S.chatInput}
                placeholderTextColor={C.muted}
              />
              <TouchableOpacity onPress={sendMessage}>
                <LinearGradient colors={[C.primary, C.light]} style={S.sendBtn}>
                  <Send size={15} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}

        {/* ── PROFILE ── */}
        {tab === "profile" && (
          <ScrollView contentContainerStyle={S.scrollContent}>
            <Text style={S.tabTitle}>{t.profile}</Text>
            <LinearGradient colors={[C.primary, C.light]} style={S.profileCard}>
              <View style={S.profileAvatar}>
                <Text style={{ fontSize: 28, fontWeight: "900", color: "white" }}>{currentUser?.name?.charAt(0)}</Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "white" }}>{currentUser?.name}</Text>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{currentUser?.email}</Text>
            </LinearGradient>
            <View style={S.statsRow}>
              {[
                { label: "Savings", val: `₺${safeNum(currentUser?.savings).toFixed(2)}`, color: C.success, bg: "#f0fdf4" },
                { label: "Habits", val: habits.length, color: C.primary, bg: "#f5f3ff" },
                { label: "Satisfaction", val: `${currentUser?.satisfaction ?? 0}/10`, color: C.warning, bg: "#fffbeb" },
                { label: "Best Streak", val: `${habits.reduce((m, h) => Math.max(m, h.streak), 0)}🔥`, color: "#ec4899", bg: "#fdf2f8" },
              ].map(s => (
                <View key={s.label} style={[S.profileStat, { backgroundColor: s.bg }]}>
                  <Text style={{ fontSize: 18, fontWeight: "900", color: s.color }}>{s.val}</Text>
                  <Text style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{s.label}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={S.logoutBtn} onPress={handleLogout}>
              <LogOut size={16} color={C.danger} />
              <Text style={{ color: C.danger, fontWeight: "700", fontSize: 14, marginLeft: 8 }}>{t.logout}</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* ── BOTTOM NAV ── */}
        <View style={S.bottomNav}>
          {[
            { id: "home", icon: Home, label: t.home },
            { id: "community", icon: Trophy, label: t.community },
            { id: "friends", icon: UserPlus, label: t.friends },
            { id: "profile", icon: User, label: t.profile },
          ].map(n => {
            const Icon = n.icon;
            const active = tab === n.id;
            return (
              <TouchableOpacity key={n.id} style={S.navItem} onPress={() => setTab(n.id)}>
                <View style={[S.navIconWrap, active && S.navIconActive]}>
                  <Icon size={19} color={active ? C.primary : C.muted} />
                </View>
                <Text style={[S.navLabel, active && { color: C.primary, fontWeight: "700" }]}>{n.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── ADD HABIT MODAL ── */}
        <Modal visible={showAddHabit} transparent animationType="slide" onRequestClose={() => { setShowAddHabit(false); setHabitStep("type"); }}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={S.modalOverlay}>
              <View style={S.modalCard}>
                {/* Modal Header */}
                <View style={S.modalHeader}>
                  <View>
                    <Text style={S.modalTitle}>{t.addHabit}</Text>
                    <Text style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                      {habitStep === "type" ? t.habitTypeQ
                        : newHabit.habit_type === "spendable" ? "How much does this habit cost daily?"
                        : "What activity do you want to track?"}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => { setShowAddHabit(false); setHabitStep("type"); setNewHabit({ name: "", goal: "", daily_cost: "", habit_type: "" }); }}>
                    <X size={20} color={C.muted} />
                  </TouchableOpacity>
                </View>

                {/* Step 1: Type Selection */}
                {habitStep === "type" && (
                  <View style={{ gap: 12 }}>
                    <TouchableOpacity style={S.typeCard} onPress={() => { setNewHabit(p => ({ ...p, habit_type: "spendable" })); setHabitStep("details"); }}>
                      <View style={[S.typeIcon, { backgroundColor: "#ede9fe" }]}>
                        <Text style={{ fontSize: 22 }}>💸</Text>
                      </View>
                      <View>
                        <Text style={S.typeTitle}>{t.habitTypeSpend}</Text>
                        <Text style={S.typeDesc}>{t.habitTypeSpendDesc}</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={S.typeCard} onPress={() => { setNewHabit(p => ({ ...p, habit_type: "non_spendable" })); setHabitStep("details"); }}>
                      <View style={[S.typeIcon, { backgroundColor: "#dcfce7" }]}>
                        <Text style={{ fontSize: 22 }}>🏃</Text>
                      </View>
                      <View>
                        <Text style={S.typeTitle}>{t.habitTypeNonSpend}</Text>
                        <Text style={S.typeDesc}>{t.habitTypeNonSpendDesc}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Step 2: Details */}
                {habitStep === "details" && (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Back + Type Pill */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <TouchableOpacity style={S.modalBackBtn} onPress={() => setHabitStep("type")}>
                        <Text style={{ color: C.primary, fontSize: 12, fontWeight: "600" }}>← Back</Text>
                      </TouchableOpacity>
                      <View style={[S.typePill, { backgroundColor: newHabit.habit_type === "spendable" ? "#ede9fe" : "#dcfce7" }]}>
                        <Text style={{ color: newHabit.habit_type === "spendable" ? C.primary : "#059669", fontSize: 11, fontWeight: "700" }}>
                          {newHabit.habit_type === "spendable" ? t.habitTypeSpend : t.habitTypeNonSpend}
                        </Text>
                      </View>
                    </View>

                    {/* Name */}
                    <Text style={S.modalLabel}>{t.habitName}</Text>
                    <TextInput
                      value={newHabit.name}
                      onChangeText={v => setNewHabit(p => ({ ...p, name: v }))}
                      placeholder={newHabit.habit_type === "spendable" ? "e.g. Smoking, Coffee" : "e.g. Running, Early sleep"}
                      style={S.modalInput}
                      placeholderTextColor={C.muted}
                    />

                    {/* Description */}
                    <Text style={S.modalLabel}>{t.habitDesc}</Text>
                    <TextInput
                      value={newHabit.goal}
                      onChangeText={v => setNewHabit(p => ({ ...p, goal: v }))}
                      placeholder={newHabit.habit_type === "spendable" ? "e.g. Quit smoking to save money" : "e.g. Run 10km every day"}
                      style={S.modalInput}
                      placeholderTextColor={C.muted}
                    />

                    {/* Daily Cost (spendable only) */}
                    {newHabit.habit_type === "spendable" && (
                      <>
                        <Text style={S.modalLabel}>{t.dailyCost}</Text>
                        <TextInput
                          value={newHabit.daily_cost}
                          onChangeText={v => setNewHabit(p => ({ ...p, daily_cost: v }))}
                          placeholder="e.g. 200"
                          style={S.modalInput}
                          keyboardType="numeric"
                          placeholderTextColor={C.muted}
                        />
                        {newHabit.daily_cost ? (
                          <View style={S.savingsHint}>
                            <Text style={{ color: "#059669", fontSize: 12, fontWeight: "600" }}>
                              💰 {t.ifResist} <Text style={{ fontWeight: "900" }}>+₺{safeNum(newHabit.daily_cost).toFixed(2)}</Text> {t.addedToSavings}
                            </Text>
                          </View>
                        ) : null}
                      </>
                    )}

                    {/* Non-spendable hint */}
                    {newHabit.habit_type === "non_spendable" && (
                      <View style={S.activityHint}>
                        <Text style={{ color: "#0369a1", fontSize: 12, fontWeight: "600" }}>
                          🏃 {t.willLog} "{t.did}" {t.or} "{t.didnt}" {t.daily}. {t.streakBuilds}
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity onPress={handleAddHabit} style={{ marginTop: 8 }}>
                      <LinearGradient colors={[C.primary, C.light]} style={S.modalSubmitBtn}>
                        <Plus size={16} color="white" />
                        <Text style={{ color: "white", fontWeight: "800", fontSize: 15, marginLeft: 6 }}>{t.addHabit}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </ScrollView>
                )}
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* ── RATING MODAL ── */}
        <Modal visible={showRating} transparent animationType="fade">
          <View style={S.ratingOverlay}>
            <View style={S.ratingCard}>
              <View style={S.ratingFace}>
                <Smile size={34} color="#f97316" />
              </View>
              <Text style={S.ratingTitle}>{t.quiz}</Text>
              <Text style={S.ratingSub}>{t.quizSub}</Text>
              <View style={S.ratingGrid}>
                {[1,2,3,4,5,6,7,8,9,10].map(sc => (
                  <TouchableOpacity
                    key={sc}
                    style={S.ratingBtn}
                    onPress={() => handleRating(sc)}
                  >
                    <Text style={S.ratingBtnText}>{sc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity onPress={() => setShowRating(false)}>
                <Text style={S.skipText}>{t.skip}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ── STYLES ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  // Auth
  authScroll: { flexGrow: 1, justifyContent: "center", padding: 24, backgroundColor: C.darkBg },
  authHeader: { alignItems: "center", marginBottom: 32 },
  authLogo: { width: 64, height: 64, borderRadius: 20, justifyContent: "center", alignItems: "center", marginBottom: 16, shadowColor: C.primary, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 },
  authBrandName: { color: "white", fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  authSlogan: { color: "#6060a0", fontSize: 14, marginTop: 6 },
  authCard: { backgroundColor: C.darkCard, borderRadius: 22, padding: 24, borderWidth: 1, borderColor: C.darkBorder },
  langBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#1e1e40", borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, alignSelf: "flex-start", marginBottom: 20 },
  langBtnText: { color: C.darkMuted, fontSize: 12 },
  fieldLabel: { color: C.darkMuted, fontSize: 11, fontWeight: "700", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.7 },
  darkInput: { backgroundColor: "#0d0d1f", borderWidth: 1, borderColor: C.darkBorder, borderRadius: 12, padding: 13, color: "white", fontSize: 14, marginBottom: 16 },
  passwordRow: { position: "relative", marginBottom: 16 },
  eyeBtn: { position: "absolute", right: 12, top: 14 },
  authBtn: { borderRadius: 13, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  authBtnText: { color: "white", fontWeight: "800", fontSize: 15 },
  authError: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(239,68,68,0.1)", borderWidth: 1, borderColor: "rgba(239,68,68,0.25)", borderRadius: 10, padding: 10, marginBottom: 12, gap: 8 },
  authErrorText: { color: "#f87171", fontSize: 13, flex: 1 },
  backLink: { color: "#6060a0", fontSize: 13, marginBottom: 16 },
  demoBox: { marginTop: 16, backgroundColor: "#0d0d1f", borderRadius: 11, padding: 12 },
  demoTitle: { color: "#8080b0", fontSize: 11, fontWeight: "700", marginBottom: 4 },
  demoText: { color: "#5050a0", fontSize: 12, lineHeight: 20 },

  // Admin
  adminHeader: { backgroundColor: "#0f0f20", borderBottomWidth: 1, borderColor: "#1a1a35", padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  adminBrand: { flexDirection: "row", alignItems: "center", gap: 10 },
  adminIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  adminTitle: { color: "white", fontWeight: "700", fontSize: 14 },
  adminEmail: { color: "#6060a0", fontSize: 11 },
  adminLangBtn: { backgroundColor: "#1a1a35", borderRadius: 8, padding: 8 },
  adminLogoutBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(239,68,68,0.12)", borderWidth: 1, borderColor: "rgba(239,68,68,0.25)", borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  statCard: { backgroundColor: "#0f0f20", borderWidth: 1, borderRadius: 14, padding: 14, minWidth: (SCREEN_WIDTH - 52) / 3 - 4 },
  statValue: { fontSize: 22, fontWeight: "800", marginVertical: 4 },
  statLabel: { color: "#6060a0", fontSize: 10 },
  adminSection: { backgroundColor: "#0f0f20", borderWidth: 1, borderColor: "#1a1a35", borderRadius: 18, padding: 16, marginBottom: 14 },
  adminSectionTitle: { color: "white", fontSize: 15, fontWeight: "700", marginBottom: 12 },
  chartRow: { flexDirection: "row", gap: 4, alignItems: "flex-end", height: 60 },
  chartCol: { flex: 1, alignItems: "center", gap: 3 },
  chartBar: { width: "100%", borderRadius: 3 },
  chartLabel: { fontSize: 8, color: "#6060a0" },
  adminMsg: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 8, backgroundColor: "#1a1a35", borderRadius: 10, marginBottom: 6 },
  delBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(239,68,68,0.1)", borderRadius: 6, paddingVertical: 4, paddingHorizontal: 6 },
  adminUserRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#0f0f20", borderWidth: 1, borderColor: "#1a1a35", borderRadius: 16, padding: 14, marginBottom: 10 },
  adminUserName: { color: "white", fontWeight: "600", fontSize: 14 },
  adminUserEmail: { color: "#6060a0", fontSize: 12, marginTop: 1 },
  blockedBadge: { backgroundColor: "rgba(239,68,68,0.2)", borderRadius: 99, paddingHorizontal: 6, paddingVertical: 1 },
  adminAction: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 8, marginBottom: 4 },

  // App Header
  appHeader: { backgroundColor: "white", paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderColor: C.border, shadowColor: C.primary, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  headerLogo: { width: 32, height: 32, borderRadius: 9, justifyContent: "center", alignItems: "center" },
  headerBrand: { fontSize: 16, fontWeight: "900", color: C.primary, letterSpacing: -0.3, marginLeft: 8 },
  langToggle: { backgroundColor: "#f0f0ff", borderRadius: 8, padding: 7 },

  // Scroll
  scrollContent: { padding: 16, paddingBottom: 100 },

  // Savings Card
  welcomeText: { fontSize: 13, color: C.muted, marginBottom: 10 },
  savingsCard: { borderRadius: 24, padding: 22, marginBottom: 16, overflow: "hidden", shadowColor: C.primary, shadowOpacity: 0.25, shadowRadius: 20, elevation: 8 },
  savingsLabel: { fontSize: 9, color: "rgba(255,255,255,0.6)", fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 },
  savingsValue: { fontSize: 36, fontWeight: "900", color: "white", letterSpacing: -1 },
  savingsSub: { fontSize: 11, color: "rgba(255,255,255,0.6)" },
  savingsBar: { height: 4, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 99, marginTop: 12, overflow: "hidden" },
  savingsBarFill: { height: "100%", backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 99 },

  // Search
  searchRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "white", borderWidth: 1.5, borderColor: C.border, borderRadius: 14, paddingHorizontal: 13 },
  searchInput: { flex: 1, fontSize: 14, color: C.text, paddingVertical: 11, marginLeft: 8 },
  addBtn: { width: 48, height: 48, borderRadius: 12, justifyContent: "center", alignItems: "center", shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },

  // Legend
  legend: { flexDirection: "row", gap: 12, marginBottom: 10, flexWrap: "wrap" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 99 },
  legendText: { fontSize: 10, color: C.muted },

  // Empty State
  emptyState: { alignItems: "center", padding: 40, backgroundColor: "white", borderRadius: 18, borderWidth: 1.5, borderColor: C.border, borderStyle: "dashed", marginBottom: 16 },

  // Habit Grid
  habitGrid: { flexDirection: "row", flexWrap: "wrap", gap: 11, marginBottom: 16 },
  habitCard: { width: (SCREEN_WIDTH - 43) / 2, backgroundColor: "white", borderRadius: 20, padding: 14, borderWidth: 1.5, borderColor: C.border, shadowColor: C.primary, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  habitTitle: { fontWeight: "800", fontSize: 13, color: C.text, lineHeight: 18, marginBottom: 2 },
  habitGoal: { fontSize: 10, color: C.muted, fontStyle: "italic", marginBottom: 6 },
  progressBar: { height: 4, backgroundColor: "#f0f0ff", borderRadius: 99, overflow: "hidden", marginBottom: 8 },
  progressFill: { height: "100%", borderRadius: 99 },
  costBadge: { backgroundColor: "#ede9fe", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  activityBadge: { backgroundColor: "#e0f2fe", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusBadge: { borderRadius: 10, paddingVertical: 7, alignItems: "center", marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: "700", textAlign: "center" },
  actionBtnPrimary: { paddingVertical: 8, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#10b981" },
  actionBtnDanger: { paddingVertical: 8, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#ef4444" },
  actionBtnText: { color: "white", fontWeight: "700", fontSize: 10 },

  // Progress Section
  progressSection: { backgroundColor: "white", borderWidth: 1.5, borderColor: C.border, borderRadius: 18, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: C.text, marginBottom: 12 },

  // Tabs
  tabHeader: { padding: 16, paddingBottom: 8 },
  tabTitle: { fontSize: 20, fontWeight: "900", color: C.text, marginBottom: 12 },
  subTab: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 10, backgroundColor: "white", borderWidth: 1.5, borderColor: C.border },
  subTabActive: { backgroundColor: C.primary, borderColor: C.primary },
  subTabText: { fontSize: 12, fontWeight: "700", color: C.muted },

  // Community
  memberCard: { backgroundColor: "white", borderWidth: 1.5, borderColor: C.border, borderRadius: 18, padding: 16, alignItems: "center", gap: 8 },

  // Chat input
  chatInputRow: { flexDirection: "row", gap: 8, padding: 12, borderTopWidth: 1, borderColor: C.border, backgroundColor: "white" },
  chatInput: { flex: 1, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: C.text },
  sendBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },

  // Friends
  card: { backgroundColor: "white", borderWidth: 1.5, borderColor: C.border, borderRadius: 18, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 10 },
  lightInput: { backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, padding: 10, fontSize: 13, color: C.text },
  searchBtn: { backgroundColor: C.primary, borderRadius: 10, width: 44, justifyContent: "center", alignItems: "center" },
  userRow: { flexDirection: "row", alignItems: "center", backgroundColor: C.bg, borderRadius: 11, padding: 9, marginTop: 10 },
  addFriendBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#ede9fe", borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
  acceptBtn: { backgroundColor: C.success, borderRadius: 9, paddingVertical: 6, paddingHorizontal: 14 },
  friendCard: { flexDirection: "row", alignItems: "center", backgroundColor: "white", borderWidth: 1.5, borderColor: C.border, borderRadius: 16, padding: 14, marginBottom: 9 },
  chatBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#ede9fe", borderRadius: 10, paddingVertical: 7, paddingHorizontal: 12 },

  // Private Chat
  privateChatHeader: { flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: 1, borderColor: C.border, backgroundColor: "white" },
  backBtn: { backgroundColor: "#f0f0ff", borderRadius: 10, width: 38, height: 38, justifyContent: "center", alignItems: "center", marginRight: 10 },

  // Profile
  profileCard: { borderRadius: 22, padding: 28, alignItems: "center", marginBottom: 16, shadowColor: C.primary, shadowOpacity: 0.2, shadowRadius: 20, elevation: 6 },
  profileAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center", marginBottom: 10 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginBottom: 14 },
  profileStat: { width: (SCREEN_WIDTH - 41) / 2, borderWidth: 1.5, borderColor: C.border, borderRadius: 14, padding: 14 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(239,68,68,0.06)", borderWidth: 1.5, borderColor: "rgba(239,68,68,0.15)", borderRadius: 14, padding: 14 },

  // Bottom Nav
  bottomNav: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.96)", borderTopWidth: 1, borderColor: C.border, paddingVertical: 8, paddingBottom: Platform.OS === "ios" ? 20 : 8, shadowColor: C.primary, shadowOpacity: 0.06, shadowRadius: 10, elevation: 8 },
  navItem: { flex: 1, alignItems: "center", gap: 2 },
  navIconWrap: { padding: 6, borderRadius: 10 },
  navIconActive: { backgroundColor: "#ede9fe" },
  navLabel: { fontSize: 10, color: C.muted },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "white", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: SCREEN_HEIGHT * 0.85 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  modalTitle: { fontSize: 17, fontWeight: "900", color: C.text },
  typeCard: { flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 2, borderColor: C.border, borderRadius: 16, padding: 16, backgroundColor: "white" },
  typeIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  typeTitle: { fontWeight: "800", fontSize: 14, color: C.text },
  typeDesc: { fontSize: 12, color: C.muted, marginTop: 2 },
  modalBackBtn: { backgroundColor: "#f0f0ff", borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10 },
  typePill: { borderRadius: 99, paddingVertical: 4, paddingHorizontal: 10 },
  modalLabel: { fontSize: 11, fontWeight: "700", color: C.muted, marginTop: 12, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.6 },
  modalInput: { backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, borderRadius: 11, padding: 13, fontSize: 14, color: C.text },
  savingsHint: { backgroundColor: "#f0fdf4", borderRadius: 10, padding: 10, marginTop: 8 },
  activityHint: { backgroundColor: "#f0f9ff", borderRadius: 10, padding: 10, marginTop: 8 },
  modalSubmitBtn: { borderRadius: 13, paddingVertical: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 16 },

  // Rating Modal
  ratingOverlay: { flex: 1, backgroundColor: "rgba(15,15,26,0.75)", justifyContent: "center", alignItems: "center", padding: 20 },
  ratingCard: { backgroundColor: "white", borderRadius: 26, padding: 28, width: "100%", maxWidth: 320, alignItems: "center" },
  ratingFace: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#fff7ed", borderWidth: 4, borderColor: "#fed7aa", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  ratingTitle: { fontSize: 18, fontWeight: "800", color: C.text, marginBottom: 4 },
  ratingSub: { fontSize: 12, color: C.muted, marginBottom: 20, textAlign: "center" },
  ratingGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center", width: "100%", marginBottom: 16 },
  ratingBtn: { width: (SCREEN_WIDTH * 0.6) / 5 - 6, aspectRatio: 1, backgroundColor: "#f5f5fb", borderWidth: 1.5, borderColor: C.border, borderRadius: 11, justifyContent: "center", alignItems: "center" },
  ratingBtnText: { fontWeight: "800", fontSize: 14, color: C.text },
  skipText: { fontSize: 11, fontWeight: "700", color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 },
});