import { useState, useEffect, useRef } from "react";
import {
  TrendingUp, Smile, Plus, Home, Users, LogOut, Globe, ShieldCheck,
  Search, X, BarChart2, Zap, Eye, EyeOff, User, AlertCircle, Heart,
  Send, UserPlus, MessageCircle, Trash2, CheckCircle, Trophy, Ban,
  ShieldOff, Shield
} from "lucide-react";
import { io } from "socket.io-client";

const API = "http://localhost:3001/api";

async function api(path, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

const T = {
  en: {
    appName: "iTrack", login: "Sign In", register: "Create Account", logout: "Sign Out",
    email: "Email", password: "Password", name: "Full Name",
    welcome: "Welcome back,", savings: "Total Savings (₺)",
    dailyTasks: "Daily Habits", myProgress: "My Progress",
    resisted: "💪 I Resisted", spent: "😔 I Spent",
    resistedDone: "✅ Resisted — Saved", spentDone: "❌ Spent today",
    quiz: "How do you feel?", quizSub: "Rate your self-discipline (1-10)",
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
  }
};

const C = {
  primary: "#6366f1", light: "#818cf8", bg: "#f5f5fb",
  card: "white", border: "#efefff", text: "#111827", muted: "#6b7280",
  success: "#10b981", warning: "#f59e0b", danger: "#ef4444",
};

const SS = {
  darkPage: { minHeight:"100vh", background:"#0d0d1f", display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem", fontFamily:"'Segoe UI',sans-serif" },
  card: { background:"#161630", border:"1px solid #252550", borderRadius:22, padding:"2rem", width:"100%", maxWidth:400 },
  input: { width:"100%", padding:"12px 14px", background:"#0d0d1f", border:"1px solid #252550", borderRadius:12, color:"white", fontSize:14, outline:"none", boxSizing:"border-box" },
  label: { display:"block", color:"#8080b0", fontSize:11, marginBottom:6, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase" },
  btn: { width:"100%", padding:"13px", background:"linear-gradient(135deg,#6366f1,#818cf8)", border:"none", borderRadius:13, color:"white", fontWeight:800, fontSize:15, cursor:"pointer" },
  error: { background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:10, padding:"10px 14px", color:"#f87171", fontSize:13, marginBottom:"1rem", display:"flex", alignItems:"center", gap:8 },
};

function Avatar({ name, id, size = 40 }) {
  const hue = (id || 0) * 67 % 360;
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:`hsl(${hue},55%,88%)`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:`hsl(${hue},55%,35%)`, fontSize:size*0.38, flexShrink:0 }}>
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState("en");
  const [page, setPage] = useState("check-email");
  const [tab, setTab] = useState("home");
  const [currentUser, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [onlineIds, setOnlineIds] = useState([]);

  const [emailInput, setEmailInput] = useState("");
  const [passInput, setPassInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setLoading] = useState(false);

  const [habits, setHabits] = useState([]);
  const [searchQ, setSearchQ] = useState("");
  const [showRating, setShowRating] = useState(false);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [habitStep, setHabitStep] = useState("type"); // "type" | "details"
  const [newHabit, setNewHabit] = useState({ name:"", goal:"", daily_cost:"", habit_type:"" });

  const [friends, setFriends] = useState([]);
  const [pendingReqs, setPending] = useState([]);
  const [searchUsers, setSearchUsers] = useState([]);
  const [userSearchQ, setUserSearchQ] = useState("");
  const [chatFriend, setChatFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const msgEnd = useRef(null);

  const [publicMessages, setPublicMessages] = useState([]);
  const [publicMsgInput, setPublicMsgInput] = useState("");
  const [communitySubTab, setCommunitySubTab] = useState("chat");
  const [communityUsers, setCommunityUsers] = useState([]);
  const pubMsgEnd = useRef(null);

  const [adminUsers, setAdminUsers] = useState([]);

  const t = T[lang];
  const isRtl = lang === "ar";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    api("/me").then(u => {
      setUser(u); setHabits(u.habits || []);
      setPage(u.role === "admin" ? "admin" : "home");
      connectSocket(token);
    }).catch(() => localStorage.removeItem("token"));
  }, []);

  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);
  useEffect(() => { pubMsgEnd.current?.scrollIntoView({ behavior:"smooth" }); }, [publicMessages]);

  useEffect(() => {
    if (tab === "friends" && currentUser) {
      api("/friends").then(setFriends);
      api("/friends/pending").then(setPending);
    }
    if (tab === "community" && currentUser) {
      api("/public-messages").then(setPublicMessages).catch(() => {});
      api("/users/search?q=").then(setCommunityUsers).catch(() => {});
    }
  }, [tab, currentUser]);

  useEffect(() => {
    if (page === "admin") api("/admin/users").then(setAdminUsers);
  }, [page]);

  function connectSocket(token) {
    const s = io("http://localhost:3001", { auth: { token } });
    s.on("online_users", ids => setOnlineIds(ids));
    s.on("new_message", msg => setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]));
    s.on("new_public_message", msg => setPublicMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]));
    s.on("public_message_deleted", ({ id }) => setPublicMessages(prev => prev.filter(m => m.id !== id)));
    s.on("account_blocked", () => {
      alert(t.blocked);
      localStorage.removeItem("token");
      s.disconnect();
      setUser(null); setPage("check-email");
    });
    setSocket(s);
  }

  async function handleCheckEmail() {
    if (!emailInput.trim()) return;
    setLoading(true); setAuthError("");
    try {
      const { exists } = await api("/auth/check-email", { method:"POST", body:{ email:emailInput } });
      setPage(exists ? "login" : "register");
    } catch(e) { setAuthError(e.message); }
    setLoading(false);
  }

  async function handleLogin() {
    setLoading(true); setAuthError("");
    try {
      const { token, user } = await api("/auth/login", { method:"POST", body:{ email:emailInput, password:passInput } });
      localStorage.setItem("token", token);
      setUser(user);
      const me = await api("/me");
      setHabits(me.habits || []);
      setPage(user.role === "admin" ? "admin" : "home");
      connectSocket(token);
    } catch(e) { setAuthError(e.message || t.loginError); }
    setLoading(false);
  }

  async function handleRegister() {
    if (!nameInput.trim() || !passInput.trim()) return;
    setLoading(true); setAuthError("");
    try {
      const { token, user } = await api("/auth/register", { method:"POST", body:{ name:nameInput, email:emailInput, password:passInput } });
      localStorage.setItem("token", token);
      setUser(user); setHabits([]);
      setPage("home"); connectSocket(token);
    } catch(e) { setAuthError(e.message); }
    setLoading(false);
  }

  function handleLogout() {
    localStorage.removeItem("token"); socket?.disconnect();
    setUser(null); setHabits([]); setSocket(null);
    setPage("check-email"); setEmailInput(""); setPassInput("");
  }

  async function handleHabitAction(habitId, type) {
    try {
      const res = await api(`/habits/${habitId}/action`, { method:"PATCH", body:{ type } });
      const saved = parseFloat(res.savedAmount) || 0;
      setHabits(prev => prev.map(h =>
        h.id === habitId
          ? { ...h, actedToday:true, action_type:type, streak:res.newStreak, progress:res.newProgress, reward: h.reward }
          : h
      ));
      if (type === 'resisted' && saved > 0) {
        setUser(u => ({ ...u, savings: (parseFloat(u.savings) || 0) + saved }));
      }
      setShowRating(true);
    } catch(e) { console.error("Action error:", e); }
  }

  async function handleRating(score) {
    try {
      await api("/me/satisfaction", { method:"PATCH", body:{ score } });
      setUser(u => ({ ...u, satisfaction: score }));
    } catch(e) { console.error(e); }
    setShowRating(false);
  }

  async function handleAddHabit() {
    if (!newHabit.name.trim()) return;
    try {
      const habit = await api("/habits", { method:"POST", body: newHabit });
      setHabits(prev => [...prev, habit]);
      setNewHabit({ name:"", goal:"", daily_cost:"", habit_type:"" });
      setHabitStep("type");
      setShowAddHabit(false);
    } catch(e) { console.error(e); }
  }

  async function handleDeleteHabit(habitId) {
    if (!confirm("Delete this habit?")) return;
    await api(`/habits/${habitId}`, { method:"DELETE" });
    setHabits(prev => prev.filter(h => h.id !== habitId));
  }

  async function searchForUsers() {
    if (!userSearchQ.trim()) return;
    const r = await api(`/users/search?q=${encodeURIComponent(userSearchQ)}`);
    setSearchUsers(r);
  }

  async function sendFriendReq(friendId) {
    await api("/friends/request", { method:"POST", body:{ friendId } });
    setSearchUsers(prev => prev.filter(u => u.id !== friendId));
  }

  async function acceptReq(userId) {
    await api(`/friends/${userId}/accept`, { method:"PATCH" });
    setPending(prev => prev.filter(u => u.id !== userId));
    api("/friends").then(setFriends);
  }

  async function openChat(friend) {
    setChatFriend(friend); setTab("chat");
    const msgs = await api(`/messages/${friend.id}`);
    setMessages(msgs);
  }

  function sendMessage() {
    if (!msgInput.trim() || !socket || !chatFriend) return;
    socket.emit("send_message", { receiverId:chatFriend.id, text:msgInput });
    setMsgInput("");
  }

  function sendPublicMessage() {
    if (!publicMsgInput.trim() || !socket) return;
    socket.emit("send_public_message", { text:publicMsgInput });
    setPublicMsgInput("");
  }

  async function deletePublicMessage(id) {
    await api(`/admin/public-messages/${id}`, { method:"DELETE" });
  }

  async function blockUser(id, blocked) {
    await api(`/admin/users/${id}/block`, { method:"PATCH", body:{ blocked } });
    setAdminUsers(prev => prev.map(u => u.id === id ? { ...u, blocked } : u));
  }

  async function deleteUser(id) {
    if (!confirm("Permanently delete this user and all their data?")) return;
    await api(`/admin/users/${id}`, { method:"DELETE" });
    setAdminUsers(prev => prev.filter(u => u.id !== id));
  }

  const safeNum = v => parseFloat(v) || 0;
  const visibleHabits = habits.filter(h => h.name.toLowerCase().includes(searchQ.toLowerCase()));
  const savedToday = habits.filter(h => h.actedToday && h.action_type === 'resisted').reduce((s, h) => s + safeNum(h.reward), 0);
  const resistedCount = habits.filter(h => h.actedToday && h.action_type === 'resisted').length;

  // ── CHECK EMAIL ────────────────────────────────────────────────────────────────
  if (page === "check-email") return (
    <div style={SS.darkPage} dir={isRtl?"rtl":"ltr"}>
      <div style={{ width:"100%", maxWidth:400 }}>
        <div style={{ textAlign:"center", marginBottom:"2.5rem" }}>
          <div style={{ width:64,height:64,borderRadius:20,background:"linear-gradient(135deg,#6366f1,#818cf8)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:"0 20px 60px #6366f144" }}>
            <Zap size={30} color="white"/>
          </div>
          <h1 style={{ color:"white",fontSize:28,fontWeight:900,margin:"0 0 6px",letterSpacing:"-0.5px" }}>{t.appName}</h1>
          <p style={{ color:"#6060a0",fontSize:14 }}>Track habits. Save money. Build discipline.</p>
        </div>
        <div style={SS.card}>
          <button onClick={()=>setLang(l=>l==="en"?"ar":"en")} style={{ background:"#1e1e40",border:"none",borderRadius:8,padding:"6px 14px",color:"#8080b0",fontSize:12,cursor:"pointer",marginBottom:"1.5rem",display:"flex",alignItems:"center",gap:6 }}>
            <Globe size={13}/> {lang==="en"?"العربية":"English"}
          </button>
          <div style={{ marginBottom:"1.25rem" }}>
            <label style={SS.label}>{t.email}</label>
            <input value={emailInput} onChange={e=>{ setEmailInput(e.target.value); setAuthError(""); }} onKeyDown={e=>e.key==="Enter"&&handleCheckEmail()} style={SS.input} type="email" placeholder="you@example.com"/>
          </div>
          {authError && <div style={SS.error}><AlertCircle size={14}/>{authError}</div>}
          <button onClick={handleCheckEmail} disabled={authLoading} style={SS.btn}>{authLoading?"...":"Continue →"}</button>
          <div style={{ marginTop:"1.5rem",background:"#0d0d1f",borderRadius:12,padding:"1rem",fontSize:12,color:"#5050a0",lineHeight:2 }}>
            <div style={{ fontWeight:700,color:"#8080b0",marginBottom:4 }}>Demo:</div>
            <div>Admin: admin@admin.ad / admin1234</div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── LOGIN ────────────────────────────────────────────────────────────────────
  if (page === "login") return (
    <div style={SS.darkPage} dir={isRtl?"rtl":"ltr"}>
      <div style={SS.card}>
        <button onClick={()=>setPage("check-email")} style={{ background:"none",border:"none",color:"#6060a0",cursor:"pointer",marginBottom:"1.25rem",fontSize:13 }}>← Back</button>
        <div style={{ marginBottom:"1.5rem" }}>
          <div style={{ width:44,height:44,borderRadius:14,background:"linear-gradient(135deg,#6366f1,#818cf8)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12 }}><Zap size={20} color="white"/></div>
          <h2 style={{ color:"white",margin:0,fontWeight:900,fontSize:22 }}>{t.login}</h2>
        </div>
        <div style={{ marginBottom:"1rem" }}>
          <label style={SS.label}>{t.email}</label>
          <input value={emailInput} readOnly style={{ ...SS.input,opacity:0.5 }}/>
        </div>
        <div style={{ marginBottom:"1.5rem",position:"relative" }}>
          <label style={SS.label}>{t.password}</label>
          <input value={passInput} onChange={e=>{ setPassInput(e.target.value); setAuthError(""); }} onKeyDown={e=>e.key==="Enter"&&handleLogin()} style={{ ...SS.input,paddingRight:44 }} type={showPass?"text":"password"} placeholder="••••••••"/>
          <button onClick={()=>setShowPass(p=>!p)} style={{ position:"absolute",right:12,top:33,background:"none",border:"none",color:"#6060a0",cursor:"pointer" }}>
            {showPass?<EyeOff size={16}/>:<Eye size={16}/>}
          </button>
        </div>
        {authError && <div style={SS.error}><AlertCircle size={14}/>{authError}</div>}
        <button onClick={handleLogin} disabled={authLoading} style={SS.btn}>{authLoading?"...":t.login}</button>
      </div>
    </div>
  );

  // ── REGISTER ───────────────────────────────────────────────────────────────
  if (page === "register") return (
    <div style={SS.darkPage} dir={isRtl?"rtl":"ltr"}>
      <div style={SS.card}>
        <button onClick={()=>setPage("check-email")} style={{ background:"none",border:"none",color:"#6060a0",cursor:"pointer",marginBottom:"1.25rem",fontSize:13 }}>← Back</button>
        <div style={{ marginBottom:"1.5rem" }}>
          <div style={{ width:44,height:44,borderRadius:14,background:"linear-gradient(135deg,#6366f1,#818cf8)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12 }}><Zap size={20} color="white"/></div>
          <h2 style={{ color:"white",margin:0,fontWeight:900,fontSize:22 }}>{t.register}</h2>
        </div>
        {[
          { label:t.name, val:nameInput, set:setNameInput, type:"text", ph:"Your full name" },
          { label:t.email, val:emailInput, set:setEmailInput, type:"email", ph:"you@example.com" },
          { label:t.password, val:passInput, set:setPassInput, type:"password", ph:"••••••••" },
        ].map(f => (
          <div key={f.label} style={{ marginBottom:"1rem" }}>
            <label style={SS.label}>{f.label}</label>
            <input value={f.val} onChange={e=>{ f.set(e.target.value); setAuthError(""); }} type={f.type} placeholder={f.ph} style={SS.input}/>
          </div>
        ))}
        {authError && <div style={SS.error}><AlertCircle size={14}/>{authError}</div>}
        <button onClick={handleRegister} disabled={authLoading} style={{ ...SS.btn,marginTop:"0.5rem" }}>{authLoading?"...":t.register}</button>
      </div>
    </div>
  );

  // ── ADMIN PANEL ────────────────────────────────────────────────────────────
  if (page === "admin") {
    const totalH = adminUsers.reduce((s,u)=>s+u.habits.length,0);
    const avgSat = avg(adminUsers.map(u=>u.satisfaction));
    const avgPr  = avg(adminUsers.flatMap(u=>u.habits.map(h=>h.progress)));
    return (
      <div style={{ minHeight:"100vh",background:"#08080f",color:"white",fontFamily:"'Segoe UI',sans-serif" }} dir={isRtl?"rtl":"ltr"}>
        <div style={{ background:"#0f0f20",borderBottom:"1px solid #1a1a35",padding:"1rem 1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#f59e0b,#ef4444)",display:"flex",alignItems:"center",justifyContent:"center" }}><ShieldCheck size={18} color="white"/></div>
            <div>
              <div style={{ fontWeight:700,fontSize:15 }}>{t.adminPanel} — {t.appName}</div>
              <div style={{ fontSize:11,color:"#6060a0" }}>{currentUser?.email}</div>
            </div>
          </div>
          <div style={{ display:"flex",gap:8 }}>
            <button onClick={()=>setLang(l=>l==="en"?"ar":"en")} style={{ background:"#1a1a35",border:"none",borderRadius:8,padding:"6px 12px",color:"#8080b0",fontSize:12,cursor:"pointer" }}><Globe size={13}/></button>
            <button onClick={handleLogout} style={{ background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:8,padding:"6px 12px",color:"#f87171",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:5 }}><LogOut size={13}/> {t.logout}</button>
          </div>
        </div>

        <div style={{ padding:"1.5rem",maxWidth:1100,margin:"0 auto" }}>
          {/* Stats */}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:12,marginBottom:"1.5rem" }}>
            {[
              { label:t.totalUsers,      value:adminUsers.length,                         icon:<Users size={20}/>,       color:"#6366f1" },
              { label:t.avgSatisfaction, value:avgSat+"/10",                              icon:<Heart size={20}/>,       color:"#ec4899" },
              { label:t.totalHabits,     value:totalH,                                    icon:<CheckCircle size={20}/>, color:"#10b981" },
              { label:"Avg Progress",    value:avgPr+"%",                                 icon:<BarChart2 size={20}/>,   color:"#f59e0b" },
              { label:"Blocked",         value:adminUsers.filter(u=>u.blocked).length,    icon:<Ban size={20}/>,        color:"#ef4444" },
            ].map(c=>(
              <div key={c.label} style={{ background:"#0f0f20",border:"1px solid #1a1a35",borderRadius:16,padding:"1.1rem" }}>
                <div style={{ width:38,height:38,borderRadius:10,background:`${c.color}22`,display:"flex",alignItems:"center",justifyContent:"center",color:c.color,marginBottom:8 }}>{c.icon}</div>
                <div style={{ fontSize:22,fontWeight:800,color:"white" }}>{c.value}</div>
                <div style={{ fontSize:11,color:"#6060a0",marginTop:2 }}>{c.label}</div>
              </div>
            ))}
          </div>

          {/* Satisfaction chart */}
          <div style={{ background:"#0f0f20",border:"1px solid #1a1a35",borderRadius:20,padding:"1.5rem",marginBottom:"1.5rem" }}>
            <h3 style={{ margin:"0 0 1rem",fontSize:15,fontWeight:700,color:"#e0e0f0" }}>Satisfaction Distribution</h3>
            <div style={{ display:"flex",gap:6,alignItems:"flex-end",height:80 }}>
              {[1,2,3,4,5,6,7,8,9,10].map(score=>{
                const count=adminUsers.filter(u=>u.satisfaction===score).length;
                const h=count?Math.max(16,count*28):4;
                return (
                  <div key={score} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}>
                    <div style={{ height:h,background:score>=7?"#10b981":score>=4?"#f59e0b":"#ef4444",borderRadius:4,width:"100%",transition:"height 0.3s" }}/>
                    <span style={{ fontSize:9,color:"#6060a0" }}>{score}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Public chat moderation */}
          <div style={{ background:"#0f0f20",border:"1px solid #1a1a35",borderRadius:20,padding:"1.25rem",marginBottom:"1.5rem" }}>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:"1rem" }}>
              <MessageCircle size={16} color="#818cf8"/>
              <h3 style={{ margin:0,fontSize:15,fontWeight:700 }}>Public Chat — Moderation</h3>
              <span style={{ marginLeft:"auto",fontSize:12,color:"#6060a0" }}>{publicMessages.length} messages</span>
            </div>
            <div style={{ maxHeight:240,overflowY:"auto",display:"flex",flexDirection:"column",gap:6 }}>
              {publicMessages.length===0 && <div style={{ color:"#6060a0",fontSize:13 }}>No public messages yet.</div>}
              {publicMessages.map(m=>(
                <div key={m.id} style={{ display:"flex",alignItems:"flex-start",gap:8,padding:"8px 10px",background:"#1a1a35",borderRadius:10 }}>
                  <Avatar name={m.sender_name} id={m.sender_id} size={28}/>
                  <div style={{ flex:1 }}>
                    <span style={{ fontSize:12,fontWeight:700,color:"#a0a0e0" }}>{m.sender_name}</span>
                    {m.sender_role==="admin" && <span style={{ marginLeft:5,fontSize:10,background:"rgba(99,102,241,0.3)",color:"#818cf8",padding:"1px 6px",borderRadius:5,fontWeight:700 }}>{t.adminBadge}</span>}
                    <p style={{ margin:"2px 0 0",fontSize:13,color:"#d0d0f0" }}>{m.content}</p>
                  </div>
                  <button onClick={()=>deletePublicMessage(m.id)} style={{ background:"rgba(239,68,68,0.1)",border:"none",borderRadius:6,padding:"4px 8px",color:"#f87171",cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",gap:3 }}>
                    <Trash2 size={11}/> Del
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Users table */}
          <div style={{ background:"#0f0f20",border:"1px solid #1a1a35",borderRadius:20,overflow:"hidden" }}>
            <div style={{ padding:"1.25rem 1.5rem",borderBottom:"1px solid #1a1a35",display:"flex",alignItems:"center",gap:8 }}>
              <Users size={16} color="#6366f1"/>
              <h3 style={{ margin:0,fontSize:15,fontWeight:700 }}>{t.usersTable}</h3>
            </div>
            {adminUsers.map((u,i)=>(
              <div key={u.id} style={{ padding:"1rem 1.5rem",borderBottom:i<adminUsers.length-1?"1px solid #1a1a35":"none",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",opacity:u.blocked?0.6:1 }}>
                <Avatar name={u.name} id={u.id} size={40}/>
                <div style={{ flex:1,minWidth:120 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                    <span style={{ fontWeight:600,fontSize:14 }}>{u.name}</span>
                    {u.blocked && <span style={{ fontSize:10,background:"rgba(239,68,68,0.2)",color:"#f87171",padding:"1px 7px",borderRadius:99,fontWeight:700 }}>BLOCKED</span>}
                  </div>
                  <div style={{ fontSize:12,color:"#6060a0" }}>{u.email}</div>
                  <div style={{ fontSize:11,color:"#404060",marginTop:2 }}>Joined: {new Date(u.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ textAlign:"center",minWidth:50 }}>
                  <div style={{ fontSize:16,fontWeight:700,color:"#818cf8" }}>{u.habits.length}</div>
                  <div style={{ fontSize:10,color:"#6060a0" }}>habits</div>
                </div>
                <div style={{ minWidth:100 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",fontSize:11,color:"#8080a0",marginBottom:3 }}>
                    <span>{t.progress}</span>
                    <span>{u.habits.length?avg(u.habits.map(h=>h.progress)):0}%</span>
                  </div>
                  <div style={{ height:5,background:"#1a1a35",borderRadius:99,overflow:"hidden" }}>
                    <div style={{ height:"100%",background:"linear-gradient(90deg,#6366f1,#818cf8)",borderRadius:99,width:`${u.habits.length?avg(u.habits.map(h=>h.progress)):0}%` }}/>
                  </div>
                </div>
                <div style={{ textAlign:"center",minWidth:60 }}>
                  <div style={{ fontSize:14,fontWeight:700,color:"#10b981" }}>₺{u.savings}</div>
                  <div style={{ fontSize:10,color:"#6060a0" }}>savings</div>
                </div>
                <div style={{ textAlign:"center",minWidth:50 }}>
                  <div style={{ background:u.satisfaction>=7?"rgba(16,185,129,0.15)":u.satisfaction>=4?"rgba(245,158,11,0.15)":"rgba(239,68,68,0.15)",color:u.satisfaction>=7?"#10b981":u.satisfaction>=4?"#f59e0b":"#ef4444",padding:"3px 8px",borderRadius:99,fontSize:11,fontWeight:700,display:"inline-block" }}>{u.satisfaction}/10</div>
                </div>
                {/* Block / Unblock */}
                <button onClick={()=>blockUser(u.id, !u.blocked)} style={{ background:u.blocked?"rgba(16,185,129,0.1)":"rgba(245,158,11,0.1)",border:`1px solid ${u.blocked?"rgba(16,185,129,0.3)":"rgba(245,158,11,0.3)"}`,borderRadius:8,padding:"6px 10px",color:u.blocked?"#10b981":"#f59e0b",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontSize:12 }}>
                  {u.blocked?<><Shield size={13}/> {t.unblockUser}</>:<><Ban size={13}/> {t.blockUser}</>}
                </button>
                {/* Delete */}
                <button onClick={()=>deleteUser(u.id)} style={{ background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,padding:"6px 10px",color:"#f87171",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontSize:12 }}>
                  <Trash2 size={13}/> {t.deleteUser}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── USER APP ───────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex",flexDirection:"column",minHeight:"100vh",background:C.bg,fontFamily:"'Segoe UI',sans-serif",direction:isRtl?"rtl":"ltr" }}>
      <header style={{ background:"white",padding:"0.85rem 1.25rem",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:30,boxShadow:"0 1px 20px rgba(99,102,241,0.06)" }}>
        <div style={{ display:"flex",alignItems:"center",gap:9 }}>
          <div style={{ width:33,height:33,borderRadius:10,background:"linear-gradient(135deg,#6366f1,#818cf8)",display:"flex",alignItems:"center",justifyContent:"center" }}><Zap size={15} color="white"/></div>
          <span style={{ fontWeight:900,fontSize:16,color:C.primary,letterSpacing:"-0.3px" }}>{t.appName}</span>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <button onClick={()=>setLang(l=>l==="en"?"ar":"en")} style={{ background:"#f0f0ff",border:"none",borderRadius:8,padding:"5px 10px",color:C.primary,fontSize:11,cursor:"pointer",fontWeight:600 }}><Globe size={13}/></button>
          <button onClick={handleLogout} style={{ background:"none",border:"none",cursor:"pointer",color:C.muted }}><LogOut size={18}/></button>
        </div>
      </header>

      <main style={{ flex:1,overflowY:"auto",padding:"1.15rem",paddingBottom:80 }}>

        {/* ── HOME ── */}
        {tab==="home" && <>
          <p style={{ fontSize:13,color:C.muted,margin:"0 0 2px" }}>{t.welcome} <strong style={{ color:C.text }}>{currentUser?.name}</strong></p>

          {/* Savings card */}
          <div style={{ background:"linear-gradient(135deg,#4338ca,#7c3aed)",borderRadius:24,padding:"1.4rem",marginBottom:"1.15rem",position:"relative",overflow:"hidden",boxShadow:"0 16px 48px rgba(99,102,241,0.22)" }}>
            <div style={{ position:"absolute",right:-15,bottom:-15,opacity:0.07 }}><TrendingUp size={110}/></div>
            <p style={{ fontSize:9,letterSpacing:"0.14em",color:"rgba(255,255,255,0.5)",textTransform:"uppercase",margin:"0 0 6px" }}>{t.savings}</p>
            <div style={{ fontSize:38,fontWeight:900,color:"white",letterSpacing:"-1px" }}>₺{safeNum(currentUser?.savings).toFixed(2)}</div>
            <div style={{ display:"flex",gap:16,marginTop:10 }}>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.5)" }}>Today saved: <strong style={{ color:"rgba(255,255,255,0.85)" }}>₺{savedToday.toFixed(2)}</strong></div>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.5)" }}>Resisted: <strong style={{ color:"rgba(255,255,255,0.85)" }}>{resistedCount}/{habits.length}</strong></div>
            </div>
            <div style={{ marginTop:"0.9rem",height:4,background:"rgba(255,255,255,0.15)",borderRadius:99,overflow:"hidden" }}>
              <div style={{ height:"100%",background:"rgba(255,255,255,0.65)",borderRadius:99,width:`${Math.min(100,(safeNum(currentUser?.savings)/1000)*100)}%`,transition:"width 0.6s" }}/>
            </div>
          </div>

          {/* Search + add */}
          <div style={{ display:"flex",gap:8,marginBottom:"1rem" }}>
            <div style={{ position:"relative",flex:1 }}>
              <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder={t.search} style={{ width:"100%",padding:"11px 16px 11px 40px",background:"white",border:`1.5px solid ${C.border}`,borderRadius:14,fontSize:14,outline:"none",color:C.text,boxSizing:"border-box" }}/>
              <Search size={16} color={C.muted} style={{ position:"absolute",left:13,top:12 }}/>
            </div>
            <button onClick={()=>setShowAddHabit(true)} style={{ display:"flex",alignItems:"center",gap:5,background:"linear-gradient(135deg,#6366f1,#818cf8)",border:"none",borderRadius:12,padding:"0 14px",color:"white",fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",boxShadow:"0 4px 14px rgba(99,102,241,0.3)" }}>
              <Plus size={15}/> {t.addHabit}
            </button>
          </div>

          {/* Habit legend */}
          <div style={{ display:"flex",gap:10,marginBottom:"0.75rem",fontSize:11,color:C.muted,flexWrap:"wrap" }}>
            <span style={{ display:"flex",alignItems:"center",gap:4 }}><span style={{ width:8,height:8,borderRadius:"50%",background:"#10b981",display:"inline-block" }}/> Resisted/Did = savings or streak</span>
            <span style={{ display:"flex",alignItems:"center",gap:4 }}><span style={{ width:8,height:8,borderRadius:"50%",background:"#ef4444",display:"inline-block" }}/> Spent/Didn't = streak resets</span>
          </div>

          {habits.length===0 && (
            <div style={{ textAlign:"center",padding:"2.5rem 1rem",color:C.muted,fontSize:14,background:"white",borderRadius:18,border:`1.5px dashed ${C.border}` }}>
              <div style={{ fontSize:36,marginBottom:8 }}>🎯</div>
              {t.noHabits}
            </div>
          )}

          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:11,marginBottom:"1.25rem" }}>
            {visibleHabits.map(h=>(
              <div key={h.id} style={{ background:h.actedToday?(h.action_type==="resisted"?"#f0fdf8":"#fff5f5"):"white",border:`1.5px solid ${h.actedToday?(h.action_type==="resisted"?"#a7f3d0":"#fecaca"):C.border}`,borderRadius:20,padding:"1rem",display:"flex",flexDirection:"column",gap:7,boxShadow:"0 2px 12px rgba(99,102,241,0.05)" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  {h.habit_type === "non_spendable" ? (
                    <span style={{ background:"#e0f2fe",color:"#0369a1",fontSize:10,fontWeight:800,padding:"3px 8px",borderRadius:8 }}>🏃 Activity</span>
                  ) : (
                    <span style={{ background:"#ede9fe",color:C.primary,fontSize:10,fontWeight:800,padding:"3px 8px",borderRadius:8 }}>₺{safeNum(h.reward)}/day</span>
                  )}
                  <div style={{ display:"flex",alignItems:"center",gap:5 }}>
                    <span style={{ fontSize:11,color:"#f59e0b",fontWeight:700 }}>🔥{h.streak}</span>
                    <button onClick={()=>handleDeleteHabit(h.id)} style={{ background:"none",border:"none",cursor:"pointer",color:"#fca5a5",padding:2,display:"flex" }}><Trash2 size={12}/></button>
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight:800,fontSize:13,color:C.text,lineHeight:1.3 }}>{h.name}</div>
                  {h.goal && <div style={{ fontSize:10,color:C.muted,marginTop:1,fontStyle:"italic" }}>{h.goal}</div>}
                </div>
                <div style={{ height:4,background:"#f0f0ff",borderRadius:99,overflow:"hidden" }}>
                  <div style={{ height:"100%",background:h.actedToday?(h.action_type==="resisted"?"#10b981":"#ef4444"):C.primary,borderRadius:99,width:`${h.progress}%`,transition:"width 0.5s" }}/>
                </div>
                {h.actedToday ? (
                  <div style={{ textAlign:"center",padding:"8px 0",borderRadius:11,background:
                    (h.action_type==="resisted"||h.action_type==="did")?"#dcfce7":"#fee2e2",fontSize:12,fontWeight:700,color:
                    (h.action_type==="resisted"||h.action_type==="did")?"#059669":"#dc2626" }}>
                    {h.action_type==="resisted" ? `${t.resistedDone} ₺${safeNum(h.reward)}!`
                    : h.action_type==="did" ? t.didDone
                    : h.action_type==="spent" ? t.spentDone
                    : t.didntDone}
                  </div>
                ) : (
                  h.habit_type === "non_spendable" ? (
                    <div style={{ display:"flex",gap:5 }}>
                      <button onClick={()=>handleHabitAction(h.id,"did")} style={{ flex:1,padding:"8px 0",borderRadius:11,border:"none",background:"linear-gradient(135deg,#10b981,#34d399)",color:"white",fontWeight:700,fontSize:11,cursor:"pointer" }}>
                        {t.did}
                      </button>
                      <button onClick={()=>handleHabitAction(h.id,"didnt")} style={{ flex:1,padding:"8px 0",borderRadius:11,border:"none",background:"linear-gradient(135deg,#ef4444,#f87171)",color:"white",fontWeight:700,fontSize:11,cursor:"pointer" }}>
                        {t.didnt}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display:"flex",gap:5 }}>
                      <button onClick={()=>handleHabitAction(h.id,"resisted")} style={{ flex:1,padding:"8px 0",borderRadius:11,border:"none",background:"linear-gradient(135deg,#10b981,#34d399)",color:"white",fontWeight:700,fontSize:11,cursor:"pointer" }}>
                        {t.resisted}
                      </button>
                      <button onClick={()=>handleHabitAction(h.id,"spent")} style={{ flex:1,padding:"8px 0",borderRadius:11,border:"none",background:"linear-gradient(135deg,#ef4444,#f87171)",color:"white",fontWeight:700,fontSize:11,cursor:"pointer" }}>
                        {t.spent}
                      </button>
                    </div>
                  )
                )}
              </div>
            ))}
          </div>

          {habits.length>0 && (
            <div style={{ background:"white",border:`1.5px solid ${C.border}`,borderRadius:20,padding:"1.15rem" }}>
              <h3 style={{ margin:"0 0 1rem",fontSize:14,fontWeight:800,color:C.text }}>{t.myProgress}</h3>
              {habits.map(h=>(
                <div key={h.id} style={{ marginBottom:"0.7rem" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted,marginBottom:4 }}>
                    <span style={{ fontWeight:700,color:C.text }}>{h.name}</span>
                    <span style={{ fontWeight:800,color:C.primary }}>{h.progress}%</span>
                  </div>
                  <div style={{ height:5,background:"#f0f0ff",borderRadius:99,overflow:"hidden" }}>
                    <div style={{ height:"100%",background:h.actedToday&&h.action_type==="resisted"?"#10b981":"linear-gradient(90deg,#6366f1,#818cf8)",borderRadius:99,width:`${h.progress}%`,transition:"width 0.6s" }}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>}

        {/* ── COMMUNITY ── */}
        {tab==="community" && (
          <div style={{ display:"flex",flexDirection:"column",height:"calc(100vh - 145px)" }}>
            <div style={{ marginBottom:"1rem" }}>
              <h2 style={{ fontSize:19,fontWeight:900,color:C.text,margin:"0 0 10px" }}>{t.communityTitle}</h2>
              <div style={{ display:"flex",gap:8 }}>
                {[
                  { id:"chat", label:`💬 ${t.publicChat}` },
                  { id:"members", label:`👥 ${t.members}` },
                ].map(s=>(
                  <button key={s.id} onClick={()=>setCommunitySubTab(s.id)} style={{ padding:"7px 16px",borderRadius:11,border:"none",background:communitySubTab===s.id?"linear-gradient(135deg,#6366f1,#818cf8)":"white",color:communitySubTab===s.id?"white":C.muted,fontSize:12,fontWeight:700,cursor:"pointer",boxShadow:communitySubTab===s.id?"0 4px 14px rgba(99,102,241,0.3)":"none",border:communitySubTab===s.id?"none":`1.5px solid ${C.border}` }}>
                    {s.label}
                  </button>
                ))}
                <span style={{ marginLeft:"auto",fontSize:12,color:C.muted,display:"flex",alignItems:"center",gap:4 }}>
                  <div style={{ width:7,height:7,borderRadius:"50%",background:C.success }}/> {onlineIds.length} online
                </span>
              </div>
            </div>

            {communitySubTab==="members" && (
              <div style={{ overflowY:"auto",flex:1 }}>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                  {communityUsers.map(u=>(
                    <div key={u.id} style={{ background:"white",border:`1.5px solid ${C.border}`,borderRadius:18,padding:"1rem",display:"flex",flexDirection:"column",alignItems:"center",gap:8,textAlign:"center" }}>
                      <div style={{ position:"relative" }}>
                        <Avatar name={u.name} id={u.id} size={52}/>
                        {onlineIds.includes(u.id) && <div style={{ width:12,height:12,borderRadius:"50%",background:C.success,border:"2px solid white",position:"absolute",bottom:2,right:2 }}/>}
                      </div>
                      <div>
                        <div style={{ fontWeight:700,fontSize:14,color:C.text }}>{u.name}</div>
                        {onlineIds.includes(u.id) && <div style={{ fontSize:11,color:C.success,fontWeight:600,marginTop:2 }}>{t.online}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {communitySubTab==="chat" && (
              <div style={{ display:"flex",flexDirection:"column",flex:1,background:"white",borderRadius:20,border:`1.5px solid ${C.border}`,overflow:"hidden" }}>
                <div style={{ padding:"10px 14px",borderBottom:`1px solid ${C.border}`,fontSize:12,color:C.muted,display:"flex",alignItems:"center",gap:6 }}>
                  <div style={{ width:8,height:8,borderRadius:"50%",background:C.success }}/> Public chat — visible to everyone
                </div>
                <div style={{ flex:1,overflowY:"auto",padding:"1rem",display:"flex",flexDirection:"column",gap:10 }}>
                  {publicMessages.length===0 && <div style={{ textAlign:"center",color:C.muted,fontSize:13,marginTop:"2rem" }}>{t.noPublicMsgs}</div>}
                  {publicMessages.map(m=>{
                    const mine = m.sender_id === currentUser?.id;
                    const isAdmin = m.sender_role === "admin";
                    return (
                      <div key={m.id} style={{ display:"flex",gap:8,flexDirection:mine?"row-reverse":"row" }}>
                        <Avatar name={m.sender_name} id={m.sender_id} size={32}/>
                        <div style={{ maxWidth:"72%",display:"flex",flexDirection:"column",gap:2,alignItems:mine?"flex-end":"flex-start" }}>
                          <div style={{ display:"flex",alignItems:"center",gap:5 }}>
                            <span style={{ fontSize:11,fontWeight:700,color:isAdmin?C.primary:C.muted }}>{mine?"You":m.sender_name}</span>
                            {isAdmin && <span style={{ fontSize:9,background:"#ede9fe",color:C.primary,padding:"1px 6px",borderRadius:5,fontWeight:700 }}>{t.adminBadge}</span>}
                          </div>
                          <div style={{ padding:"9px 12px",borderRadius:mine?"16px 16px 4px 16px":"16px 16px 16px 4px",background:mine?"linear-gradient(135deg,#6366f1,#818cf8)":isAdmin?"#ede9fe":"#f5f5fb",color:mine?"white":C.text,fontSize:14 }}>
                            {m.content}
                            <div style={{ fontSize:10,opacity:0.6,marginTop:3,textAlign:"right" }}>{new Date(m.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>
                          </div>
                        </div>
                        {currentUser?.role==="admin" && !mine && (
                          <button onClick={()=>deletePublicMessage(m.id)} style={{ background:"none",border:"none",cursor:"pointer",color:"#fca5a5",alignSelf:"center",padding:3 }}><Trash2 size={13}/></button>
                        )}
                      </div>
                    );
                  })}
                  <div ref={pubMsgEnd}/>
                </div>
                <div style={{ display:"flex",gap:8,padding:"0.75rem",borderTop:`1px solid ${C.border}` }}>
                  <input value={publicMsgInput} onChange={e=>setPublicMsgInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendPublicMessage()} placeholder={t.typePublic} style={{ flex:1,padding:"10px 14px",background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:12,fontSize:14,outline:"none",color:C.text }}/>
                  <button onClick={sendPublicMessage} style={{ background:"linear-gradient(135deg,#6366f1,#818cf8)",border:"none",borderRadius:12,padding:"10px 15px",color:"white",cursor:"pointer" }}><Send size={15}/></button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── FRIENDS ── */}
        {tab==="friends" && <>
          <h2 style={{ fontSize:19,fontWeight:900,color:C.text,marginBottom:"1.15rem" }}>{t.friends}</h2>
          <div style={{ background:"white",border:`1.5px solid ${C.border}`,borderRadius:18,padding:"1.1rem",marginBottom:"1rem" }}>
            <div style={{ fontWeight:700,fontSize:14,color:C.text,marginBottom:10 }}>{t.addFriend}</div>
            <div style={{ display:"flex",gap:8 }}>
              <input value={userSearchQ} onChange={e=>setUserSearchQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&searchForUsers()} placeholder={t.searchUsers} style={{ flex:1,padding:"9px 12px",background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:10,fontSize:13,outline:"none",color:C.text }}/>
              <button onClick={searchForUsers} style={{ background:C.primary,border:"none",borderRadius:10,padding:"9px 14px",color:"white",cursor:"pointer" }}><Search size={15}/></button>
            </div>
            {searchUsers.map(u=>(
              <div key={u.id} style={{ display:"flex",alignItems:"center",gap:10,marginTop:10,padding:"9px",background:C.bg,borderRadius:11 }}>
                <Avatar name={u.name} id={u.id} size={34}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700,fontSize:13,color:C.text }}>{u.name}</div>
                  <div style={{ fontSize:11,color:C.muted }}>{u.email}</div>
                </div>
                <button onClick={()=>sendFriendReq(u.id)} style={{ background:"#ede9fe",border:"none",borderRadius:8,padding:"6px 12px",color:C.primary,cursor:"pointer",display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:700 }}>
                  <UserPlus size={13}/> Add
                </button>
              </div>
            ))}
          </div>
          {pendingReqs.length>0 && (
            <div style={{ background:"#fffbeb",border:"1.5px solid #fde68a",borderRadius:18,padding:"1rem",marginBottom:"1rem" }}>
              <div style={{ fontWeight:700,fontSize:14,color:"#92400e",marginBottom:10 }}>{t.friendReq} ({pendingReqs.length})</div>
              {pendingReqs.map(u=>(
                <div key={u.id} style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
                  <Avatar name={u.name} id={u.id} size={34}/>
                  <div style={{ flex:1,fontWeight:700,fontSize:13,color:C.text }}>{u.name}</div>
                  <button onClick={()=>acceptReq(u.id)} style={{ background:C.success,border:"none",borderRadius:9,padding:"6px 14px",color:"white",cursor:"pointer",fontSize:12,fontWeight:700 }}>Accept</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ fontWeight:700,fontSize:14,color:C.text,marginBottom:10 }}>{t.myFriends}</div>
          {friends.filter(f=>f.status==="accepted").map(f=>(
            <div key={f.id} style={{ background:"white",border:`1.5px solid ${C.border}`,borderRadius:16,padding:"0.9rem",marginBottom:9,display:"flex",alignItems:"center",gap:10 }}>
              <div style={{ position:"relative" }}>
                <Avatar name={f.name} id={f.id} size={42}/>
                {onlineIds.includes(f.id) && <div style={{ width:10,height:10,borderRadius:"50%",background:C.success,border:"2px solid white",position:"absolute",bottom:0,right:0 }}/>}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700,fontSize:14,color:C.text }}>{f.name}</div>
                <div style={{ fontSize:11,color:onlineIds.includes(f.id)?C.success:C.muted }}>{onlineIds.includes(f.id)?t.online:f.email}</div>
              </div>
              <button onClick={()=>openChat(f)} style={{ background:"#ede9fe",border:"none",borderRadius:10,padding:"7px 14px",color:C.primary,cursor:"pointer",display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:700 }}>
                <MessageCircle size={13}/> {t.chat}
              </button>
            </div>
          ))}
        </>}

        {/* ── PRIVATE CHAT ── */}
        {tab==="chat" && chatFriend && (
          <div style={{ display:"flex",flexDirection:"column",height:"calc(100vh - 160px)" }}>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:"1rem" }}>
              <button onClick={()=>setTab("friends")} style={{ background:"#f0f0ff",border:"none",borderRadius:10,padding:"7px 12px",cursor:"pointer",fontSize:13,color:C.primary,fontWeight:600 }}>←</button>
              <Avatar name={chatFriend.name} id={chatFriend.id} size={36}/>
              <div>
                <div style={{ fontWeight:700,fontSize:14,color:C.text }}>{chatFriend.name}</div>
                <div style={{ fontSize:11,color:C.muted }}>🔒 End-to-end encrypted</div>
              </div>
            </div>
            <div style={{ flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:8,paddingBottom:"0.5rem" }}>
              {messages.length===0 && <div style={{ textAlign:"center",color:C.muted,fontSize:13,marginTop:"2rem" }}>{t.noMessages}</div>}
              {messages.map(m=>{
                const mine = m.sender_id===currentUser.id;
                return (
                  <div key={m.id} style={{ display:"flex",justifyContent:mine?"flex-end":"flex-start" }}>
                    <div style={{ maxWidth:"75%",padding:"10px 14px",borderRadius:mine?"18px 18px 4px 18px":"18px 18px 18px 4px",background:mine?"linear-gradient(135deg,#6366f1,#818cf8)":"white",color:mine?"white":C.text,fontSize:14,border:mine?"none":`1px solid ${C.border}` }}>
                      {m.content}
                      <div style={{ fontSize:10,opacity:0.55,marginTop:4,textAlign:"right" }}>{new Date(m.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={msgEnd}/>
            </div>
            <div style={{ display:"flex",gap:8,paddingTop:"0.75rem",borderTop:`1px solid ${C.border}` }}>
              <input value={msgInput} onChange={e=>setMsgInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMessage()} placeholder={t.sendMsg} style={{ flex:1,padding:"11px 14px",background:"white",border:`1.5px solid ${C.border}`,borderRadius:14,fontSize:14,outline:"none",color:C.text }}/>
              <button onClick={sendMessage} style={{ background:"linear-gradient(135deg,#6366f1,#818cf8)",border:"none",borderRadius:13,padding:"11px 16px",color:"white",cursor:"pointer" }}><Send size={16}/></button>
            </div>
          </div>
        )}

        {/* ── PROFILE ── */}
        {tab==="profile" && (
          <div>
            <h2 style={{ fontSize:19,fontWeight:900,color:C.text,marginBottom:"1.15rem" }}>{t.profile}</h2>
            <div style={{ background:"linear-gradient(135deg,#6366f1,#818cf8)",borderRadius:22,padding:"1.75rem",textAlign:"center",marginBottom:"1rem",boxShadow:"0 16px 48px #6366f133" }}>
              <div style={{ width:72,height:72,borderRadius:"50%",background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:900,color:"white",margin:"0 auto 10px" }}>{currentUser?.name?.charAt(0)}</div>
              <div style={{ fontSize:18,fontWeight:800,color:"white" }}>{currentUser?.name}</div>
              <div style={{ fontSize:12,color:"rgba(255,255,255,0.6)",marginTop:2 }}>{currentUser?.email}</div>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:"1rem" }}>
              {[
                { label:"Savings",      val:`₺${safeNum(currentUser?.savings).toFixed(2)}`, color:"#10b981", bg:"#f0fdf4" },
                { label:"Habits",       val:habits.length,                                      color:C.primary, bg:"#f5f3ff" },
                { label:"Satisfaction", val:`${currentUser?.satisfaction??0}/10`,               color:"#f59e0b", bg:"#fffbeb" },
                { label:"Best Streak",  val:`${habits.reduce((m,h)=>Math.max(m,h.streak),0)}🔥`, color:"#ec4899", bg:"#fdf2f8" },
              ].map(s=>(
                <div key={s.label} style={{ background:s.bg,border:`1.5px solid ${C.border}`,borderRadius:16,padding:"1rem" }}>
                  <div style={{ fontSize:20,fontWeight:900,color:s.color }}>{s.val}</div>
                  <div style={{ fontSize:11,color:C.muted,marginTop:3 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <button onClick={handleLogout} style={{ width:"100%",padding:"13px",background:"rgba(239,68,68,0.06)",border:"1.5px solid rgba(239,68,68,0.15)",borderRadius:14,color:C.danger,fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
              <LogOut size={16}/> {t.logout}
            </button>
          </div>
        )}
      </main>

      {/* ── NAV ── */}
      <nav style={{ position:"sticky",bottom:0,background:"rgba(255,255,255,0.95)",backdropFilter:"blur(16px)",borderTop:`1px solid ${C.border}`,padding:"0.5rem 0.25rem",display:"flex",justifyContent:"space-around",zIndex:40,boxShadow:"0 -4px 20px rgba(99,102,241,0.06)" }}>
        {[
          { id:"home",      icon:<Home size={19}/>,     label:t.home },
          { id:"community", icon:<Trophy size={19}/>,   label:t.community },
          { id:"friends",   icon:<UserPlus size={19}/>, label:t.friends },
          { id:"profile",   icon:<User size={19}/>,     label:t.profile },
        ].map(n=>(
          <button key={n.id} onClick={()=>setTab(n.id)} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",color:tab===n.id?C.primary:C.muted,fontWeight:tab===n.id?700:400,fontSize:10,padding:"4px 8px",minWidth:52 }}>
            <div style={{ padding:"5px 10px",borderRadius:10,background:tab===n.id?"#ede9fe":"transparent",transition:"background 0.15s" }}>{n.icon}</div>
            <span>{n.label}</span>
          </button>
        ))}
      </nav>

      {/* ── ADD HABIT MODAL ── */}
      {showAddHabit && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(10px)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:"1.5rem" }}>
          <div style={{ background:"white",borderRadius:24,padding:"1.5rem",width:"100%",maxWidth:420,boxShadow:"0 20px 60px rgba(0,0,0,0.15)" }}>

            {/* Header */}
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.25rem" }}>
              <div>
                <h3 style={{ margin:0,fontSize:17,fontWeight:900,color:C.text }}>{t.addHabit}</h3>
                <p style={{ margin:"4px 0 0",fontSize:12,color:C.muted }}>
                  {habitStep==="type" ? t.habitTypeQ : newHabit.habit_type==="spendable" ? "How much does this habit cost daily?" : "What activity do you want to track?"}
                </p>
              </div>
              <button onClick={()=>{ setShowAddHabit(false); setHabitStep("type"); setNewHabit({ name:"", goal:"", daily_cost:"", habit_type:"" }); }} style={{ background:"#f3f4f6",border:"none",borderRadius:9,padding:8,cursor:"pointer" }}><X size={16}/></button>
            </div>

            {/* Step 1: Type selection */}
            {habitStep === "type" && (
              <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                <button onClick={()=>{ setNewHabit(p=>({...p, habit_type:"spendable"})); setHabitStep("details"); }}
                  style={{ padding:"1.1rem 1.25rem",borderRadius:16,border:`2px solid ${C.border}`,background:"white",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:14,transition:"all 0.15s" }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.primary; e.currentTarget.style.background="#f5f3ff"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.background="white"; }}
                >
                  <div style={{ width:48,height:48,borderRadius:14,background:"#ede9fe",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0 }}>💸</div>
                  <div>
                    <div style={{ fontWeight:800,fontSize:14,color:C.text }}>{t.habitTypeSpend}</div>
                    <div style={{ fontSize:12,color:C.muted,marginTop:2 }}>{t.habitTypeSpendDesc}</div>
                  </div>
                </button>
                <button onClick={()=>{ setNewHabit(p=>({...p, habit_type:"non_spendable"})); setHabitStep("details"); }}
                  style={{ padding:"1.1rem 1.25rem",borderRadius:16,border:`2px solid ${C.border}`,background:"white",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:14,transition:"all 0.15s" }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor="#10b981"; e.currentTarget.style.background="#f0fdf4"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.background="white"; }}
                >
                  <div style={{ width:48,height:48,borderRadius:14,background:"#dcfce7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0 }}>🏃</div>
                  <div>
                    <div style={{ fontWeight:800,fontSize:14,color:C.text }}>{t.habitTypeNonSpend}</div>
                    <div style={{ fontSize:12,color:C.muted,marginTop:2 }}>{t.habitTypeNonSpendDesc}</div>
                  </div>
                </button>
              </div>
            )}

            {/* Step 2: Details */}
            {habitStep === "details" && (
              <>
                {/* Type indicator pill */}
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:"1rem" }}>
                  <button onClick={()=>setHabitStep("type")} style={{ background:"#f0f0ff",border:"none",borderRadius:8,padding:"5px 10px",color:C.primary,fontSize:12,cursor:"pointer",fontWeight:600 }}>← Back</button>
                  <span style={{ background:newHabit.habit_type==="spendable"?"#ede9fe":"#dcfce7",color:newHabit.habit_type==="spendable"?C.primary:"#059669",fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:99 }}>
                    {newHabit.habit_type==="spendable"? t.habitTypeSpend : t.habitTypeNonSpend}
                  </span>
                </div>

                {/* Habit Name */}
                <div style={{ marginBottom:"1rem" }}>
                  <label style={{ display:"block",fontSize:11,fontWeight:700,color:C.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em" }}>{t.habitName}</label>
                  <input
                    value={newHabit.name}
                    onChange={e=>setNewHabit(p=>({...p, name:e.target.value}))}
                    type="text"
                    placeholder={newHabit.habit_type==="spendable" ? "e.g. Smoking, Coffee, Gaming" : "e.g. Running, Early sleep, Meditation"}
                    style={{ width:"100%",padding:"11px 13px",background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:11,fontSize:14,outline:"none",boxSizing:"border-box",color:C.text }}
                  />
                </div>

                {/* Description */}
                <div style={{ marginBottom:"1rem" }}>
                  <label style={{ display:"block",fontSize:11,fontWeight:700,color:C.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em" }}>{t.habitDesc}</label>
                  <input
                    value={newHabit.goal}
                    onChange={e=>setNewHabit(p=>({...p, goal:e.target.value}))}
                    type="text"
                    placeholder={newHabit.habit_type==="spendable" ? "e.g. Quit smoking to save money" : "e.g. Run 10km every day"}
                    style={{ width:"100%",padding:"11px 13px",background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:11,fontSize:14,outline:"none",boxSizing:"border-box",color:C.text }}
                  />
                </div>

                {/* Daily Cost — only for spendable */}
                {newHabit.habit_type === "spendable" && (
                  <>
                    <div style={{ marginBottom:"1rem" }}>
                      <label style={{ display:"block",fontSize:11,fontWeight:700,color:C.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em" }}>{t.dailyCost}</label>
                      <input
                        value={newHabit.daily_cost}
                        onChange={e=>setNewHabit(p=>({...p, daily_cost:e.target.value}))}
                        type="number"
                        placeholder="e.g. 200"
                        style={{ width:"100%",padding:"11px 13px",background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:11,fontSize:14,outline:"none",boxSizing:"border-box",color:C.text }}
                      />
                    </div>
                    {newHabit.daily_cost && (
                      <div style={{ background:"#f0fdf4",borderRadius:10,padding:"10px 14px",marginBottom:"1rem",fontSize:12,color:"#059669",fontWeight:600 }}>
                        💰 If you resist: <strong>+₺{safeNum(newHabit.daily_cost).toFixed(2)}</strong> added to savings each day
                      </div>
                    )}
                  </>
                )}

                {/* Info for non-spendable */}
                {newHabit.habit_type === "non_spendable" && (
                  <div style={{ background:"#f0f9ff",borderRadius:10,padding:"10px 14px",marginBottom:"1rem",fontSize:12,color:"#0369a1",fontWeight:600 }}>
                    🏃 You'll log "{t.did}" or "{t.didnt}" daily. Streak builds with each success!
                  </div>
                )}

                <button onClick={handleAddHabit} style={{ width:"100%",padding:"13px",background:"linear-gradient(135deg,#6366f1,#818cf8)",border:"none",borderRadius:13,color:"white",fontWeight:800,fontSize:15,cursor:"pointer" }}>
                  <Plus size={16} style={{ verticalAlign:"middle",marginRight:6 }}/>{t.addHabit}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── RATING MODAL (no money — just satisfaction) ── */}
      {showRating && (
        <div style={{ position:"fixed",inset:0,background:"rgba(15,15,26,0.75)",backdropFilter:"blur(12px)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem" }}>
          <div style={{ background:"white",borderRadius:26,padding:"2rem",width:"100%",maxWidth:320,textAlign:"center" }}>
            <div style={{ width:68,height:68,borderRadius:"50%",background:"#fff7ed",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",border:"4px solid #fed7aa" }}><Smile size={34} color="#f97316"/></div>
            <h3 style={{ fontSize:18,fontWeight:800,color:C.text,margin:"0 0 4px" }}>{t.quiz}</h3>
            <p style={{ fontSize:12,color:C.muted,margin:"0 0 1.25rem" }}>{t.quizSub}</p>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:"1rem" }}>
              {[1,2,3,4,5,6,7,8,9,10].map(sc=>(
                <button key={sc} onClick={()=>handleRating(sc)}
                  style={{ padding:"11px 0",background:"#f5f5fb",border:`1.5px solid ${C.border}`,borderRadius:11,fontWeight:800,fontSize:14,color:C.text,cursor:"pointer" }}
                  onMouseEnter={e=>{ e.currentTarget.style.background=C.primary; e.currentTarget.style.color="white"; e.currentTarget.style.borderColor=C.primary; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background="#f5f5fb"; e.currentTarget.style.color=C.text; e.currentTarget.style.borderColor=C.border; }}
                >{sc}</button>
              ))}
            </div>
            <button onClick={()=>setShowRating(false)} style={{ background:"none",border:"none",color:C.muted,fontSize:11,fontWeight:700,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.05em" }}>Skip</button>
          </div>
        </div>
      )}
    </div>
  );
}