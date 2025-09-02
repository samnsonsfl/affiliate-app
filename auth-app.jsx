/* auth-app.jsx — Apps-United (Supabase Auth + sliding 30-day + search/folders/4x-5x + Catalog page) */
/* global React, ReactDOM, window */
const { useState, useEffect, useMemo, Component } = React;

/* ================== Supabase config ================== */
const SUPABASE_URL = "https://pvfxettbmykvezwahohh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2ZnhldHRibXlrdmV6d2Fob2hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTc2MzMsImV4cCI6MjA3MjMzMzYzM30.M5V-N3jYDs1Eijqb6ZjscNfEOSMMARe8HI20sRdAOTQ";

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

/* ================== Sliding 30-day helpers ================== */
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
const LS_LAST_ACTIVE = "appsUnited.lastActive";
function getLastActive(){ try { return parseInt(localStorage.getItem(LS_LAST_ACTIVE) || "0", 10); } catch { return 0; } }
function bumpLastActive(){ try { localStorage.setItem(LS_LAST_ACTIVE, String(Date.now())); } catch {} }
function isWithinThirtyDays(){
  const last = getLastActive();
  if (!last) return false;
  return (Date.now() - last) < THIRTY_DAYS;
}

/* ---------- Dashboard prefs (grid + folders in localStorage) ---------- */
const LS_PREFS = "appsUnited.prefs";
function loadPrefs() { try { return JSON.parse(localStorage.getItem(LS_PREFS) || "{}"); } catch { return {}; } }
function savePrefs(p) { try { localStorage.setItem(LS_PREFS, JSON.stringify(p)); } catch {} }
/* Shape:
{
  grid: "5" | "4",
  folders: [{ id, name }],
  appFolders: { [appId]: folderId }
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

/* ================== Placeholder apps (visual only fallback) ================== */
const defaultApps = [
  { id: "app1", name: "App One",   desc: "Your first starter app.",   badge: "Starter" },
  { id: "app2", name: "App Two",   desc: "Another placeholder app.",  badge: "Starter" },
  { id: "app3", name: "App Three", desc: "Ready for future features.", badge: "Starter" },
  { id: "app4", name: "App Four",  desc: "Customize this later.",     badge: "Starter" },
];

/* ================== Shell UI (keeps your look) ================== */
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

/* ================== Pages ================== */
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
        </div>
      </div>
    </Shell>
  );
}

/* ================== Dashboard ================== */
function DashboardPage({ me, route, onLogout, catalog, myApps, setMyApps, goCatalog, addApp, removeApp }) {
  // prefs
  const [prefs, setPrefs] = React.useState(() => ensurePrefsShape(loadPrefs()));
  const [search, setSearch] = React.useState("");
  const [sortOrder, setSortOrder] = React.useState("az"); // "az" | "za"
  const [activeFolder, setActiveFolder] = React.useState("all"); // "all" or folderId
  const [newFolderName, setNewFolderName] = React.useState("");

  useEffect(()=> { savePrefs(prefs); }, [prefs]);

  const firstName = (me?.full_name || me?.fullName || "").split(" ")[0] || "";

  // Folder mapping
  const folders = prefs.folders;
  const appFolders = prefs.appFolders;

  // Filter by folder then by search (for user's apps)
  const appsInView = myApps.filter(a => activeFolder === "all" ? true : appFolders[a.id] === activeFolder);
  const s = search.trim().toLowerCase();
  let filteredApps = !s ? appsInView : appsInView.filter(a =>
  a.name.toLowerCase().includes(s) || (a.description || "").toLowerCase().includes(s)
);

filteredApps = [...filteredApps].sort((a, b) => {
  if (sortOrder === "az") return a.name.localeCompare(b.name);
  if (sortOrder === "za") return b.name.localeCompare(a.name);
  return 0;
});


// Sort alphabetically
filteredApps = [...filteredApps].sort((a, b) => {
  if (sortOrder === "az") return a.name.localeCompare(b.name);
  if (sortOrder === "za") return b.name.localeCompare(a.name);
  return 0;
});

  // Grid size
  function setGrid(n) { setPrefs(p => ({ ...p, grid: n })); }

  // Folder ops
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
    setPrefs(p => {
      const nextFolders = p.folders.filter(f => f.id !== id);
      const nextMap = { ...p.appFolders };
      for (const k of Object.keys(nextMap)) if (nextMap[k] === id) delete nextMap[k];
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
        {/* Greeting + Add App */}
        <div className="au-row-between">
          <div>
            <h2 style={{ margin: "0 0 8px", fontWeight: 600, fontSize: 24 }}>
              Welcome{firstName ? `, ${firstName}` : ""} 👋
            </h2>
            <div className="au-note">Your apps are below. Use search, size, and folders to organize.</div>
          </div>
          <button className="au-btn au-btn-primary" onClick={goCatalog}>Add app</button>
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
        title="5 apps across"
      >5x♾️</button>
      <button
        className={`au-seg__btn ${prefs.grid === "4" ? "is-active":""}`}
        onClick={()=>setGrid("4")}
        title="4 apps across"
      >4x♾️</button>
    </div>
  </div>

  {/* Search (smaller) */}
  <div className="au-controls__group au-controls__search">
    <label className="au-note">Search</label>
    <input
      className="au-input"
      placeholder="Find an app…"
      value={search}
      onChange={(e)=>setSearch(e.target.value)}
    />
  </div>

  {/* Sort (A→Z / Z→A) */}
  <div className="au-controls__group">
    <label className="au-note">Sort</label>
    <select
      className="au-input au-select"
      value={sortOrder}
      onChange={(e)=>setSortOrder(e.target.value)}
    >
      <option value="az">A → Z</option>
      <option value="za">Z → A</option>
    </select>
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
            Tip: move any app using the dropdown on its card.
          </div>
        </div>

        {/* Apps grid — phone-style tiles */}
        <div className={`apps-grid ${prefs.grid === "4" ? "apps-grid--4" : "apps-grid--5"}`}>
          {filteredApps.map(app => (
            <div key={app.id} className="app-tile">
              <a className="app-body" href={app.href} target="_blank" rel="noopener noreferrer" title={app.name}>
                <div className="app-icon" aria-hidden="true">
  {app.logo_url ? (
    <img className="app-icon__img" src={app.logo_url} alt="" loading="lazy"
         onError={(e)=>{ e.currentTarget.style.display='none'; }} />
  ) : (
    <span className="app-letter">{(app.name || "?").slice(0,1)}</span>
  )}
</div>

                <div className="app-name" title={app.name}>{app.name}</div>
              </a>
              <div className="app-actions au-row-between">
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
                <button className="au-btn au-btn-secondary" onClick={()=>removeApp(app)} title="Remove app">
                  Remove
                </button>
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

/* ================== Catalog (separate page for performance) ================== */
function CatalogPage({ route, onBack, catalog, myApps, addApp }) {
  const [q, setQ] = React.useState("");
  const myIds = new Set(myApps.map(a => a.id));

  // light client-side pagination
  const [page, setPage] = React.useState(1);
  const PAGE_SIZE = 48;

  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    const base = s
      ? catalog.filter(a =>
          (a.name || "").toLowerCase().includes(s) ||
          (a.description || "").toLowerCase().includes(s)
        )
      : catalog;
    return base;
  }, [catalog, q]);

  const slice = filtered.slice(0, PAGE_SIZE * page);
  const hasMore = slice.length < filtered.length;

  return (
    <Shell route={route} onLogout={()=>{}}>
      <div className="au-grid" style={{ gap: 18 }}>
        <div className="au-row-between">
          <button className="au-btn au-btn-secondary" onClick={onBack}>← Back</button>
          <h2 style={{ margin: 0, fontWeight: 700 }}>Add apps</h2>
          <div style={{ width: 120 }} /> {/* spacer */}
        </div>

        <div className="au-card" style={{ padding: 12 }}>
          <div className="au-controls">
            <div className="au-controls__group au-controls__grow">
              <label className="au-note">Search catalog</label>
              <input
                className="au-input"
                placeholder="Search all available apps…"
                value={q}
                onChange={(e)=>{ setQ(e.target.value); setPage(1); }}
              />
            </div>
            <div className="au-controls__group">
              <label className="au-note">Results</label>
              <div className="au-subtle">{filtered.length}</div>
            </div>
          </div>
        </div>

        <div className="apps-grid apps-grid--4">
          {slice.map(app => {
            const added = myIds.has(app.id);
            return (
              <div key={app.id} className="app-tile">
                <a className="app-body" href={app.href} target="_blank" rel="noopener noreferrer" title={app.name}>
                  <div className="app-icon" aria-hidden="true">
  {app.logo_url ? (
    <img className="app-icon__img" src={app.logo_url} alt="" loading="lazy"
         onError={(e)=>{ e.currentTarget.style.display='none'; }} />
  ) : (
    <span className="app-letter">{(app.name || "?").slice(0,1)}</span>
  )}
</div>

                  <div className="app-name" title={app.name}>{app.name}</div>
                </a>
                <div className="app-actions">
                  <button
                    className="au-btn au-btn-primary"
                    onClick={async ()=>{ await addApp(app); }}
                    disabled={added}
                    title={added ? "Already added" : "Add this app"}
                  >
                    {added ? "Added" : "Add"}
                  </button>
                </div>
              </div>
            );
          })}
          {slice.length === 0 && (
            <div className="au-note" style={{ padding:12 }}>No apps found.</div>
          )}
        </div>

        {hasMore && (
          <div style={{ display:"grid", placeItems:"center" }}>
            <button className="au-btn au-btn-secondary" onClick={()=>setPage(p=>p+1)}>Load more</button>
          </div>
        )}
      </div>
    </Shell>
  );
}


/* ================== App (Router + Supabase Auth) ================== */
function App(){
  const [route, setRoute] = useState("loading");
  const [err, setErr] = useState("");
  const [loginForm, setLoginForm] = useState({ email:"", password:"", stay:true });
  const [signupForm, setSignupForm] = useState({ fullName:"", email:"", password:"", confirm:"", agree:false, optIn:true });
  const [me, setMe] = useState(null);
  const [catalog, setCatalog] = useState([]);   // full apps list from Supabase
  const [myApps, setMyApps] = useState([]);     // the user’s selected apps

  async function addApp(app) {
    try {
      const { error } = await supabase.from("user_apps").insert({ user_id: me.id, app_id: app.id });
      if (error) throw error;
      setMyApps(prev => (prev.some(p => p.id === app.id) ? prev : [...prev, app]));
    } catch (e) { console.error(e); alert("Could not add app: " + (e.message || e)); }
  }

  async function removeApp(app) {
    try {
      const { error } = await supabase.from("user_apps")
        .delete()
        .eq("user_id", me.id)
        .eq("app_id", app.id);
      if (error) throw error;
      setMyApps(prev => prev.filter(p => p.id !== app.id));
      // folder assignment cleanup happens inside Dashboard local prefs
    } catch (e) { console.error(e); alert("Could not remove app: " + (e.message || e)); }
  }

  // Initial session check + sliding window + load apps
  useEffect(()=>{
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setRoute("login"); return; }

      // Sliding window
      if (!isWithinThirtyDays()) {
        await supabase.auth.signOut();
        try { localStorage.removeItem(LS_LAST_ACTIVE); } catch {}
        setRoute("login");
        return;
      }
      bumpLastActive();

      const user = session.user;

      // profile
      const { data: profile, error: profErr } = await supabase
        .from("profiles")
        .select("full_name, opt_in")
        .eq("id", user.id)
        .maybeSingle();
      if (profErr) console.warn("profiles warning:", profErr.message);

      // catalog + my apps
      const [{ data: apps, error: appsErr }, { data: rows, error: rowsErr }] = await Promise.all([
        supabase.from("apps").select("id,name,href,description,badge,is_active,logo_url")
.eq("is_active", true),
        supabase.from("user_apps").select("app_id").eq("user_id", user.id),
      ]);
      if (appsErr) console.warn("apps load warning:", appsErr.message);
      if (rowsErr) console.warn("user_apps load warning:", rowsErr.message);

      // if user has no apps, grant defaults once
      if (!rows || rows.length === 0) {
        const { data: defaults, error: defErr } = await supabase
          .from("apps")
          .select("id")
          .eq("is_default", true);
        if (defErr) console.warn("defaults warning:", defErr.message);

        if (defaults?.length) {
          const { error: insertErr } = await supabase
            .from("user_apps")
            .insert(defaults.map(a => ({ user_id: user.id, app_id: a.id })));
          if (insertErr) console.warn("user_apps insert warning:", insertErr.message);

          // reload rows
          const { data: rows2, error: rows2Err } =
            await supabase.from("user_apps").select("app_id").eq("user_id", user.id);
          if (rows2Err) console.warn("user_apps reload warning:", rows2Err.message);

          const mySet2 = new Set((rows2 || []).map(r => r.app_id));
          setCatalog(apps || []);
          setMyApps((apps || []).filter(a => mySet2.has(a.id)));
        } else {
          const mySet = new Set((rows || []).map(r => r.app_id));
          setCatalog(apps || []);
          setMyApps((apps || []).filter(a => mySet.has(a.id)));
        }
      } else {
        const mySet = new Set((rows || []).map(r => r.app_id));
        setCatalog(apps || []);
        setMyApps((apps || []).filter(a => mySet.has(a.id)));
      }

      setMe({ id: user.id, email: user.email, full_name: profile?.full_name || "" });
      setRoute("dashboard");
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, _session) => {
      if (_session) bumpLastActive();
    });
    return () => { sub.subscription.unsubscribe(); };
  },[]);

  // ---- Login
  async function handleLogin(e){
    e.preventDefault(); setErr("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: (loginForm.email || "").trim(),
        password: loginForm.password || "",
      });
      if (error) throw error;

      const user = data.user;

      // start 30-day window
      bumpLastActive();
      if (!loginForm.stay) {
        window.addEventListener("beforeunload", () => {
          try { localStorage.removeItem(LS_LAST_ACTIVE); } catch {}
        }, { once: true });
      }

      // profile
      const { data: profile, error: profErr } = await supabase
        .from("profiles")
        .select("full_name, opt_in")
        .eq("id", user.id)
        .maybeSingle();
      if (profErr) console.warn("profiles warning:", profErr.message);

      // grant defaults if none, then load apps
      const { data: rows, error: rowsErr } = await supabase
        .from("user_apps")
        .select("app_id")
        .eq("user_id", user.id);
      if (rowsErr) console.warn("user_apps load warning:", rowsErr.message);

      if (!rows || rows.length === 0) {
        const { data: defaults, error: defErr } =
          await supabase.from("apps").select("id").eq("is_default", true);
        if (defErr) console.warn("defaults load warning:", defErr.message);
        if (defaults?.length) {
          const { error: insertErr } = await supabase
            .from("user_apps")
            .insert(defaults.map(a => ({ user_id: user.id, app_id: a.id })));
          if (insertErr) console.warn("user_apps insert warning:", insertErr.message);
        }
      }

      const [{ data: apps, error: appsErr }, { data: rows2, error: rows2Err }] = await Promise.all([
        supabase.from("apps").select("id,name,href,description,badge,is_active,logo_url")
.eq("is_active", true),
        supabase.from("user_apps").select("app_id").eq("user_id", user.id),
      ]);
      if (appsErr) console.warn("apps load warning:", appsErr.message);
      if (rows2Err) console.warn("user_apps reload warning:", rows2Err.message);

      const mySet = new Set((rows2 || []).map(r => r.app_id));
      setCatalog(apps || []);
      setMyApps((apps || []).filter(a => mySet.has(a.id)));

      setMe({ id: user.id, email: user.email, full_name: profile?.full_name || "" });
      setRoute("dashboard");
    } catch (e) {
      console.error(e);
      setErr(e.message || "Login failed.");
    }
  }

  // ---- Signup
  async function handleSignup(e){
    e.preventDefault();
    setErr("");

    try {
      const { fullName, email, password, confirm, agree, optIn } = signupForm;

      if (!fullName.trim()) throw new Error("Please enter your full name.");
      if (!/\S+@\S+\.\S+/.test(email)) throw new Error("Please enter a valid email address.");
      if ((password || "").length < 8) throw new Error("Password must be at least 8 characters.");
      if (password !== confirm) throw new Error("Passwords do not match.");
      if (!agree) throw new Error("You must agree to the Terms & Conditions.");

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } }
      });
      if (error) throw error;

      const user = data.user;
      const { data: s } = await supabase.auth.getSession();
      if (!s.session || !user) {
        setErr("Check your email to confirm your account, then sign in.");
        setRoute("login");
        return;
      }

      const { error: profileErr } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: fullName.trim(),
        opt_in: !!optIn
      });
      if (profileErr) console.warn("profiles upsert warning:", profileErr.message);

      const { data: defaults, error: defErr } =
        await supabase.from("apps").select("id").eq("is_default", true);
      if (defErr) console.warn("defaults load warning:", defErr.message);

      if (defaults?.length) {
        // Use insert; duplicates are unlikely immediately after signup
        const { error: insertErr } = await supabase
          .from("user_apps")
          .insert(defaults.map(a => ({ user_id: user.id, app_id: a.id })));
        if (insertErr) console.warn("user_apps insert warning:", insertErr.message);
      }

      bumpLastActive();

      // Load catalog & my apps after signup
      const [{ data: apps, error: appsErr }, { data: rows2, error: rows2Err }] = await Promise.all([
        supabase.from("apps").select("id,name,href,description,badge,is_active,logo_url")
.eq("is_active", true),
        supabase.from("user_apps").select("app_id").eq("user_id", user.id),
      ]);
      if (appsErr) console.warn("apps load warning:", appsErr.message);
      if (rows2Err) console.warn("user_apps load warning:", rows2Err.message);

      setMe({ id: user.id, email: user.email, full_name: fullName.trim() });
      const mySet = new Set((rows2 || []).map(r => r.app_id));
      setCatalog(apps || []);
      setMyApps((apps || []).filter(a => mySet.has(a.id)));
      setRoute("dashboard");
    } catch (e) {
      console.error(e);
      setErr(e.message || "Signup failed.");
    }
  }

  // ---- Logout
  async function handleLogout(){
    await supabase.auth.signOut();
    try { localStorage.removeItem(LS_LAST_ACTIVE); } catch {}
    setMe(null); setRoute("login");
  }

  // ---- Router
  if (route === "loading") {
    return (
      <div className="au-container" style={{ display:"grid", placeItems:"center", minHeight:"40vh" }}>
        Loading…
      </div>
    );
  }

  if (route === "login")
    return <LoginPage err={err} form={loginForm} setForm={setLoginForm} onSubmit={handleLogin} goSignup={()=>{ setErr(""); setRoute("signup"); }} route={route} onLogout={handleLogout} />;

  if (route === "signup")
    return <SignupPage err={err} form={signupForm} setForm={setSignupForm} onSubmit={handleSignup} goLogin={()=>{ setErr(""); setRoute("login"); }} route={route} onLogout={handleLogout} />;

  if (route === "catalog")
    return (
      <CatalogPage
        route={route}
        onBack={()=>setRoute("dashboard")}
        catalog={catalog}
        myApps={myApps}
        addApp={addApp}
      />
    );

  return (
    <DashboardPage
      me={me}
      route={route}
      onLogout={handleLogout}
      catalog={catalog}
      myApps={myApps}
      setMyApps={setMyApps}
      goCatalog={()=>setRoute("catalog")}
      addApp={addApp}
      removeApp={removeApp}
    />
  );
} // ← closes function App()

/* ================== Mount ================== */
ReactDOM.createRoot(document.getElementById("auth-root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
