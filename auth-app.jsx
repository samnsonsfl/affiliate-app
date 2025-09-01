/* auth-app.jsx — Apps-United (Supabase Auth + sliding 30-day) */
const { useState, useEffect, useMemo, Component } = React;

/* ================== Supabase config (fill your anon key) ================== */
const SUPABASE_URL = "https://pvfxettbmykvezwahohh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2ZnhldHRibXlrdmV6d2Fob2hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTc2MzMsImV4cCI6MjA3MjMzMzYzM30.M5V-N3jYDs1Eijqb6ZjscNfEOSMMARe8HI20sRdAOTQ"; // ← from Settings → API

if (!window.supabase) {
  console.error("Supabase client script missing. Add @supabase/supabase-js@2 before this file.");
}
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

/* ================== Error Boundary (prevents blank page) ================== */
class ErrorBoundary extends Component {
  constructor(props){ super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error){ return { error }; }
  componentDidCatch(error, info){ console.error("Apps-United error:", error, info); }
  render(){
    if (this.state.error) {
      return (
        <div className="au-container" style={{paddingTop:40}}>
          <div className="au-card" style={{padding:16, borderColor:"rgba(248,113,113,.5)", background:"rgba(248,113,113,.12)"}}>
            <h2 style={{margin:"6px 0 8px", fontWeight:700}}>Something went wrong</h2>
            <div className="au-note">Open your browser console to see details.</div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ================== Sliding 30-day helpers (lastActive) ================== */
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
const LS_LAST_ACTIVE = "appsUnited.lastActive";

function getLastActive(){ try { return parseInt(localStorage.getItem(LS_LAST_ACTIVE) || "0", 10); } catch { return 0; } }
function bumpLastActive(){ try { localStorage.setItem(LS_LAST_ACTIVE, String(Date.now())); } catch {} }
function isWithinThirtyDays(){
  const last = getLastActive();
  if (!last) return false;
  return (Date.now() - last) < THIRTY_DAYS;
}

/* ================== Starter apps (unchanged) ================== */
const defaultApps = [
  { id: "app1", name: "App One",   desc: "Your first starter app.",   badge: "Starter" },
  { id: "app2", name: "App Two",   desc: "Another placeholder app.",  badge: "Starter" },
  { id: "app3", name: "App Three", desc: "Ready for future features.", badge: "Starter" },
  { id: "app4", name: "App Four",  desc: "Customize this later.",     badge: "Starter" },
];

/* ---------- Dashboard prefs (grid + folders) ---------- */
const LS_PREFS = "appsUnited.prefs";

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(LS_PREFS) || "{}"); } catch { return {}; }
}
function savePrefs(p) {
  try { localStorage.setItem(LS_PREFS, JSON.stringify(p)); } catch {}
}

/* Shape:
{
  grid: "5" | "4",
  folders: [{ id, name }],
  appFolders: { [appId]: folderId }   // app → folder mapping
}
*/
function ensurePrefsShape(p) {
  return {
    grid: p.grid === "4" ? "4" : "5",
    folders: Array.isArray(p.folders) ? p.folders : [],
    appFolders: p.appFolders && typeof p.appFolders === "object" ? p.appFolders : {}
  };
}
function uid() { return Math.random().toString(36).slice(2, 8); }

/* ================== Shell & small UI (unchanged visuals) ================== */
function Shell({ route, onLogout, children }) {
  return (
    <div className="au-container" data-route={route}>
      <header className="au-header" style={{ alignItems: "flex-start" }}>
        <div className="au-brand" style={{flexDirection:"column", alignItems:"center", textAlign:"center"}}>
          <img src="./favicon-192.png" alt="Apps-United logo" style={{width:64, height:64, borderRadius:16}} />
          <div style={{ marginTop: 6 }}>
            <div className="au-subtle" style={{ fontWeight: 600 }}>Apps-United</div>
            <div className="au-note">All your apps, your way.</div>
          </div>
        </div>

        {route === "dashboard" && (
          <button className="au-btn au-btn-secondary au-logout" onClick={onLogout}>
            Logout
          </button>
        )}
      </header>

      {children}
    </div>
  );
}
function ErrorNote({ children }) {
  return (
    <div className="au-card" style={{
      borderColor: "rgba(248,113,113,.5)", background:"rgba(248,113,113,.12)",
      padding: 12, marginBottom: 8
    }}>
      <span>⚠️</span> <span style={{ marginLeft: 8 }}>{children}</span>
    </div>
  );
}

/* ================== TOP-LEVEL PAGES (stable identity) ================== */
function LoginPage({ err, form, setForm, onSubmit, goSignup, route, onLogout }) {
  return (
    <Shell route={route} onLogout={onLogout}>
      <div className="au-grid" style={{ maxWidth: 520, margin: "0 auto" }}>
        <div className="au-card">
          <div className="au-card-header"><h2 style={{ margin: 0, fontWeight: 600 }}>Sign in</h2></div>
          <div className="au-card-content">
            {err && <ErrorNote>{err}</ErrorNote>}
            <form onSubmit={onSubmit} className="au-grid" style={{ gap: 16 }}>
              <div>
                <label className="au-note">Email</label>
                <input
                  className="au-input" type="email" placeholder="you@example.com"
                  value={form.email}
                  onChange={(e)=>{ const v=e.target.value; setForm(s=>({...s, email:v})); }}
                  autoComplete="email" required
                />
              </div>
              <div>
                <label className="au-note">Password</label>
                <input
                  className="au-input" type="password" placeholder="••••••••"
                  value={form.password}
                  onChange={(e)=>{ const v=e.target.value; setForm(s=>({...s, password:v})); }}
                  autoComplete="current-password" required
                />
              </div>
              <div className="au-row-between" style={{ marginTop: 4 }}>
                <label className="au-row" style={{ fontSize: 14 }}>
                  <input
                    type="checkbox" checked={form.stay}
                    onChange={(e)=>{ const v=e.target.checked; setForm(s=>({...s, stay:v})); }}
                  />
                  <span>Stay signed in for 30 days</span>
                </label>
                <button type="button" className="au-btn au-btn-secondary" onClick={goSignup}>
                  Create account
                </button>
              </div>
              <button type="submit" className="au-btn au-btn-primary">Sign in</button>
            </form>
          </div>
          <div className="au-card-footer">
            <p className="au-note" style={{ textAlign: "center" }}>By signing in you agree to our Terms & Privacy.</p>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function SignupPage({ err, form, setForm, onSubmit, goLogin, route, onLogout }) {
  return (
    <Shell route={route} onLogout={onLogout}>
      <div className="au-grid" style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className="au-card">
          <div className="au-card-header"><h2 style={{ margin: 0, fontWeight: 600 }}>Create your account</h2></div>
          <div className="au-card-content">
            {err && <ErrorNote>{err}</ErrorNote>}
            <form onSubmit={onSubmit} className="au-grid" style={{ gap: 16 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="au-note">Full name</label>
                <input
                  className="au-input" placeholder="Jane Doe"
                  value={form.fullName}
                  onChange={(e)=>{ const v=e.target.value; setForm(s=>({...s, fullName:v})); }}
                  autoComplete="name"
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="au-note">Email</label>
                <input
                  className="au-input" type="email" placeholder="you@example.com"
                  value={form.email}
                  onChange={(e)=>{ const v=e.target.value; setForm(s=>({...s, email:v})); }}
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="au-note">Password</label>
                <input
                  className="au-input" type="password" placeholder="Min 8 characters"
                  value={form.password}
                  onChange={(e)=>{ const v=e.target.value; setForm(s=>({...s, password:v})); }}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="au-note">Confirm password</label>
                <input
                  className="au-input" type="password" placeholder="Repeat password"
                  value={form.confirm}
                  onChange={(e)=>{ const v=e.target.value; setForm(s=>({...s, confirm:v})); }}
                  autoComplete="new-password"
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }} className="au-row">
                <input
                  type="checkbox" checked={form.agree}
                  onChange={(e)=>{ const v=e.target.checked; setForm(s=>({...s, agree:v})); }}
                />
                <span>I agree to the <a href="#" onClick={(e)=>e.preventDefault()}>Terms & Conditions</a>.</span>
              </div>
              <div style={{ gridColumn: "1 / -1" }} className="au-row">
                <input
                  type="checkbox" checked={form.optIn}
                  onChange={(e)=>{ const v=e.target.checked; setForm(s=>({...s, optIn:v})); }}
                />
                <span>Send me helpful updates and the occasional ✨ good spam ✨</span>
              </div>
              <div className="au-row" style={{ gridColumn: "1 / -1", gap: 12, flexWrap: "wrap" }}>
                <button type="submit" className="au-btn au-btn-primary">Create account</button>
                <button type="button" className="au-btn au-btn-secondary" onClick={goLogin}>
                  I already have an account
                </button>
              </div>
            </form>
          </div>
          <div className="au-card-footer">
            <p className="au-note" style={{ textAlign: "center" }}>We respect your inbox. Unsubscribe anytime.</p>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function DashboardPage({ me, route, onLogout }) {
  // apps source
  const apps = useMemo(()=> (me?.apps?.length ? me.apps : defaultApps), [me]);

  // prefs state
  const [prefs, setPrefs] = React.useState(() => ensurePrefsShape(loadPrefs()));
  const [search, setSearch] = React.useState("");
  const [activeFolder, setActiveFolder] = React.useState("all"); // "all" | folderId
  const [newFolderName, setNewFolderName] = React.useState("");

  // persist prefs
  useEffect(()=> { savePrefs(prefs); }, [prefs]);

  const firstName = (me?.full_name || me?.fullName || "").split(" ")[0] || "";

  // derived lists
  const folders = prefs.folders;
  const appFolders = prefs.appFolders;

  // filter by folder
  const appsInView = apps.filter(a => {
    if (activeFolder === "all") return true;
    return appFolders[a.id] === activeFolder;
  });

  // search filter (case-insensitive, name + desc)
  const s = search.trim().toLowerCase();
  const filteredApps = !s ? appsInView : appsInView.filter(a =>
    a.name.toLowerCase().includes(s) || (a.desc||"").toLowerCase().includes(s)
  );

  // actions
  function setGrid(n) { setPrefs(p => ({ ...p, grid: n })); }

  function addFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    const id = uid();
    setPrefs(p => ({ ...p, folders: [...p.folders, { id, name }] }));
    setNewFolderName("");
    setActiveFolder(id);
  }

  function renameFolder(id, name) {
    setPrefs(p => ({
      ...p,
      folders: p.folders.map(f => f.id === id ? { ...f, name: name.trim() || f.name } : f)
    }));
  }

  function deleteFolder(id) {
    // remove folder and unassign apps that were in it
    setPrefs(p => {
      const nextFolders = p.folders.filter(f => f.id !== id);
      const nextMap = { ...p.appFolders };
      for (const k of Object.keys(nextMap)) {
        if (nextMap[k] === id) delete nextMap[k];
      }
      return { ...p, folders: nextFolders, appFolders: nextMap };
    });
    if (activeFolder === id) setActiveFolder("all");
  }

  function assignAppToFolder(appId, folderId) {
    setPrefs(p => {
      const next = { ...p.appFolders };
      if (folderId === "none") delete next[appId];
      else next[appId] = folderId;
      return { ...p, appFolders: next };
    });
  }

  return (
    <Shell route={route} onLogout={onLogout}>
      <div className="au-grid" style={{ gap: 24 }}>
        {/* Greeting */}
        <div>
          <h2 style={{ margin: "0 0 8px", fontWeight: 600, fontSize: 24 }}>
            Welcome{firstName ? `, ${firstName}` : ""} 👋
          </h2>
          <div className="au-note">Your starter apps are ready. Add more soon.</div>
        </div>

        {/* Controls row */}
        <div className="au-card" style={{ padding: 12 }}>
          <div className="au-controls">
            {/* Folder filter */}
            <div className="au-controls__group">
              <label className="au-note">Folder</label>
              <select
                className="au-input au-select"
                value={activeFolder}
                onChange={(e)=>setActiveFolder(e.target.value)}
              >
                <option value="all">All</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            {/* Size switcher */}
            <div className="au-controls__group">
              <label className="au-note">Size</label>
              <div className="au-seg">
                <button
                  className={`au-seg__btn ${prefs.grid === "5" ? "is-active":""}`}
                  onClick={()=>setGrid("5")}
                  title="5 cards across"
                >5x♾️</button>
                <button
                  className={`au-seg__btn ${prefs.grid === "4" ? "is-active":""}`}
                  onClick={()=>setGrid("4")}
                  title="4 cards across"
                >4x♾️</button>
              </div>
            </div>

            {/* Search */}
            <div className="au-controls__group au-controls__grow">
              <label className="au-note">Search</label>
              <input
                className="au-input"
                placeholder="Find an app…"
                value={search}
                onChange={(e)=>setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Folders manager */}
        <div className="au-card" style={{ padding: 14 }}>
          <div className="au-row-between" style={{ alignItems:"flex-start" }}>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {folders.length === 0 ? (
                <div className="au-note">No folders yet.</div>
              ) : (
                folders.map(f => (
                  <div key={f.id} className="au-folderchip">
                    <input
                      className="au-folderchip__name"
                      value={f.name}
                      onChange={(e)=>renameFolder(f.id, e.target.value)}
                    />
                    <button className="au-folderchip__x" onClick={()=>deleteFolder(f.id)} title="Delete">×</button>
                  </div>
                ))
              )}
            </div>
            <div className="au-row" style={{ gap:8 }}>
              <input
                className="au-input"
                placeholder="New folder name"
                value={newFolderName}
                onChange={(e)=>setNewFolderName(e.target.value)}
                style={{ width: 220 }}
              />
              <button className="au-btn au-btn-primary" onClick={addFolder}>Add Folder</button>
            </div>
          </div>
          <div className="au-note" style={{ marginTop: 8 }}>
            Tip: assign any app to a folder using the dropdown on its card.
          </div>
        </div>

        {/* Apps grid */}
        <div className={`au-grid apps-grid ${prefs.grid === "4" ? "apps-grid--4" : "apps-grid--5"}`}>
          {filteredApps.map(app => (
            <div key={app.id} className="au-card">
              <div className="au-card-header">
                <div className="au-row-between" style={{ alignItems:"center" }}>
                  <div className="au-subtle" style={{ fontWeight: 600 }}>{app.name}</div>
                  <div className="au-row" style={{ gap:8 }}>
                    {app.badge && <span className="au-badge">{app.badge}</span>}
                    {/* Folder selector per app */}
                    <select
                      className="au-input au-select au-select--mini"
                      value={appFolders[app.id] || "none"}
                      onChange={(e)=>assignAppToFolder(app.id, e.target.value)}
                      title="Move to folder"
                    >
                      <option value="none">No folder</option>
                      {folders.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="au-card-content">
                <div className="au-note">{app.desc}</div>
              </div>
              <div className="au-card-footer au-row" style={{ gap: 12 }}>
                <button className="au-btn au-btn-primary" onClick={()=>alert(`Open ${app.name} (stub)`)}>Open</button>
                <button className="au-btn au-btn-secondary" disabled title="Coming soon">Add to favorites</button>
              </div>
            </div>
          ))}
          {filteredApps.length === 0 && (
            <div className="au-note" style={{ padding:12 }}>No apps match your search or folder.</div>
          )}
        </div>
      </div>
    </Shell>
  );
}

/* ================== App (Router + Supabase Auth) ================== */
function App(){
  const [route, setRoute] = useState("loading"); // loading | login | signup | dashboard
  const [err, setErr] = useState("");
  const [loginForm, setLoginForm] = useState({ email:"", password:"", stay:true });
  const [signupForm, setSignupForm] = useState({
    fullName:"", email:"", password:"", confirm:"", agree:false, optIn:true
  });
  const [me, setMe] = useState(null); // { id, email, full_name }

  // Initial session check + sliding window
  useEffect(()=>{
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setRoute("login"); return; }

      // enforce sliding 30-day window
      if (!isWithinThirtyDays()) {
        await supabase.auth.signOut();
        try { localStorage.removeItem(LS_LAST_ACTIVE); } catch {}
        setRoute("login");
        return;
      }
      bumpLastActive();

      // load profile
      const user = session.user;
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("full_name, opt_in")
        .eq("id", user.id)
        .maybeSingle();
      if (error) console.warn("profiles fetch warning:", error.message);

      setMe({ id: user.id, email: user.email, full_name: profile?.full_name || "" });
      setRoute("dashboard");
    })();

    // keep lastActive fresh when Supabase refreshes tokens
    const { data: sub } = supabase.auth.onAuthStateChange((_event, _session) => {
      if (_session) bumpLastActive();
    });
    return () => { sub.subscription.unsubscribe(); };
  },[]);

  async function handleLogin(e){
    e.preventDefault(); setErr("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: (loginForm.email || "").trim(),
        password: loginForm.password || "",
      });
      if (error) throw error;

      bumpLastActive(); // start 30-day window from now

      // fetch profile
      const user = data.user;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, opt_in")
        .eq("id", user.id)
        .maybeSingle();

      setMe({ id: user.id, email: user.email, full_name: profile?.full_name || "" });
      setRoute("dashboard");

      // If user unchecked “stay signed in”, clear window on tab close (best-effort)
      if (!loginForm.stay) {
        window.addEventListener("beforeunload", () => {
          try { localStorage.removeItem(LS_LAST_ACTIVE); } catch {}
        }, { once: true });
      }
    } catch (e) {
      console.error(e);
      setErr(e.message || "Login failed.");
    }
  }

  async function handleSignup(e){
  e.preventDefault(); setErr("");
  try {
    const { fullName, email, password, confirm, agree, optIn } = signupForm;
    if (!fullName.trim()) throw new Error("Please enter your full name.");
    if (!/\S+@\S+\.\S+/.test(email)) throw new Error("Please enter a valid email address.");
    if ((password || "").length < 8) throw new Error("Password must be at least 8 characters.");
    if (password !== confirm) throw new Error("Passwords do not match.");
    if (!agree) throw new Error("You must agree to the Terms & Conditions.");

    // 1) Create auth user
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } }
    });
    if (error) throw error;

    const user = data.user;

    // 2) Create profile row
    if (user) {
      const { error: upsertErr } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: fullName.trim(),
        opt_in: !!optIn,
      });
      if (upsertErr) console.warn("profiles upsert warning:", upsertErr.message);
    }

    // 3) 👇 Grant the 5 default apps (Amazon, Expedia, Viator, Get Your Guide, Hellotickets)
    if (user) {
      const { data: defaults, error: defErr } = await supabase
        .from("apps")
        .select("id")
        .eq("is_default", true);
      if (!defErr && defaults?.length) {
        // insert into user_apps for this user
        await supabase.from("user_apps").insert(
          defaults.map(a => ({ user_id: user.id, app_id: a.id }))
        ).catch(() => {}); // ignore duplicates if any
      }
    }

    // 4) Start sliding window and finish
    bumpLastActive();

    // If email confirmations are enabled, there may be no session until they confirm:
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) {
      setErr("Check your email to confirm your account, then sign in.");
      setRoute("login");
      return;
    }

    setMe({ id: user.id, email: user.email, full_name: fullName.trim() });
    setRoute("dashboard");
  } catch (e) {
    console.error(e);
    setErr(e.message || "Signup failed.");
  }
}

      bumpLastActive();

      // If email confirmations are enabled, there may be no session until they confirm:
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) {
        setErr("Check your email to confirm your account, then sign in.");
        setRoute("login");
        return;
      }

      setMe({ id: user.id, email: user.email, full_name: fullName.trim() });
      setRoute("dashboard");
    } catch (e) {
      console.error(e);
      setErr(e.message || "Signup failed.");
    }
  }

  async function handleLogout(){
    await supabase.auth.signOut();
    try { localStorage.removeItem(LS_LAST_ACTIVE); } catch {}
    setMe(null); setRoute("login");
  }

  if (route === "loading") {
    return <div className="au-container" style={{ display:"grid", placeItems:"center", minHeight:"40vh" }}>Loading…</div>;
  }
  if (route === "login") {
    return (
      <LoginPage
        err={err}
        form={loginForm}
        setForm={setLoginForm}
        onSubmit={handleLogin}
        goSignup={()=>{ setErr(""); setRoute("signup"); }}
        route={route}
        onLogout={handleLogout}
      />
    );
  }
  if (route === "signup") {
    return (
      <SignupPage
        err={err}
        form={signupForm}
        setForm={setSignupForm}
        onSubmit={handleSignup}
        goLogin={()=>{ setErr(""); setRoute("login"); }}
        route={route}
        onLogout={handleLogout}
      />
    );
  }
  return <DashboardPage me={me} route={route} onLogout={handleLogout} />;
}

// After successful signInWithPassword:
const { data: countRows } = await supabase
  .from("user_apps")
  .select("app_id", { count: "exact", head: true })
  .eq("user_id", data.user.id);

if ((countRows?.length ?? 0) === 0) {
  const { data: defaults } = await supabase.from("apps").select("id").eq("is_default", true);
  if (defaults?.length) {
    await supabase.from("user_apps").insert(
      defaults.map(a => ({ user_id: data.user.id, app_id: a.id }))
    ).catch(() => {});
  }
}

/* ================== Mount ================== */
ReactDOM.createRoot(document.getElementById("auth-root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
