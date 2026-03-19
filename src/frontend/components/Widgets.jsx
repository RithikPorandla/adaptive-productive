import React, { useState } from "react";
import { mockWeekSchedule, mockCourses, mockCrunchWeeks, mockUser } from "../store.js";
import { parseSyllabus } from "../ada.js";

// ── Week Schedule ──────────────────────────────────────────────
export function WeekView() {
  const today = new Date().getDay(); // 0=Sun,1=Mon...
  const dayMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5 };

  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 16, overflow: "hidden"
    }}>
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)" }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>This Week</h3>
      </div>
      <div style={{ display: "flex", padding: "16px" }}>
        {mockWeekSchedule.map(day => {
          const isToday = dayMap[day.day] === today;
          return (
            <div key={day.day} style={{ flex: 1, padding: "0 4px" }}>
              <div style={{
                textAlign: "center", marginBottom: 8,
                padding: "6px 4px",
                borderRadius: 8,
                background: isToday ? "var(--ada-cyan-dim)" : "transparent",
                border: isToday ? "1px solid rgba(56,189,248,0.2)" : "1px solid transparent",
              }}>
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: 11,
                  color: isToday ? "var(--ada-cyan)" : "var(--text-muted)",
                  textTransform: "uppercase", letterSpacing: "0.06em"
                }}>{day.day}</div>
                <div style={{
                  fontSize: 12, marginTop: 2,
                  color: isToday ? "var(--text-primary)" : "var(--text-secondary)"
                }}>
                  {day.date.split(" ")[1]}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {day.classes.map((cls, i) => {
                  const course = mockCourses.find(c => c.code === cls.code);
                  return (
                    <div key={i} style={{
                      borderRadius: 6, padding: "6px 8px",
                      background: `${course?.color || "#818cf8"}15`,
                      borderLeft: `2px solid ${course?.color || "#818cf8"}`,
                    }}>
                      <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: course?.color || "#818cf8" }}>
                        {cls.code}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                        {cls.time}
                      </div>
                    </div>
                  );
                })}
                {day.classes.length === 0 && (
                  <div style={{ textAlign: "center", padding: "12px 0" }}>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>—</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Stats Bar ──────────────────────────────────────────────────
export function StatsBar() {
  const { behaviorProfile } = mockUser;
  const stats = [
    {
      label: "Completion Rate",
      value: `${Math.round(behaviorProfile.completionRate * 100)}%`,
      sub: "this semester",
      color: "#34d399",
      icon: "◈"
    },
    {
      label: "Focus Hours",
      value: `${behaviorProfile.totalFocusHours}h`,
      sub: "logged total",
      color: "var(--ada-cyan)",
      icon: "◎"
    },
    {
      label: "Day Streak",
      value: `${behaviorProfile.streakDays}`,
      sub: "days active",
      color: "#fbbf24",
      icon: "◆"
    },
    {
      label: "Peak Time",
      value: behaviorProfile.peakHours,
      sub: "Ada learned this",
      color: "#818cf8",
      icon: "◐"
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
      {stats.map((s, i) => (
        <div key={i} className={`fade-up-${i + 1}`} style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 12, padding: "16px 20px",
          transition: "border-color 0.2s, transform 0.2s",
          cursor: "default",
        }}
          onMouseOver={e => {
            e.currentTarget.style.borderColor = `${s.color}40`;
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseOut={e => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 500,
                color: s.color, letterSpacing: "-0.02em"
              }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{s.sub}</div>
            </div>
            <span style={{ fontSize: 20, color: s.color, opacity: 0.5 }}>{s.icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Crunch Week Alert ──────────────────────────────────────────
export function CrunchAlert() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const next = mockCrunchWeeks[0];
  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(251,113,133,0.05) 100%)",
      border: "1px solid rgba(251,191,36,0.25)",
      borderRadius: 12, padding: "14px 18px",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ fontSize: 20 }}>⚡</span>
        <div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Crunch Alert
          </span>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 3 }}>
            <strong style={{ color: "var(--text-primary)" }}>{next.week}</strong> — {next.deadlines} deadlines incoming.
            Ada has started pre-planning your blocks.
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button style={{
          padding: "7px 14px", borderRadius: 8, fontSize: 12,
          background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)",
          color: "#fbbf24", cursor: "pointer", fontFamily: "var(--font-ui)"
        }}>View plan</button>
        <button onClick={() => setDismissed(true)} style={{
          padding: "7px 14px", borderRadius: 8, fontSize: 12,
          background: "transparent", border: "1px solid var(--border)",
          color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--font-ui)"
        }}>Dismiss</button>
      </div>
    </div>
  );
}

// ── Syllabus Upload ────────────────────────────────────────────
export function SyllabusUpload({ apiKey }) {
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFile = async (file) => {
    if (!file || file.type !== "application/pdf") {
      setError("Please upload a PDF syllabus"); return;
    }
    if (!apiKey) { setError("Add your API key to parse syllabi"); return; }

    setParsing(true); setError(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(",")[1];
      try {
        const data = await parseSyllabus(base64, "Course", apiKey);
        setResult(data);
      } catch (err) {
        setError("Parsing failed — " + err.message);
      }
      setParsing(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 16, overflow: "hidden"
    }}>
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)" }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Import Syllabus</h3>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
          Ada reads your syllabus and builds your semester plan automatically
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {!result ? (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => document.getElementById("syllabus-input").click()}
            style={{
              border: `2px dashed ${dragging ? "var(--ada-cyan)" : "var(--border-hover)"}`,
              borderRadius: 12, padding: "32px 20px", textAlign: "center",
              cursor: "pointer", transition: "all 0.2s",
              background: dragging ? "var(--ada-cyan-dim)" : "transparent",
            }}
          >
            <input id="syllabus-input" type="file" accept=".pdf" style={{ display: "none" }}
              onChange={e => handleFile(e.target.files[0])} />
            <div style={{ fontSize: 32, marginBottom: 12 }}>
              {parsing ? "⟳" : "📄"}
            </div>
            <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              {parsing ? "Ada is reading your syllabus..." : "Drop your syllabus PDF here"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
              {parsing ? "Extracting deadlines, exams, and assignments" : "or click to browse"}
            </div>
            {error && <div style={{ marginTop: 12, fontSize: 12, color: "#fb7185" }}>{error}</div>}
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{result.courseName}</div>
                <div style={{ fontSize: 12, color: "var(--ada-cyan)", marginTop: 3 }}>
                  ✓ {result.tasks?.length || 0} items extracted
                </div>
              </div>
              <button onClick={() => setResult(null)} style={{
                fontSize: 12, color: "var(--text-muted)", background: "none",
                border: "1px solid var(--border)", borderRadius: 6, padding: "5px 10px", cursor: "pointer"
              }}>Upload another</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
              {result.tasks?.slice(0, 8).map((t, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 12px", borderRadius: 8,
                  background: "var(--bg-elevated)", border: "1px solid var(--border)"
                }}>
                  <div style={{ fontSize: 13, color: "var(--text-primary)" }}>{t.title}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>{t.dueDate}</div>
                </div>
              ))}
            </div>
            <button style={{
              marginTop: 14, width: "100%", padding: "10px",
              borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: "var(--ada-cyan)", color: "#080c14",
              border: "none", cursor: "pointer", fontFamily: "var(--font-ui)"
            }}>Add to my semester plan →</button>
          </div>
        )}
      </div>
    </div>
  );
}
