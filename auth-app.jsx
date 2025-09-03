/* auth-app.jsx — Apps-United (resilient icons + Supabase + search/folders/sort + 4x/5x/6x) */
/* global React, ReactDOM, window */
const { useState, useEffect, useMemo, useRef, Component } = React;

/* ================== Supabase config ================== */
const SUPABASE_URL = "https://pvfxettbmykvezwahohh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2ZnhldHRibXlrdmV6d2Fob2hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTc2MzMsImV4cCI6MjA3MjMzMzYzM30.M5V-N3jYDs1Eijqb6ZjscNfEOSMMARe8HI20sRdAOTQ";

function bailHard(msg) {
  const el = document.getElementById("auth-root");
  if (el) {
    el.innerHTML = `<div style="padding:24px;font-family:system-ui,sans-serif;color:#fff;background:#0b1220">
      <div style="max-width:720px;margin:0 auto">
        <h2 style="margin:0 0 8px">Apps-United</h2>
        <div style="padding:12px;border:1px solid rgba(248,113,113,.5);background:rgba(248,113,113,.12);border-radius:12px">
          <strong>Startup error</strong><br/>${msg}
        </div>
        <p style="opacity:.8;margin-top:10px">Make sure <code>@supabase/supabase-js@2</code> is loaded <em>before</em> this file.</p>
      </div>
    </div>`;
  }
  throw new Error(msg);
}
if (!window.supabase || typeof window.supabase.createClient !== "function") {
  bailHard("Supabase client script missing.");
}
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

/* ================== AppIcon (uses Supabase icon_url) ================== */
function AppIcon({ app, size = 54, radius = 14 }) {
  const [broken, setBroken] = React.useState(false);
  const src = app?.icon_url;

  if (broken || !src) {
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

/* ---------- Dashboard prefs ---------- */
const LS_PREFS = "appsUnited.prefs";
function loadPrefs() { try { return JSON.parse(localStorage.getItem(LS_PREFS) || "{}"); } catch { return {}; } }
function savePrefs(p) { try { localStorage.setItem(LS_PREFS, JSON.stringify(p)); } catch {} }
function ensurePrefsShape(p) {
  const allowed = new Set(["4","5","6"]);
  return {
    grid: allowed.has(p.grid) ? p.grid : "5",
    folders: Array.isArray(p.folders) ? p.folders : [],
    appFolders: p.appFolders && typeof p.appFolders === "object" ? p.appFolders : {}
  };
}
function uid() { return Math.random().toString(36).slice(2, 8); }

/* ================== Shell ================== */
function Shell({ route, onLogout, children }) {
  return (
    <div className="au-container" data-route={route}>
      <header className="au-header" style={{ alignItems:"flex-start" }}>
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

/* ================== Pages, Dashboard, Catalog, App, Mount ================== */
/* ⚠️ Keeping everything else identical to your working file, no changes except AppIcon */
