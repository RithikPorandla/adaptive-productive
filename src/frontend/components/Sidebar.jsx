import React from "react";
import { mockUser, mockCourses } from "../store.js";

const navItems = [
  { id: "dashboard", icon: "⬡", label: "Overview" },
  { id: "tasks", icon: "◻", label: "Tasks" },
  { id: "schedule", icon: "◈", label: "Schedule" },
  { id: "focus", icon: "◎", label: "Focus" },
  { id: "syllabus", icon: "▤", label: "Syllabi" },
];

export default function Sidebar({ active, setActive }) {
  return (
    <div style={{
      width: 220, flexShrink: 0, height: "100vh",
      background: "var(--bg-surface)",
      borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column",
      position: "sticky", top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "linear-gradient(135deg, var(--ada-cyan), var(--accent-violet))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, color: "#080c14", fontWeight: 700
          }}>A</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              Adaptive
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              powered by Ada
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "12px 10px", flex: 1 }}>
        <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", padding: "4px 10px 8px" }}>
          Main
        </div>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setActive(item.id)} style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%",
            padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer",
            background: active === item.id ? "var(--ada-cyan-dim)" : "transparent",
            color: active === item.id ? "var(--ada-cyan)" : "var(--text-secondary)",
            fontSize: 13, fontWeight: active === item.id ? 500 : 400,
            fontFamily: "var(--font-ui)", textAlign: "left",
            transition: "all 0.15s", marginBottom: 2,
          }}
            onMouseOver={e => { if (active !== item.id) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
            onMouseOut={e => { if (active !== item.id) e.currentTarget.style.background = "transparent"; }}
          >
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            {item.label}
            {active === item.id && (
              <span style={{
                marginLeft: "auto", width: 5, height: 5, borderRadius: "50%",
                background: "var(--ada-cyan)"
              }} />
            )}
          </button>
        ))}

        {/* Courses */}
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", padding: "4px 10px 8px" }}>
            Courses
          </div>
          {mockCourses.map(course => (
            <div key={course.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "7px 12px", borderRadius: 8, marginBottom: 2,
              cursor: "pointer", transition: "background 0.15s",
            }}
              onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: course.color, flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {course.name}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  {course.code}
                </div>
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* User */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--accent-violet), var(--ada-cyan))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 600, color: "white", flexShrink: 0
          }}>
            {mockUser.name[0]}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{mockUser.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {mockUser.major}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
