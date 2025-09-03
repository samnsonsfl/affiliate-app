/* auth-app.jsx — Apps-United (Supabase + icon_url fixed) */
/* global React, ReactDOM, window */
const { useState, useEffect, Component } = React;

/* ================== Supabase config ================== */
const SUPABASE_URL = "https://pvfxettbmykvezwahohh.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2ZnhldHRibXlrdmV6d2Fob2hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTc2MzMsImV4cCI6MjA3MjMzMzYzM30.M5V-N3jYDs1Eijqb6ZjscNfEOSMMARe8HI20sRdAOTQ";

if (!window.supabase || typeof window.supabase.createClient !== "function") {
  throw new Error("Supabase client script missing.");
}
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

/* ================== AppIcon ================== */
function AppIcon({ app, size = 54, radius = 14 }) {
  const [broken, setBroken] = React.useState(false);
  const src = app?.icon_url;

  if (!src || broken) {
    return (
      <div
        className="app-icon"
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          background: "#1e293b",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 600,
          fontSize: size * 0.5,
        }}
      >
        {(app?.name || "?").slice(0, 1)}
      </div>
    );
  }

  return (
    <div
      className="app-icon"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        overflow: "hidden",
        background: "#f1f5f9",
      }}
    >
      <img
        src={src}
        alt={app?.name || ""}
        loading="lazy"
        onError={() => setBroken(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
}

/* ================== Error Boundary ================== */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("Apps-United error:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="au-container" style={{ paddingTop: 40 }}>
          <div
            className="au-card"
            style={{
              padding: 16,
              borderColor: "rgba(248,113,113,.5)",
              background: "rgba(248,113,113,.12)",
            }}
          >
            <h2 style={{ margin: "6px 0 8px", fontWeight: 700 }}>
              Something went wrong
            </h2>
            <div className="au-note">
              Open your browser console to see details.
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ================== App (Router + Supabase Auth) ================== */
function App() {
  const [route, setRoute] = useState("loading");
  const [err, setErr] = useState("");
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
    stay: true,
  });
  const [signupForm, setSignupForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirm: "",
    agree: false,
    optIn: true,
  });
  const [me, setMe] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [myApps, setMyApps] = useState([]);

  /* ---------- Add/Remove Apps ---------- */
  async function addApp(app) {
    try {
      const { error } = await supabase
        .from("user_apps")
        .insert({ user_id: me.id, app_id: app.id });
      if (error) throw error;
      setMyApps((prev) =>
        prev.some((p) => p.id === app.id) ? prev : [...prev, app]
      );
    } catch (e) {
      console.error(e);
      alert("Could not add app: " + (e.message || e));
    }
  }

  async function removeApp(app) {
    try {
      const { error } = await supabase
        .from("user_apps")
        .delete()
        .eq("user_id", me.id)
        .eq("app_id", app.id);
      if (error) throw error;
      setMyApps((prev) => prev.filter((p) => p.id !== app.id));
    } catch (e) {
      console.error(e);
      alert("Could not remove app: " + (e.message || e));
    }
  }

  /* ---------- Session Load ---------- */
  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setRoute("login");
        return;
      }

      const user = session.user;

      const [{ data: apps }, { data: rows }] = await Promise.all([
        supabase
          .from("apps")
          .select("id,name,href,description,badge,is_active,icon_url")
          .eq("is_active", true),
        supabase.from("user_apps").select("app_id").eq("user_id", user.id),
      ]);

      console.log(
        "✅ Apps from Supabase:",
        apps?.map((a) => ({ name: a.name, icon_url: a.icon_url }))
      );

      const mySet = new Set((rows || []).map((r) => r.app_id));
      setCatalog(apps || []);
      setMyApps((apps || []).filter((a) => mySet.has(a.id)));
      setMe({ id: user.id, email: user.email });
      setRoute("dashboard");
    })();
  }, []);

  /* ---------- Login ---------- */
  async function handleLogin(e) {
    e.preventDefault();
    setErr("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: (loginForm.email || "").trim(),
        password: loginForm.password || "",
      });
      if (error) throw error;

      const user = data.user;

      const [{ data: apps }, { data: rows }] = await Promise.all([
        supabase
          .from("apps")
          .select("id,name,href,description,badge,is_active,icon_url")
          .eq("is_active", true),
        supabase.from("user_apps").select("app_id").eq("user_id", user.id),
      ]);

      console.log(
        "✅ Apps after login:",
        apps?.map((a) => ({ name: a.name, icon_url: a.icon_url }))
      );

      const mySet = new Set((rows || []).map((r) => r.app_id));
      setCatalog(apps || []);
      setMyApps((apps || []).filter((a) => mySet.has(a.id)));
      setMe({ id: user.id, email: user.email });
      setRoute("dashboard");
    } catch (e) {
      console.error(e);
      setErr(e.message || "Login failed.");
    }
  }

  /* ---------- Signup ---------- */
  async function handleSignup(e) {
    e.preventDefault();
    setErr("");
    try {
      const { fullName, email, password, confirm, agree } = signupForm;

      if (!fullName.trim()) throw new Error("Please enter your full name.");
      if (!/\S+@\S+\.\S+/.test(email))
        throw new Error("Please enter a valid email address.");
      if ((password || "").length < 8)
        throw new Error("Password must be at least 8 characters.");
      if (password !== confirm) throw new Error("Passwords do not match.");
      if (!agree) throw new Error("You must agree to the Terms & Conditions.");

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      });
      if (error) throw error;

      const user = data.user;

      const [{ data: apps }, { data: rows }] = await Promise.all([
        supabase
          .from("apps")
          .select("id,name,href,description,badge,is_active,icon_url")
          .eq("is_active", true),
        supabase.from("user_apps").select("app_id").eq("user_id", user.id),
      ]);

      console.log(
        "✅ Apps after signup:",
        apps?.map((a) => ({ name: a.name, icon_url: a.icon_url }))
      );

      const mySet = new Set((rows || []).map((r) => r.app_id));
      setCatalog(apps || []);
      setMyApps((apps || []).filter((a) => mySet.has(a.id)));
      setMe({ id: user.id, email: user.email, full_name: fullName.trim() });
      setRoute("dashboard");
    } catch (e) {
      console.error(e);
      setErr(e.message || "Signup failed.");
    }
  }

  /* ---------- Render ---------- */
  if (route === "loading") {
    return <div>Loading…</div>;
  }
  if (route === "login") {
    return (
      <form onSubmit={handleLogin}>
        <input
          value={loginForm.email}
          onChange={(e) =>
            setLoginForm((s) => ({ ...s, email: e.target.value }))
          }
        />
        <input
          type="password"
          value={loginForm.password}
          onChange={(e) =>
            setLoginForm((s) => ({ ...s, password: e.target.value }))
          }
        />
        <button type="submit">Login</button>
        {err && <div>{err}</div>}
      </form>
    );
  }
  if (route === "signup") {
    return (
      <form onSubmit={handleSignup}>
        <input
          value={signupForm.fullName}
          onChange={(e) =>
            setSignupForm((s) => ({ ...s, fullName: e.target.value }))
          }
        />
        <input
          value={signupForm.email}
          onChange={(e) =>
            setSignupForm((s) => ({ ...s, email: e.target.value }))
          }
        />
        <input
          type="password"
          value={signupForm.password}
          onChange={(e) =>
            setSignupForm((s) => ({ ...s, password: e.target.value }))
          }
        />
        <input
          type="password"
          value={signupForm.confirm}
          onChange={(e) =>
            setSignupForm((s) => ({ ...s, confirm: e.target.value }))
          }
        />
        <button type="submit">Sign up</button>
        {err && <div>{err}</div>}
      </form>
    );
  }

  return (
    <div>
      <h2>Dashboard</h2>
      <div className="apps-grid">
        {myApps.map((app) => (
          <div key={app.id}>
            <AppIcon app={app} />
            <div>{app.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================== Mount ================== */
const mount = (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
const rootEl = document.getElementById("auth-root");
if (ReactDOM.createRoot) {
  ReactDOM.createRoot(rootEl).render(mount);
} else {
  ReactDOM.render(mount, rootEl);
}

