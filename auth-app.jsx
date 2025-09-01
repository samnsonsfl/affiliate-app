/* auth-app.jsx — Apps-United login, signup, and dashboard (no build; CDN React) */
const { useState, useEffect, useMemo } = React;

// ---- Storage keys & helpers --------------------------------------------
const LS_USERS = "appsUnited.users";
const LS_SESSION = "appsUnited.session";
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

const demoHash = (s) =>
  "hash_" + btoa(unescape(encodeURIComponent(s))).replace(/=/g, "");

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(LS_USERS) || "[]"); }
  catch { return []; }
}
function saveUsers(u) { localStorage.setItem(LS_USERS, JSON.stringify(u)); }

function loadSession() {
  try { return JSON.parse(localStorage.getItem(LS_SESSION) || "null"); }
  catch { return null; }
}
function saveSession(s) { localStorage.setItem(LS_SESSION, JSON.stringify(s)); }
function clearSession() { localStorage.removeItem(LS_SESSION); }

function getUserByEmail(email) {
  return loadUsers().find(
    (u) => u.email.toLowerCase() === (email || "").toLowerCase()
  );
}
function upsertUser(user) {
  const users = loadUsers();
  const i = users.findIndex(
    (u) => u.email.toLowerCase() === user.email.toLowerCase()
  );
  if (i >= 0) users[i] = user; else users.push(user);
  saveUsers(users);
}
function isSessionFresh(s, now = Date.now()) {
  if (!s) return false;
  return s.persistent && now - (s.lastActive || 0) < THIRTY_DAYS;
}

// ---- Default starter apps (placeholders for now) ------------------------
const defaultApps = [
  { id: "app1", name: "App One",   desc: "Your first starter app.", href: "#", badge: "Starter" },
  { id: "app2", name: "App Two",   desc: "Another placeholder app.", href: "#", badge: "Starter" },
  { id: "app3", name: "App Three", desc: "Ready for future features.", href: "#", badge: "Starter" },
  { id: "app4", name: "App Four",  desc: "Customize this later.",     href: "#", badge: "Starter" },
];

// ---- UI primitives (match auth.css) ------------------------------------
function Shell({ route, onLogout, children }) {
  return (
    <div className="au-container">
      <header className="au-header" style={{alignItems:"flex-start"}}>
        {/* Brand: logo with text UNDER it */}
        <div className="au-brand" style={{flexDirection:"column", alignItems:"center", textAlign:"center"}}>
          <img
            src="./favicon-192.png"
            alt="Apps-United logo"
            style={{ width: 64, height: 64, borderRadius: 16 }}
          />
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
    <div
      className="au-card"
      style={{
        borderColor: "rgba(248,113,113,.5)",
        background: "rgba(248,113,113,.12)",
        padding: 12,
        marginBottom: 8,
      }}
    >
      <span>⚠️</span> <span style={{ marginLeft: 8 }}>{children}</span>
    </div>
  );
}

// ---- App (router + pages) ----------------------------------------------
function App() {
  const [route, setRoute] = useState("loading"); // loading | login | signup | dashboard
  const [err, setErr] = useState("");
  const [loginForm, setLoginForm] = useState({ email: "", password: "", stay: true });
  const [signupForm, setSignupForm] = useState({
    fullName: "", email: "", password: "", confirm: "", agree: false, optIn: true
  });
  const [me, setMe] = useState(null);

  // Bootstrap session with sliding 30-day window
  useEffect(() => {
    const s = loadSession();
    if (!isSessionFresh(s)) { clearSession(); setRoute("login"); return; }
    const user = getUserByEmail(s.email);
    if (!user) { clearSession(); setRoute("login"); return; }
    saveSession({ ...s, lastActive: Date.now() }); // extend on open
    setMe(user);
    setRoute("dashboard");
  }, []);

  // Auth actions
  function handleLogin(e) {
    e.preventDefault(); setErr("");
    const u = getUserByEmail(loginForm.email || "");
    if (!u) return setErr("No account found for that email.");
    if (u.passwordHash !== demoHash(loginForm.password)) return setErr("Incorrect password.");
    saveSession({ email: u.email, lastActive: Date.now(), persistent: !!loginForm.stay });
    setMe(u); setRoute("dashboard");
  }

  function handleSignup(e) {
    e.preventDefault(); setErr("");
    const { fullName, email, password, confirm, agree, optIn } = signupForm;
    if (!fullName.trim()) return setErr("Please enter your full name.");
    if (!/\S+@\S+\.\S+/.test(email)) return setErr("Please enter a valid email address.");
    if (password.length < 8) return setErr("Password must be at least 8 characters.");
    if (password !== confirm) return setErr("Passwords do not match.");
    if (!agree) return setErr("You must agree to the Terms & Conditions.");
    if (getUserByEmail(email)) return setErr("That email is already registered.");

    const user = {
      fullName: fullName.trim(),
      email: email.trim(),
      passwordHash: demoHash(password),
      optIn: !!optIn,
      apps: [...defaultApps],
    };
    upsertUser(user);
    // Auto-login after signup; persistent by default
    saveSession({ email: user.email, lastActive: Date.now(), persistent: true });
    setMe(user); setRoute("dashboard");
  }

  function handleLogout() { clearSession(); setMe(null); setRoute("login"); }

  // Pages
  const Login = () => (
    <Shell route={route} onLogout={handleLogout}>
      <div className="au-grid" style={{ maxWidth: 520, margin: "0 auto" }}>
        <div className="au-card">
          <div className="au-card-header">
            <h2 style={{ margin: 0, fontWeight: 600 }}>Sign in</h2>
          </div>
          <div className="au-card-content">
            {err && <ErrorNote>{err}</ErrorNote>}
            <form onSubmit={handleLogin} className="au-grid" style={{ gap: 16 }}>
              <div>
                <label className="au-note">Email</label>
                <input
                  className="au-input"
                  type="email"
                  placeholder="you@example.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="au-note">Password</label>
                <input
                  className="au-input"
                  type="password"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
              </div>
              <div className="au-row-between" style={{ marginTop: 4 }}>
                <label className="au-row" style={{ fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={loginForm.stay}
                    onChange={(e) => setLoginForm({ ...loginForm, stay: e.target.checked })}
                  />
                  <span>Stay signed in for 30 days</span>
                </label>
                <button
                  type="button"
                  className="au-btn au-btn-secondary"
                  onClick={() => setRoute("signup")}
                >
                  Create account
                </button>
              </div>
              <button type="submit" className="au-btn au-btn-primary">Sign in</button>
            </form>
          </div>
          <div className="au-card-footer">
            <p className="au-note" style={{ textAlign: "center" }}>
              By signing in you agree to our Terms & Privacy.
            </p>
          </div>
        </div>
      </div>
    </Shell>
  );

  const Signup = () => (
    <Shell route={route} onLogout={handleLogout}>
      <div className="au-grid" style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className="au-card">
          <div className="au-card-header">
            <h2 style={{ margin: 0, fontWeight: 600 }}>Create your account</h2>
          </div>
          <div className="au-card-content">
            {err && <ErrorNote>{err}</ErrorNote>}
            <form onSubmit={handleSignup} className="au-grid" style={{ gap: 16 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="au-note">Full name</label>
                <input
                  className="au-input"
                  placeholder="Jane Doe"
                  value={signupForm.fullName}
                  onChange={(e) =>
                    setSignupForm({ ...signupForm, fullName: e.target.value })
                  }
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="au-note">Email</label>
                <input
                  className="au-input"
                  type="email"
                  placeholder="you@example.com"
                  value={signupForm.email}
                  onChange={(e) =>
                    setSignupForm({ ...signupForm, email: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="au-note">Password</label>
                <input
                  className="au-input"
                  type="password"
                  placeholder="Min 8 characters"
                  value={signupForm.password}
                  onChange={(e) =>
                    setSignupForm({ ...signupForm, password: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="au-note">Confirm password</label>
                <input
                  className="au-input"
                  type="password"
                  placeholder="Repeat password"
                  value={signupForm.confirm}
                  onChange={(e) =>
                    setSignupForm({ ...signupForm, confirm: e.target.value })
                  }
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }} className="au-row">
                <input
                  type="checkbox"
                  checked={signupForm.agree}
                  onChange={(e) =>
                    setSignupForm({ ...signupForm, agree: e.target.checked })
                  }
                />
                <span>
                  I agree to the{" "}
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    Terms & Conditions
                  </a>.
                </span>
              </div>
              <div style={{ gridColumn: "1 / -1" }} className="au-row">
                <input
                  type="checkbox"
                  checked={signupForm.optIn}
                  onChange={(e) =>
                    setSignupForm({ ...signupForm, optIn: e.target.checked })
                  }
                />
                <span>
                  Send me helpful updates and the occasional ✨ good spam ✨
                </span>
              </div>
              <div
                className="au-row"
                style={{ gridColumn: "1 / -1", gap: 12, flexWrap: "wrap" }}
              >
                <button type="submit" className="au-btn au-btn-primary">
                  Create account
                </button>
                <button
                  type="button"
                  className="au-btn au-btn-secondary"
                  onClick={() => setRoute("login")}
                >
                  I already have an account
                </button>
              </div>
            </form>
          </div>
          <div className="au-card-footer">
            <p className="au-note" style={{ textAlign: "center" }}>
              We respect your inbox. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>
    </Shell>
  );

  const Dashboard = () => {
    const apps = useMemo(() => (me?.apps?.length ? me.apps : defaultApps), [me]);

    return (
      <Shell route={route} onLogout={handleLogout}>
        <div className="au-grid" style={{ gap: 24 }}>
          <div>
            <h2 style={{ margin: "0 0 8px", fontWeight: 600, fontSize: 24 }}>
              Welcome{me?.fullName ? `, ${me.fullName.split(" ")[0]}` : ""} 👋
            </h2>
            <div className="au-note">
              Your starter apps are ready. Add more soon.
            </div>
          </div>

          <div className="au-grid au-grid-3">
            {apps.map((app) => (
              <div key={app.id} className="au-card">
                <div className="au-card-header">
                  <div className="au-row-between">
                    <div className="au-subtle" style={{ fontWeight: 600 }}>
                      {app.name}
                    </div>
                    {app.badge && <span className="au-badge">{app.badge}</span>}
                  </div>
                </div>
                <div className="au-card-content">
                  <div className="au-note">{app.desc}</div>
                </div>
                <div className="au-card-footer au-row" style={{ gap: 12 }}>
                  <a className="au-btn au-btn-primary" href={app.href}>
                    Open
                  </a>
                  <button
                    className="au-btn au-btn-secondary"
                    disabled
                    title="Coming soon"
                  >
                    Add to favorites
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="au-card" style={{ padding: 16 }}>
            <div className="au-row-between">
              <div>
                <div className="au-subtle" style={{ fontWeight: 600 }}>
                  Want more apps?
                </div>
                <div className="au-note">
                  We’re adding a self-serve app catalog. You’ll be able to
                  enable/disable apps per account.
                </div>
              </div>
              <button className="au-btn au-btn-secondary" disabled title="Coming soon">
                Add app
              </button>
            </div>
          </div>
        </div>
      </Shell>
    );
  };

  if (route === "loading")
    return (
      <div
        className="au-container"
        style={{ display: "grid", placeItems: "center", minHeight: "40vh" }}
      >
        Loading…
      </div>
    );
  if (route === "login") return <Login />;
  if (route === "signup") return <Signup />;
  return <Dashboard />;
}

// Mount app
ReactDOM.createRoot(document.getElementById("auth-root")).render(<App />);
