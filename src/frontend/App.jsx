import React, { useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import AdaBriefing from "./components/AdaBriefing.jsx";
import TaskList from "./components/TaskList.jsx";
import { WeekView, StatsBar, CrunchAlert, SyllabusUpload } from "./components/Widgets.jsx";
import { mockUser } from "./store.js";

function ApiKeyBanner({ apiKey, setApiKey }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");

  if (apiKey) return null;

  return (
    <div style={{
      background: "linear-gradient(90deg, rgba(56,189,248,0.08) 0%, transparent 100%)",
      borderBottom: "1px solid rgba(56,189,248,0.15)",
      padding: "10px 24px",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ada-cyan)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        ✦ Ada
      </span>
      <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
        Add your Claude API key to activate live AI intelligence
      </span>
      {!editing ? (
        <button onClick={() => setEditing(true)} style={{
          marginLeft: "auto", padding: "5px 14px", borderRadius: 6, fontSize: 12,
          background: "var(--ada-cyan)", color: "#080c14",
          border: "none", cursor: "pointer", fontFamily: "var(--font-ui)", fontWeight: 500
        }}>Add key →</button>
      ) : (
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <input
            value={val} onChange={e => setVal(e.target.value)}
            placeholder="sk-ant-..."
            type="password"
            style={{
              background: "var(--bg-elevated)", border: "1px solid var(--border-hover)",
              borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "var(--text-primary)",
              fontFamily: "var(--font-mono)", width: 260, outline: "none"
            }}
          />
          <button onClick={() => { setApiKey(val); setEditing(false); }} style={{
            padding: "5px 14px", borderRadius: 6, fontSize: 12,
            background: "var(--ada-cyan)", color: "#080c14",
            border: "none", cursor: "pointer", fontFamily: "var(--font-ui)"
          }}>Save</button>
          <button onClick={() => setEditing(false)} style={{
            padding: "5px 10px", borderRadius: 6, fontSize: 12,
            background: "transparent", border: "1px solid var(--border)",
            color: "var(--text-muted)", cursor: "pointer"
          }}>✕</button>
        </div>
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function App() {
  const [active, setActive] = useState("dashboard");
  const [apiKey, setApiKey] = useState("");

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar active={active} setActive={setActive} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <ApiKeyBanner apiKey={apiKey} setApiKey={setApiKey} />

        <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto" }}>

          {/* Page header */}
          <div className="fade-up" style={{ marginBottom: 28 }}>
            <div style={{
              fontSize: 26, fontWeight: 600, color: "var(--text-primary)",
              letterSpacing: "-0.03em", fontFamily: "var(--font-ada)", fontStyle: "italic"
            }}>
              {getGreeting()}, {mockUser.name}.
            </div>
            <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 6 }}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              {" · "}
              <span style={{ color: "var(--ada-cyan)" }}>Ada is watching your semester</span>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ marginBottom: 24 }}>
            <StatsBar />
          </div>

          {/* Crunch alert */}
          <div style={{ marginBottom: 24 }} className="fade-up-2">
            <CrunchAlert />
          </div>

          {/* Ada briefing — the hero */}
          <div style={{ marginBottom: 28 }} className="fade-up-3">
            <AdaBriefing apiKey={apiKey} />
          </div>

          {/* Main grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: 20,
            alignItems: "start"
          }}>
            {/* Left: Tasks */}
            <div className="fade-up-4">
              <TaskList />
            </div>

            {/* Right: Week + Syllabus */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="fade-up-5">
              <WeekView />
              <SyllabusUpload apiKey={apiKey} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
