// iTrack App
import { useState, useEffect, useRef } from "react";
import {
  TrendingUp, Smile, Plus, Home, Users,
  LogOut, Globe, ShieldCheck, Search, X,
  BarChart2, Zap, Eye, EyeOff,
  User, AlertCircle, Heart, Send, UserPlus, MessageCircle, Trash2, CheckCircle
} from "lucide-react";
import { io } from "socket.io-client";

const API = "http://localhost:3001/api";

async function api(path, options = {}) {
  const token = localStorage.getItem("token");
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

const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

const T = {
  en: {
    appName:"iTrack", login:"Sign In", register:"Create Account", logout:"Sign Out",
    email:"Email", password:"Password", name:"Full Name",
    welcome:"Welcome back,", boost:"Boost your power", savings:"Total Savings (₺)",
    dailyTasks:"Daily Tasks", myProgress:"My Progress",
    markDone:"Complete Now", completed:"COMPLETED",
    quiz:"How satisfied are you?", quizSub:"Rate the service (1-10) — your reward depends on it!",
    addHabit:"Add Habit", habitName:"Habit name", identityGoal:"Who do you want to become?",
    reward:"Reward (₺)", search:"Search habits…",
    home:"Home", community:"Community", profile:"Profile", friends:"Friends",
    adminPanel:"Admin Panel", totalUsers:"Total Users",
    avgSatisfaction:"Avg Satisfaction", totalHabits:"Total Habits",
    usersTable:"Users Overview", progress:"Progress",
    satisfaction:"Satisfaction", noHabits:"No habits yet.",
    loginError:"Invalid email or password.",
    sendMsg:"Send a message…", addFriend:"Add Friend", friendReq:"Friend Requests",
    myFriends:"My Friends", searchUsers:"Search users…",
    chat:"Chat", deleteUser:"Delete user",
    noMessages:"No messages yet. Say hi!", online:"Online",
  },
  ar: {
    appName:"iTrack", login:"تسجيل الدخول", register:"إنشاء حساب", logout:"تسجيل الخروج",
    email:"البريد الإلكتروني", password:"كلمة المرور", name:"الاسم الكامل",
    welcome:"أهلاً مجدداً،", boost:"عزّز قوتك اليوم", savings:"إجمالي التوفير (₺)",
    dailyTasks:"المهام اليومية", myProgress:"تقدمي الحالي",
    markDone:"إتمام الآن", completed:"مكتمل",
    quiz:"ما مستوى رضاك؟", quizSub:"قيّم من 1 إلى 10 — مكافأتك تعتمد على تقييمك!",
    addHabit:"إضافة عادة", habitName:"اسم العادة", identityGoal:"من تريد أن تصبح؟",
    reward:"المكافأة (₺)", search:"ابحث…",
    home:"الرئيسية", community:"المجتمع", profile:"الحساب", friends:"الأصدقاء",
    adminPanel:"لوحة المسؤول", totalUsers:"المستخدمون",
    avgSatisfaction:"متوسط الرضا", totalHabits:"إجمالي العادات",
    usersTable:"نظرة عامة", progress:"التقدم",
    satisfaction:"الرضا", noHabits:"لا توجد عادات.",
    loginError:"البريد أو كلمة المرور غير صحيحة.",
    sendMsg:"اكتب رسالة…", addFriend:"إضافة صديق", friendReq:"طلبات الصداقة",
    myFriends:"أصدقائي", searchUsers:"ابحث عن مستخدم…",
    chat:"محادثة", deleteUser:"حذف المستخدم",
    noMessages:"لا رسائل بعد. قل مرحباً!", online:"متصل",
  }
};

const SS = {
  darkPage: { minHeight:"100vh", background:"#0f0f1a", display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem", fontFamily:"'Segoe UI',sans-serif" },
  card:     { background:"#1a1a2e", border:"1px solid #2a2a4a", borderRadius:20, padding:"2rem", width:"100%", maxWidth:400 },
  input:    { width:"100%", padding:"12px 14px", background:"#0f0f1a", border:"1px solid #2a2a4a", borderRadius:12, color:"white", fontSize:14, outline:"none", boxSizing:"border-box" },
  label:    { display:"block", color:"#a0a0c0", fontSize:11, marginBottom:6, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase" },
  btn:      { width:"100%", padding:"13px", background:"linear-gradient(135deg,#6366f1,#818cf8)", border:"none", borderRadius:13, color:"white", fontWeight:800, fontSize:15, cursor:"pointer" },
  error:    { background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:10, padding:"10px 14px", color:"#f87171", fontSize:13, marginBottom:"1rem", display:"flex", alignItems:"center", gap:8 },
};

export default function App() {
  const [lang, setLang]         = useState("en");
  const [page, setPage]         = useState("check-email");
  const [tab, setTab]           = useState("home");
  const [currentUser, setUser]  = useState(null);
  const [socket, setSocket]     = useState(null);
  const [onlineIds, setOnlineIds] = useState([]);

  const [emailInput, setEmailInput] = useState("");
  const [passInput, setPassInput]   = useState("");
  const [nameInput, setNameInput]   = useState("");
  const [showPass, setShowPass]     = useState(false);
  const [authError, setAuthError]   = useState("");
  const [authLoading, setLoading]   = useState(false);

  const [habits, setHabits]             = useState([]);
  const [searchQ, setSearchQ]           = useState("");
  const [showQuiz, setShowQuiz]         = useState(false);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newHabit, setNewHabit]         = useState({ name:"", goal:"", reward:"" });
  const [satisfactionGiven, setSatisfied] = useState(false);

  // pendingReward: المبلغ المعلق حتى يتم التقييم
  const [pendingReward, setPendingReward] = useState(0);

  const [friends, setFriends]         = useState([]);
  const [pendingReqs, setPending]     = useState([]);
  const [searchUsers, setSearchUsers] = useState([]);
  const [userSearchQ, setUserSearchQ] = useState("");
  const [chatFriend, setChatFriend]   = useState(null);
  const [messages, setMessages]       = useState([]);
  const [msgInput, setMsgInput]       = useState("");
  const msgEnd                        = useRef(null);
  const [adminUsers, setAdminUsers]   = useState([]);

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

  useEffect(() => {
    if (tab === "friends" && currentUser) {
      api("/friends").then(setFriends);
      api("/friends/pending").then(setPending);
    }
  }, [tab, currentUser]);

  useEffect(() => {
    if (page === "admin") api("/admin/users").then(setAdminUsers);
  }, [page]);

  function connectSocket(token) {
    const s = io("http://localhost:3001", { auth: { token } });
    s.on("online_users", ids => setOnlineIds(ids));
    s.on("new_message", msg => setMessages(prev => prev.find(m=>m.id===msg.id) ? prev : [...prev, msg]));
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
    } catch { setAuthError(t.loginError); }
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

  // ── Complete Habit: يخزن المبلغ ويفتح الكويز بدون إضافة المال بعد ──────────
  async function handleComplete(habitId) {
    try {
      const res = await api(`/habits/${habitId}/complete`, { method:"PATCH" });
      // تحديث الـ streak والـ progress فوراً
      setHabits(prev => prev.map(h =>
        h.id === habitId ? { ...h, completed:true, streak:res.newStreak, progress:res.newProgress } : h
      ));
      // خزّن المبلغ المعلق وافتح الكويز
      setPendingReward(Number(res.addedSavings));
      setShowQuiz(true);
    } catch {}
  }

  // ── Satisfaction: احسب المال بناءً على التقييم ──────────────────────────────
  async function handleSatisfaction(score) {
    // المبلغ = المبلغ الكامل × (التقييم / 10)
    const earnedAmount = parseFloat(((pendingReward * score) / 10).toFixed(2));

    // تحديث قاعدة البيانات بالمبلغ الجديد والتقييم
    await api("/me/satisfaction", { method:"PATCH", body:{ score, earnedAmount } });

    // تحديث الواجهة فوراً
    setUser(u => ({ ...u, savings: Number(u.savings) + earnedAmount, satisfaction: score }));
    setPendingReward(0);
    setSatisfied(true);
    setShowQuiz(false);
  }

  async function handleAddHabit() {
    if (!newHabit.name.trim()) return;
    const habit = await api("/habits", { method:"POST", body:newHabit });
    setHabits(prev => [...prev, habit]);
    setNewHabit({ name:"", goal:"", reward:"" }); setShowAddHabit(false);
  }

  async function handleDeleteHabit(habitId) {
  if (!confirm("Delete this habit?")) return;

  try {
    await api(`/habits/${habitId}`, { method:"DELETE" });

    // تحديث فوري (real-time)
    setHabits(prev => prev.filter(h => h.id !== habitId));

  } catch (e) {
    console.error(e);
  }
}


  async function searchForUsers() {
    if (!userSearchQ.trim()) return;
    const r = await api(`/users/search?q=${encodeURIComponent(userSearchQ)}`);
    setSearchUsers(r);
  }

  async function sendFriendReq(friendId) {
    await api("/friends/request", { method:"POST", body:{ friendId } });
    setSearchUsers(prev => prev.filter(u=>u.id!==friendId));
  }

  async function acceptReq(userId) {
    await api(`/friends/${userId}/accept`, { method:"PATCH" });
    setPending(prev => prev.filter(u=>u.id!==userId));
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

  async function deleteUser(id) {
    if (!confirm("Delete this user?")) return;
    await api(`/admin/users/${id}`, { method:"DELETE" });
    setAdminUsers(prev => prev.filter(u=>u.id!==id));
  }

  const visibleHabits = habits.filter(h => h.name.toLowerCase().includes(searchQ.toLowerCase()));
  const completedCount = habits.filter(h=>h.completed).length;

  // ── CHECK EMAIL ──────────────────────────────────────────────────────────────
  if (page === "check-email") return (
    <div style={SS.darkPage} dir={isRtl?"rtl":"ltr"}>
      <div style={{ width:"100%", maxWidth:400 }}>
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ width:58,height:58,borderRadius:17,background:"linear-gradient(135deg,#6366f1,#818cf8)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px" }}><Zap size={26} color="white"/></div>
          <h1 style={{ color:"white", fontSize:26, fontWeight:900, margin:"0 0 4px" }}>{t.appName}</h1>
          <p style={{ color:"#6b7280", fontSize:13 }}>Build who you want to become</p>
        </div>
        <div style={SS.card}>
          <button onClick={()=>setLang(l=>l==="en"?"ar":"en")} style={{ background:"#2a2a4a",border:"none",borderRadius:8,padding:"6px 12px",color:"#a0a0c0",fontSize:12,cursor:"pointer",marginBottom:"1.5rem",display:"flex",alignItems:"center",gap:6 }}>
            <Globe size={13}/> {lang==="en"?"العربية":"English"}
          </button>
          <div style={{ marginBottom:"1rem" }}>
            <label style={SS.label}>{t.email}</label>
            <input value={emailInput} onChange={e=>{ setEmailInput(e.target.value); setAuthError(""); }} onKeyDown={e=>e.key==="Enter"&&handleCheckEmail()} style={SS.input} type="email" placeholder="you@example.com"/>
          </div>
          {authError && <div style={SS.error}><AlertCircle size={14}/>{authError}</div>}
          <button onClick={handleCheckEmail} disabled={authLoading} style={SS.btn}>{authLoading?"...":"Continue →"}</button>
          <div style={{ marginTop:"1.5rem",background:"#0f0f1a",borderRadius:11,padding:"1rem",fontSize:12,color:"#6b7280",lineHeight:1.8 }}>
            <div style={{ fontWeight:700,color:"#9ca3af",marginBottom:4 }}>Demo:</div>
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
        <button onClick={()=>setPage("check-email")} style={{ background:"none",border:"none",color:"#6b7280",cursor:"pointer",marginBottom:"1rem",fontSize:13 }}>← Back</button>
        <h2 style={{ color:"white",margin:"0 0 1.5rem",fontWeight:800 }}>{t.login}</h2>
        <div style={{ marginBottom:"1rem" }}>
          <label style={SS.label}>{t.email}</label>
          <input value={emailInput} readOnly style={{ ...SS.input,opacity:0.6 }}/>
        </div>
        <div style={{ marginBottom:"1.5rem",position:"relative" }}>
          <label style={SS.label}>{t.password}</label>
          <input value={passInput} onChange={e=>{ setPassInput(e.target.value); setAuthError(""); }} onKeyDown={e=>e.key==="Enter"&&handleLogin()} style={{ ...SS.input,paddingRight:42 }} type={showPass?"text":"password"} placeholder="••••••••"/>
          <button onClick={()=>setShowPass(p=>!p)} style={{ position:"absolute",right:12,top:34,background:"none",border:"none",color:"#6b7280",cursor:"pointer" }}>
            {showPass?<EyeOff size={16}/>:<Eye size={16}/>}
          </button>
        </div>
        {authError && <div style={SS.error}><AlertCircle size={14}/>{authError}</div>}
        <button onClick={handleLogin} disabled={authLoading} style={SS.btn}>{authLoading?"...":t.login}</button>
      </div>
    </div>
  );

  // ── REGISTER ─────────────────────────────────────────────────────────────────
  if (page === "register") return (
    <div style={SS.darkPage} dir={isRtl?"rtl":"ltr"}>
      <div style={SS.card}>
        <button onClick={()=>setPage("check-email")} style={{ background:"none",border:"none",color:"#6b7280",cursor:"pointer",marginBottom:"1rem",fontSize:13 }}>← Back</button>
        <h2 style={{ color:"white",margin:"0 0 1.5rem",fontWeight:800 }}>{t.register}</h2>
        {[
          { label:t.name,     val:nameInput,  set:setNameInput,  type:"text",     ph:"Your full name" },
          { label:t.email,    val:emailInput, set:setEmailInput, type:"email",    ph:"you@example.com" },
          { label:t.password, val:passInput,  set:setPassInput,  type:"password", ph:"••••••••" },
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

  // ── ADMIN ─────────────────────────────────────────────────────────────────────
  if (page === "admin") {
    const totalH = adminUsers.reduce((s,u)=>s+u.habits.length,0);
    const avgSat = avg(adminUsers.map(u=>u.satisfaction));
    const avgPr  = avg(adminUsers.flatMap(u=>u.habits.map(h=>h.progress)));
    return (
      <div style={{ minHeight:"100vh",background:"#0a0a0f",color:"white",fontFamily:"'Segoe UI',sans-serif" }} dir={isRtl?"rtl":"ltr"}>
        <div style={{ background:"#111127",borderBottom:"1px solid #1e1e3a",padding:"1rem 1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#f59e0b,#ef4444)",display:"flex",alignItems:"center",justifyContent:"center" }}><ShieldCheck size={18} color="white"/></div>
            <div>
              <div style={{ fontWeight:700,fontSize:15 }}>{t.adminPanel} — {t.appName}</div>
              <div style={{ fontSize:11,color:"#6b7280" }}>{currentUser?.email}</div>
            </div>
          </div>
          <div style={{ display:"flex",gap:8 }}>
            <button onClick={()=>setLang(l=>l==="en"?"ar":"en")} style={{ background:"#1e1e3a",border:"none",borderRadius:8,padding:"6px 12px",color:"#a0a0c0",fontSize:12,cursor:"pointer" }}><Globe size={13}/></button>
            <button onClick={handleLogout} style={{ background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:8,padding:"6px 12px",color:"#f87171",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:5 }}><LogOut size={13}/> {t.logout}</button>
          </div>
        </div>
        <div style={{ padding:"1.5rem",maxWidth:960,margin:"0 auto" }}>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:"1.5rem" }}>
            {[
              { label:t.totalUsers,      value:adminUsers.length, icon:<Users size={20}/>,       color:"#6366f1" },
              { label:t.avgSatisfaction, value:avgSat+"/10",      icon:<Heart size={20}/>,       color:"#ec4899" },
              { label:t.totalHabits,     value:totalH,            icon:<CheckCircle size={20}/>, color:"#10b981" },
              { label:"Avg Progress",    value:avgPr+"%",         icon:<BarChart2 size={20}/>,   color:"#f59e0b" },
            ].map(c=>(
              <div key={c.label} style={{ background:"#111127",border:"1px solid #1e1e3a",borderRadius:16,padding:"1.25rem" }}>
                <div style={{ width:40,height:40,borderRadius:10,background:`${c.color}22`,display:"flex",alignItems:"center",justifyContent:"center",color:c.color,marginBottom:10 }}>{c.icon}</div>
                <div style={{ fontSize:24,fontWeight:800,color:"white" }}>{c.value}</div>
                <div style={{ fontSize:12,color:"#6b7280",marginTop:2 }}>{c.label}</div>
              </div>
            ))}
          </div>
          <div style={{ background:"#111127",border:"1px solid #1e1e3a",borderRadius:20,padding:"1.5rem",marginBottom:"1.5rem" }}>
            <h3 style={{ margin:"0 0 1rem",fontSize:15,fontWeight:700,color:"#e5e7eb" }}>Satisfaction Distribution</h3>
            <div style={{ display:"flex",gap:6,alignItems:"flex-end",height:80 }}>
              {[1,2,3,4,5,6,7,8,9,10].map(score=>{
                const count=adminUsers.filter(u=>u.satisfaction===score).length;
                const h=count?Math.max(16,count*28):4;
                return (
                  <div key={score} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}>
                    <div style={{ height:h,background:score>=7?"#10b981":score>=4?"#f59e0b":"#ef4444",borderRadius:4,width:"100%",transition:"height 0.3s" }}/>
                    <span style={{ fontSize:9,color:"#6b7280" }}>{score}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ background:"#111127",border:"1px solid #1e1e3a",borderRadius:20,overflow:"hidden" }}>
            <div style={{ padding:"1.25rem 1.5rem",borderBottom:"1px solid #1e1e3a",display:"flex",alignItems:"center",gap:8 }}>
              <Users size={16} color="#6366f1"/>
              <h3 style={{ margin:0,fontSize:15,fontWeight:700 }}>{t.usersTable}</h3>
            </div>
            {adminUsers.map((u,i)=>(
              <div key={u.id} style={{ padding:"1rem 1.5rem",borderBottom:i<adminUsers.length-1?"1px solid #1e1e3a":"none",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap" }}>
                <div style={{ width:40,height:40,borderRadius:12,background:`hsl(${u.id*60},50%,30%)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,flexShrink:0 }}>{u.name.charAt(0)}</div>
                <div style={{ flex:1,minWidth:120 }}>
                  <div style={{ fontWeight:600,fontSize:14 }}>{u.name}</div>
                  <div style={{ fontSize:12,color:"#6b7280" }}>{u.email}</div>
                  <div style={{ fontSize:11,color:"#4b5563",marginTop:2 }}>Joined: {new Date(u.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ textAlign:"center",minWidth:55 }}>
                  <div style={{ fontSize:17,fontWeight:700,color:"#818cf8" }}>{u.habits.length}</div>
                  <div style={{ fontSize:10,color:"#6b7280" }}>habits</div>
                </div>
                <div style={{ minWidth:110 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",fontSize:11,color:"#9ca3af",marginBottom:3 }}>
                    <span>{t.progress}</span>
                    <span>{u.habits.length?avg(u.habits.map(h=>h.progress)):0}%</span>
                  </div>
                  <div style={{ height:5,background:"#1e1e3a",borderRadius:99,overflow:"hidden" }}>
                    <div style={{ height:"100%",background:"linear-gradient(90deg,#6366f1,#818cf8)",borderRadius:99,width:`${u.habits.length?avg(u.habits.map(h=>h.progress)):0}%`,transition:"width 0.5s" }}/>
                  </div>
                </div>
                <div style={{ textAlign:"center",minWidth:65 }}>
                  <div style={{ fontSize:15,fontWeight:700,color:"#10b981" }}>₺{u.savings}</div>
                  <div style={{ fontSize:10,color:"#6b7280" }}>savings</div>
                </div>
                <div style={{ textAlign:"center",minWidth:55 }}>
                  <div style={{ background:u.satisfaction>=7?"rgba(16,185,129,0.15)":u.satisfaction>=4?"rgba(245,158,11,0.15)":"rgba(239,68,68,0.15)",color:u.satisfaction>=7?"#10b981":u.satisfaction>=4?"#f59e0b":"#ef4444",padding:"3px 8px",borderRadius:99,fontSize:11,fontWeight:700,display:"inline-block" }}>{u.satisfaction}/10</div>
                </div>
                <button onClick={()=>deleteUser(u.id)} style={{ background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,padding:"6px 10px",color:"#f87171",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontSize:12 }}>
                  <Trash2 size={13}/> {t.deleteUser}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── USER APP ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex",flexDirection:"column",minHeight:"100vh",background:"#f8f8fc",fontFamily:"'Segoe UI',sans-serif",direction:isRtl?"rtl":"ltr" }}>
      <header style={{ background:"white",padding:"0.9rem 1.25rem",borderBottom:"1px solid #f0f0f8",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:30 }}>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <div style={{ width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#6366f1,#818cf8)",display:"flex",alignItems:"center",justifyContent:"center" }}><Zap size={15} color="white"/></div>
          <span style={{ fontWeight:900,fontSize:15,color:"#4338ca" }}>{t.appName}</span>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:9 }}>
          <button onClick={()=>setLang(l=>l==="en"?"ar":"en")} style={{ background:"#f0f0f8",border:"none",borderRadius:7,padding:"5px 9px",color:"#6b7280",fontSize:11,cursor:"pointer" }}><Globe size={13}/></button>
          <button onClick={handleLogout} style={{ background:"none",border:"none",cursor:"pointer",color:"#9ca3af" }}><LogOut size={18}/></button>
        </div>
      </header>

      <main style={{ flex:1,overflowY:"auto",padding:"1.15rem",paddingBottom:80 }}>

        {/* HOME */}
        {tab==="home" && <>
          <p style={{ fontSize:13,color:"#9ca3af",margin:"0 0 2px" }}>{t.welcome} {currentUser?.name}</p>
          <h1 style={{ fontSize:21,fontWeight:900,color:"#111827",margin:"0 0 1.15rem" }}>{t.boost}</h1>
          <div style={{ position:"relative",marginBottom:"1rem" }}>
            <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder={t.search} style={{ width:"100%",padding:"11px 16px 11px 42px",background:"white",border:"1px solid #e5e7eb",borderRadius:14,fontSize:14,outline:"none",color:"#111827",boxSizing:"border-box" }}/>
            <Search size={17} color="#9ca3af" style={{ position:"absolute",left:13,top:12 }}/>
          </div>
          <div style={{ background:"linear-gradient(135deg,#4f46e5,#7c3aed)",borderRadius:22,padding:"1.4rem",marginBottom:"1.15rem",position:"relative",overflow:"hidden" }}>
            <div style={{ position:"absolute",right:-20,bottom:-20,opacity:0.08 }}><TrendingUp size={100}/></div>
            <p style={{ fontSize:9,letterSpacing:"0.12em",color:"rgba(255,255,255,0.55)",textTransform:"uppercase",margin:"0 0 5px" }}>{t.savings}</p>
            <div style={{ fontSize:34,fontWeight:900,color:"white" }}>₺{Number(currentUser?.savings??0).toFixed(2)}</div>
            <div style={{ marginTop:"0.9rem",height:4,background:"rgba(255,255,255,0.2)",borderRadius:99,overflow:"hidden" }}>
              <div style={{ height:"100%",background:"rgba(255,255,255,0.7)",borderRadius:99,width:`${Math.min(100,((currentUser?.savings??0)/500)*100)}%` }}/>
            </div>
            <div style={{ fontSize:10,color:"rgba(255,255,255,0.45)",marginTop:5 }}>{completedCount} of {habits.length} done today</div>
          </div>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.75rem" }}>
            <h3 style={{ margin:0,fontSize:15,fontWeight:800,color:"#111827" }}>{t.dailyTasks}</h3>
            <button onClick={()=>setShowAddHabit(true)} style={{ display:"flex",alignItems:"center",gap:5,background:"#ede9fe",border:"none",borderRadius:9,padding:"6px 12px",color:"#6366f1",fontSize:12,fontWeight:700,cursor:"pointer" }}>
              <Plus size={14}/> {t.addHabit}
            </button>
          </div>
          {habits.length===0 && <div style={{ textAlign:"center",padding:"2rem",color:"#9ca3af",fontSize:14 }}>{t.noHabits}</div>}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:"1.15rem" }}>
            {visibleHabits.map(h=>(
              <div key={h.id} style={{ background:h.completed?"#f0fdf4":"white",border:`1.5px solid ${h.completed?"#bbf7d0":"#f3f4f6"}`,borderRadius:18,padding:"0.9rem",display:"flex",flexDirection:"column",gap:7 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                  <span style={{ background:h.completed?"#dcfce7":"#ede9fe",color:h.completed?"#16a34a":"#6366f1",fontSize:10,fontWeight:800,padding:"3px 8px",borderRadius:7 }}>₺{h.reward}</span>
                  <button
                    onClick={() => handleDeleteHabit(h.id)}
                    style={{
                      background:"transparent",
                      border:"none",
                      cursor:"pointer",
                      color:"#ef4444"
                    }}
                  >
                    <Trash2 size={16}/>
                  </button>
                  <span style={{ fontSize:11,color:"#f59e0b",fontWeight:700 }}>🔥 {h.streak}</span>
                </div>
                <div>
                  <div style={{ fontWeight:800,fontSize:13,color:"#111827" }}>{h.name}</div>
                  <div style={{ fontSize:10,color:"#9ca3af",marginTop:1,fontStyle:"italic" }}>{h.goal}</div>
                </div>
                <div style={{ height:3,background:"#f3f4f6",borderRadius:99,overflow:"hidden" }}>
                  <div style={{ height:"100%",background:h.completed?"#10b981":"#6366f1",borderRadius:99,width:`${h.progress}%`,transition:"width 0.5s" }}/>
                </div>
                <button onClick={()=>handleComplete(h.id)} disabled={h.completed} style={{ width:"100%",padding:"9px 0",borderRadius:11,border:"none",background:h.completed?"#f3f4f6":"linear-gradient(135deg,#6366f1,#818cf8)",color:h.completed?"#9ca3af":"white",fontWeight:800,fontSize:11,cursor:h.completed?"not-allowed":"pointer" }}>
                  {h.completed?`✓ ${t.completed}`:t.markDone}
                </button>
              </div>
            ))}
          </div>
          <div style={{ background:"white",border:"1px solid #f3f4f6",borderRadius:18,padding:"1.15rem" }}>
            <h3 style={{ margin:"0 0 0.9rem",fontSize:14,fontWeight:800,color:"#111827" }}>{t.myProgress}</h3>
            {habits.map(h=>(
              <div key={h.id} style={{ marginBottom:"0.65rem" }}>
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:11,color:"#6b7280",marginBottom:3 }}>
                  <span style={{ fontWeight:700,color:"#374151" }}>{h.name}</span>
                  <span style={{ fontWeight:800,color:"#6366f1" }}>{h.progress}%</span>
                </div>
                <div style={{ height:5,background:"#f3f4f6",borderRadius:99,overflow:"hidden" }}>
                  <div style={{ height:"100%",background:h.completed?"#10b981":"linear-gradient(90deg,#6366f1,#818cf8)",borderRadius:99,width:`${h.progress}%`,transition:"width 0.6s" }}/>
                </div>
              </div>
            ))}
            {habits.length===0 && <div style={{ color:"#9ca3af",fontSize:13 }}>{t.noHabits}</div>}
          </div>
        </>}

        {/* FRIENDS */}
        {tab==="friends" && <>
          <h2 style={{ fontSize:19,fontWeight:900,color:"#111827",marginBottom:"1.15rem" }}>{t.friends}</h2>
          <div style={{ background:"white",border:"1px solid #f3f4f6",borderRadius:18,padding:"1rem",marginBottom:"1rem" }}>
            <div style={{ fontWeight:700,fontSize:14,color:"#111827",marginBottom:10 }}>{t.addFriend}</div>
            <div style={{ display:"flex",gap:8 }}>
              <input value={userSearchQ} onChange={e=>setUserSearchQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&searchForUsers()} placeholder={t.searchUsers} style={{ flex:1,padding:"9px 12px",background:"#f9f9fc",border:"1px solid #e5e7eb",borderRadius:10,fontSize:13,outline:"none",color:"#111827" }}/>
              <button onClick={searchForUsers} style={{ background:"#6366f1",border:"none",borderRadius:10,padding:"9px 14px",color:"white",cursor:"pointer" }}><Search size={15}/></button>
            </div>
            {searchUsers.map(u=>(
              <div key={u.id} style={{ display:"flex",alignItems:"center",gap:10,marginTop:10,padding:"8px",background:"#f9f9fc",borderRadius:10 }}>
                <div style={{ width:34,height:34,borderRadius:10,background:`hsl(${u.id*67},50%,55%)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:"white",fontSize:13 }}>{u.name.charAt(0)}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700,fontSize:13,color:"#111827" }}>{u.name}</div>
                  <div style={{ fontSize:11,color:"#9ca3af" }}>{u.email}</div>
                </div>
                <button onClick={()=>sendFriendReq(u.id)} style={{ background:"#ede9fe",border:"none",borderRadius:8,padding:"6px 10px",color:"#6366f1",cursor:"pointer",display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:700 }}>
                  <UserPlus size={14}/> Add
                </button>
              </div>
            ))}
          </div>
          {pendingReqs.length>0 && (
            <div style={{ background:"#fffbeb",border:"1px solid #fde68a",borderRadius:18,padding:"1rem",marginBottom:"1rem" }}>
              <div style={{ fontWeight:700,fontSize:14,color:"#92400e",marginBottom:10 }}>{t.friendReq} ({pendingReqs.length})</div>
              {pendingReqs.map(u=>(
                <div key={u.id} style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
                  <div style={{ width:34,height:34,borderRadius:10,background:`hsl(${u.id*67},50%,55%)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:"white",fontSize:13 }}>{u.name.charAt(0)}</div>
                  <div style={{ flex:1,fontWeight:700,fontSize:13,color:"#111827" }}>{u.name}</div>
                  <button onClick={()=>acceptReq(u.id)} style={{ background:"#10b981",border:"none",borderRadius:8,padding:"6px 12px",color:"white",cursor:"pointer",fontSize:12,fontWeight:700 }}>Accept</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ fontWeight:700,fontSize:14,color:"#111827",marginBottom:10 }}>{t.myFriends}</div>
          {friends.filter(f=>f.status==="accepted").map(f=>(
            <div key={f.id} style={{ background:"white",border:"1px solid #f3f4f6",borderRadius:14,padding:"0.9rem",marginBottom:9,display:"flex",alignItems:"center",gap:10 }}>
              <div style={{ position:"relative" }}>
                <div style={{ width:40,height:40,borderRadius:12,background:`hsl(${f.id*67},50%,55%)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:"white" }}>{f.name.charAt(0)}</div>
                {onlineIds.includes(f.id) && <div style={{ width:10,height:10,borderRadius:"50%",background:"#10b981",border:"2px solid white",position:"absolute",bottom:0,right:0 }}/>}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700,fontSize:14,color:"#111827" }}>{f.name}</div>
                <div style={{ fontSize:11,color:onlineIds.includes(f.id)?"#10b981":"#9ca3af" }}>{onlineIds.includes(f.id)?t.online:f.email}</div>
              </div>
              <button onClick={()=>openChat(f)} style={{ background:"#ede9fe",border:"none",borderRadius:9,padding:"7px 12px",color:"#6366f1",cursor:"pointer",display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:700 }}>
                <MessageCircle size={14}/> {t.chat}
              </button>
            </div>
          ))}
        </>}

        {/* CHAT */}
        {tab==="chat" && chatFriend && (
          <div style={{ display:"flex",flexDirection:"column",height:"calc(100vh - 160px)" }}>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:"1rem" }}>
              <button onClick={()=>setTab("friends")} style={{ background:"#f3f4f6",border:"none",borderRadius:9,padding:"7px 12px",cursor:"pointer",fontSize:13,color:"#374151" }}>←</button>
              <div style={{ width:36,height:36,borderRadius:10,background:`hsl(${chatFriend.id*67},50%,55%)`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:"white" }}>{chatFriend.name.charAt(0)}</div>
              <div>
                <div style={{ fontWeight:700,fontSize:14,color:"#111827" }}>{chatFriend.name}</div>
                <div style={{ fontSize:11,color:"#9ca3af" }}>🔒 End-to-end encrypted</div>
              </div>
            </div>
            <div style={{ flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:8,paddingBottom:"0.5rem" }}>
              {messages.length===0 && <div style={{ textAlign:"center",color:"#9ca3af",fontSize:13,marginTop:"2rem" }}>{t.noMessages}</div>}
              {messages.map(m=>{
                const mine = m.sender_id===currentUser.id;
                return (
                  <div key={m.id} style={{ display:"flex",justifyContent:mine?"flex-end":"flex-start" }}>
                    <div style={{ maxWidth:"75%",padding:"9px 14px",borderRadius:mine?"18px 18px 4px 18px":"18px 18px 18px 4px",background:mine?"linear-gradient(135deg,#6366f1,#818cf8)":"white",color:mine?"white":"#111827",fontSize:14,border:mine?"none":"1px solid #f3f4f6" }}>
                      {m.content}
                      <div style={{ fontSize:10,opacity:0.6,marginTop:3,textAlign:"right" }}>{new Date(m.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={msgEnd}/>
            </div>
            <div style={{ display:"flex",gap:8,paddingTop:"0.75rem",borderTop:"1px solid #f3f4f6" }}>
              <input value={msgInput} onChange={e=>setMsgInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMessage()} placeholder={t.sendMsg} style={{ flex:1,padding:"11px 14px",background:"white",border:"1px solid #e5e7eb",borderRadius:14,fontSize:14,outline:"none",color:"#111827" }}/>
              <button onClick={sendMessage} style={{ background:"linear-gradient(135deg,#6366f1,#818cf8)",border:"none",borderRadius:13,padding:"11px 16px",color:"white",cursor:"pointer" }}><Send size={16}/></button>
            </div>
          </div>
        )}

        {/* PROFILE */}
        {tab==="profile" && (
          <div>
            <h2 style={{ fontSize:19,fontWeight:900,color:"#111827",marginBottom:"1.15rem" }}>{t.profile}</h2>
            <div style={{ background:"white",border:"1px solid #f3f4f6",borderRadius:22,padding:"1.5rem",textAlign:"center",marginBottom:"1rem" }}>
              <div style={{ width:70,height:70,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#818cf8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:900,color:"white",margin:"0 auto 10px" }}>{currentUser?.name?.charAt(0)}</div>
              <div style={{ fontSize:17,fontWeight:800,color:"#111827" }}>{currentUser?.name}</div>
              <div style={{ fontSize:12,color:"#9ca3af" }}>{currentUser?.email}</div>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:"1rem" }}>
              {[
                { label:"Savings",      val:`₺${Number(currentUser?.savings??0).toFixed(2)}`, color:"#10b981" },
                { label:"Habits",       val:habits.length,                                      color:"#6366f1" },
                { label:"Satisfaction", val:`${currentUser?.satisfaction??0}/10`,               color:"#f59e0b" },
                { label:"Max Streak",   val:`${habits.reduce((m,h)=>Math.max(m,h.streak),0)} days`, color:"#ec4899" },
              ].map(s2=>(
                <div key={s2.label} style={{ background:"white",border:"1px solid #f3f4f6",borderRadius:14,padding:"0.9rem" }}>
                  <div style={{ fontSize:20,fontWeight:800,color:s2.color }}>{s2.val}</div>
                  <div style={{ fontSize:11,color:"#9ca3af",marginTop:2 }}>{s2.label}</div>
                </div>
              ))}
            </div>
            <button onClick={handleLogout} style={{ width:"100%",padding:"13px",background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.18)",borderRadius:13,color:"#ef4444",fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
              <LogOut size={16}/> {t.logout}
            </button>
          </div>
        )}
      </main>

      <nav style={{ position:"sticky",bottom:0,background:"rgba(255,255,255,0.93)",backdropFilter:"blur(12px)",borderTop:"1px solid #f0f0f8",padding:"0.7rem 0.5rem",display:"flex",justifyContent:"space-around",zIndex:40 }}>
        {[
          { id:"home",      icon:<Home size={20}/>,     label:t.home },
          { id:"friends",   icon:<UserPlus size={20}/>, label:t.friends },
          { id:"community", icon:<Users size={20}/>,    label:t.community },
          { id:"profile",   icon:<User size={20}/>,     label:t.profile },
        ].map(n=>(
          <button key={n.id} onClick={()=>setTab(n.id)} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",color:tab===n.id?"#6366f1":"#9ca3af",fontWeight:tab===n.id?700:400,fontSize:10,padding:"4px 8px" }}>
            {n.icon}<span>{n.label}</span>
          </button>
        ))}
      </nav>

      {/* ADD HABIT */}
      {showAddHabit && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(8px)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:"1.5rem" }}>
          <div style={{ background:"white",borderRadius:22,padding:"1.5rem",width:"100%",maxWidth:420 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.15rem" }}>
              <h3 style={{ margin:0,fontSize:16,fontWeight:800,color:"#111827" }}>{t.addHabit}</h3>
              <button onClick={()=>setShowAddHabit(false)} style={{ background:"#f3f4f6",border:"none",borderRadius:9,padding:7,cursor:"pointer" }}><X size={16}/></button>
            </div>
            {[
              { key:"name",   label:t.habitName,    ph:"e.g. Read 30 minutes" },
              { key:"goal",   label:t.identityGoal, ph:"e.g. I am a lifelong learner" },
              { key:"reward", label:t.reward,        ph:"10", type:"number" },
            ].map(f=>(
              <div key={f.key} style={{ marginBottom:"1rem" }}>
                <label style={{ display:"block",fontSize:11,fontWeight:700,color:"#6b7280",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em" }}>{f.label}</label>
                <input value={newHabit[f.key]} onChange={e=>setNewHabit(p=>({...p,[f.key]:e.target.value}))} type={f.type||"text"} placeholder={f.ph} style={{ width:"100%",padding:"11px 13px",background:"#f9f9fc",border:"1px solid #e5e7eb",borderRadius:11,fontSize:14,outline:"none",boxSizing:"border-box",color:"#111827" }}/>
              </div>
            ))}
            <button onClick={handleAddHabit} style={{ width:"100%",padding:"13px",background:"linear-gradient(135deg,#6366f1,#818cf8)",border:"none",borderRadius:13,color:"white",fontWeight:800,fontSize:15,cursor:"pointer" }}>
              <Plus size={16} style={{ verticalAlign:"middle",marginRight:6 }}/>{t.addHabit}
            </button>
          </div>
        </div>
      )}

      {/* QUIZ — يظهر قبل إضافة المال */}
      {showQuiz && (
        <div style={{ position:"fixed",inset:0,background:"rgba(15,15,26,0.75)",backdropFilter:"blur(12px)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem" }}>
          <div style={{ background:"white",borderRadius:26,padding:"2rem",width:"100%",maxWidth:340,textAlign:"center" }}>
            <div style={{ width:68,height:68,borderRadius:"50%",background:"#fff7ed",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",border:"4px solid #fed7aa" }}><Smile size={34} color="#f97316"/></div>
            <h3 style={{ fontSize:19,fontWeight:800,color:"#111827",margin:"0 0 4px" }}>{t.quiz}</h3>
            <p style={{ fontSize:12,color:"#9ca3af",margin:"0 0 4px" }}>{t.quizSub}</p>
            {/* عرض المبلغ المحتمل */}
            <div style={{ background:"#f0fdf4",borderRadius:10,padding:"8px 14px",marginBottom:"1.25rem",fontSize:13,color:"#15803d",fontWeight:700 }}>
              Max reward: ₺{pendingReward} → your score decides the amount
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:"0.9rem" }}>
              {[1,2,3,4,5,6,7,8,9,10].map(sc=>{
                const earned = parseFloat(((pendingReward * sc) / 10).toFixed(2));
                return (
                  <button key={sc} onClick={()=>handleSatisfaction(sc)}
                    style={{ padding:"9px 0",background:"#f9f9fc",border:"1px solid #e5e7eb",borderRadius:11,fontWeight:800,fontSize:14,color:"#374151",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2 }}
                    onMouseEnter={e=>{ e.currentTarget.style.background="#6366f1"; e.currentTarget.style.color="white"; e.currentTarget.style.borderColor="#6366f1"; }}
                    onMouseLeave={e=>{ e.currentTarget.style.background="#f9f9fc"; e.currentTarget.style.color="#374151"; e.currentTarget.style.borderColor="#e5e7eb"; }}
                  >
                    <span>{sc}</span>
                    <span style={{ fontSize:9,opacity:0.7 }}>₺{earned}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={()=>{ setShowQuiz(false); setPendingReward(0); }} style={{ background:"none",border:"none",color:"#9ca3af",fontSize:11,fontWeight:700,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.05em" }}>Skip (no reward)</button>
          </div>
        </div>
      )}
    </div>
  );
}