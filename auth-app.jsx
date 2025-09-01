/* auth-app.jsx — Apps-United + Supabase Auth (CDN React, no build) */
const { useState, useEffect, useMemo, Component } = React;

/* ====== 0) CONFIG — put your real project values here ====== */
const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";      // ← replace
const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";             // ← replace

/* ====== 1) Supabase client ====== */
const supabase = window.supabase.createClient(https://pvfxettbmykvezwahohh.supabase.co, eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2ZnhldHRibXlrdmV6d2Fob2hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTc2MzMsImV4cCI6MjA3MjMzMzYzM30.M5V-N3jYDs1Eijqb6ZjscNfEOSMMARe8HI20sRdAOTQ, {
  auth: {
    persistSession: true,          // store session in localStorage
    autoRefreshToken: true,
    detectSessionInUrl: false,     // we’re not using magic links here
  },
});

/* ====== 2) Error boundary (so blank pages show an error panel) ====== */
class ErrorBoundary extends Component {
  constructor(p){ super(p); this.state = { error: null }; }
  static getDerivedStateFromError(e){ return { error: e }; }
  componentDidCatch(e, info){ console.error("Apps-United error:", e, info); }
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

/* ====== 3) App data & helpers ====== */
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
const LS_LAST_ACTIVE = "appsUnited.lastActive"; // for sliding 30-day logout

const defaultApps = [
  { id: "app1", name: "App One",   desc: "Your first starter app.",   badge: "Starter" },
  { id: "app2", name: "App Two",   desc: "Another placeholder app.",  badge: "Starter" },
  { id: "app3", name: "App Three", desc: "Ready for future features.", badge: "Starter" },
  { id: "app4", name: "App Four",  desc: "Customize this later.",     badge: "Starter" },
];

function getLastActive() {
  try { return parseInt(localStorage.getItem(LS_LAST_ACTIVE) || "0", 10); }
  catch { return 0; }
}
function bumpLastActive() {
  try { localStorage.setItem(LS_LAST_ACTIVE, String(Date.now())); } catch {}
}
function isWithinThirtyDays() {
  const last = getLastActive();
  if (!last) return false;
  return (Date.now() - last) < THIRTY_DAYS;
}

/* ====== 4) UI Shell ====== */
function Shell({ route, onLogout, children }) {
  return (
    <div className="au-container">
      <header className="au-header" style={{ alignItems: "flex-start" }}>
        <div className="au-brand" style={{flexDirection:"column", alignItems:"center", textAlign:"center"}}>
          <img src="./favicon-192.png" alt="Apps-United logo" style={{width:64, height:64, borderRadius:16}} />
          <div style={{ marginTop: 6 }}>
            <div className="au-subtle" style={{ fontWeight: 600 }}>Apps-United</div>
            <div className="au-note">All your apps, your way.</div>
          </div>
        </div>
        {route === "dashboard" && (
          <button className="au-btn au-btn-secondary" onClick={onLogout}>Logout</button>
        )}
      </header>
      {children}
    </div>
  );
}
function ErrorNote({ children }) {
  return (
    <div className="au-card" style={{
      borderColor:"rgba(248,113,113,.5)", background:"rgba(248,113,113,.12)", padding:12, marginBottom:8
    }}>
      <span>⚠️</span> <span style={{ marginLeft: 8 }}>{children}</span>
    </div>
  );
}

/* ====== 5) Top-level pages (stable identity) ====== */
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
  const apps = useMemo(()=> (me?.apps?.length ? me.apps : defaultApps), [me]);
  return (
    <Shell route={route} onLogout={onLogout}>
      <div className="au-grid" style={{ gap: 24 }}>
        <div>
          <h2 style={{ margin: "0 0 8px", fontWeight: 600, fontSize: 24 }}>
            Welcome{me?.full_name ? `, ${me.full_name.split(" ")[0]}` : ""} 👋
          </h2>
          <div className="au-note">Your starter apps are ready. Add more soon.</div>
        </div>
        <div className="au-grid au-grid-3">
          {apps.map(app => (
            <div key={app.id} className="au-card">
              <div className="au-card-header">
                <div className="au-row-between">
                  <div className="au-subtle" style={{ fontWeight: 600 }}>{app.name}</div>
                  {app.badge && <span className="au-badge">{app.badge}</span>}
                </div>
              </div>
              <div className="au-card-content"><div className="au-note">{app.desc}</div></div>
              <div className="au-card-footer au-row" style={{ gap: 12 }}>
                <button className="au-btn au-btn-primary" onClick={()=>alert(`Open ${app.name} (stub)`)}>Open</button>
                <button className="au-btn au-btn-secondary" disabled title="Coming soon">Add to favorites</button>
              </div>
            </div>
          ))}
        </div>
        <div className="au-card" style={{ padding: 16 }}>
          <div className="au-row-between">
            <div>
              <div className="au-subtle" style={{ fontWeight: 600 }}>Want more apps?</div>
              <div className="au-note">We’re adding a self-serve app catalog. You’ll be able to enable/disable apps per account.</div>
            </div>
            <button className="au-btn au-btn-secondary" disabled title="Coming soon">Add app</button>
          </div>
        </div>
      </div>
    </Shell>
  );
}

/* ====== 6) App (Router + Supabase auth) ====== */
function App(){
  const [route, setRoute] = useState("loading"); // loading | login | signup | dashboard
  const [err, setErr] = useState("");
  const [loginForm, setLoginForm] = useState({ email:"", password:"", stay:true });
  const [signupForm, setSignupForm] = useState({
    fullName:"", email:"", password:"", confirm:"", agree:false, optIn:true
  });
  const [me, setMe] = useState(null); // merged view: { id, email, full_name? }

  // On first load: check current session + 30-day sliding window
  useEffect(()=>{
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setRoute("login"); return; }

      // Enforce sliding 30-day window (from last time user opened app)
      if (!isWithinThirtyDays()) {
        await supabase.auth.signOut();
        localStorage.removeItem(LS_LAST_ACTIVE);
        setRoute("login");
        return;
      }
      bumpLastActive();

      // Load profile
      const user = session.user;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, opt_in")
        .eq("id", user.id)
        .maybeSingle();

      setMe({ id: user.id, email: user.email, full_name: profile?.full_name || "" });
      setRoute("dashboard");
    })();

    // Keep lastActive fresh whenever Supabase refreshes the session
    const { data: sub } = supabase.auth.onAuthStateChange((_event, _session) => {
      if (_session) bumpLastActive();
    });
    return () => { sub.subscription.unsubscribe(); };
  },[]);

  async function handleLogin(e){
    e.preventDefault(); setErr("");
    try {
      const stay = !!loginForm.stay;
      // Note: Supabase persistSession=true already uses localStorage.
      const { data, error } = await supabase.auth.signInWithPassword({
        email: (loginForm.email || "").trim(),
        password: loginForm.password || "",
      });
      if (error) throw error;

      // Sliding window: start counting from “now”
      bumpLastActive();

      // Load profile
      const user = data.user;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, opt_in")
        .eq("id", user.id)
        .maybeSingle();

      setMe({ id: user.id, email: user.email, full_name: profile?.full_name || "" });
      setRoute("dashboard");

      // (Optional) If user didn’t check “stay signed in”, we can simulate session-only by clearing
      // the sliding window on tab close (best-effort). Real session shortening needs a server.
      if (!stay) window.addEventListener("beforeunload", () => {
        try { localStorage.removeItem(LS_LAST_ACTIVE); } catch {}
      }, { once: true });
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

      // Supabase sign up
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() } // stored in auth.users.user_metadata
        }
      });
      if (error) throw error;

      // Create profile row tied to auth user id
      const user = data.user;
      if (user) {
        await supabase.from("profiles").upsert({
          id: user.id,
          full_name: fullName.trim(),
          opt_in: !!optIn,
        });
      }

      // Sliding window starts now
      bumpLastActive();

      // If your project has email confirmations enabled, user may need to confirm.
      // For simplicity, go to dashboard if session exists; else, show a message.
      const { data: sessionRes } = await supabase.auth.getSession();
      if (!sessionRes.session) {
        setErr("Check your inbox to confirm your email, then sign in.");
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

/* ====== 7) Mount ====== */
ReactDOM.createRoot(document.getElementById("auth-root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
