import { useState, useEffect } from "react";
import { api } from "../api";
import { useUser } from "../App";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const user = useUser();
  const [data, setData] = useState(null);
  const [plan, setPlan] = useState(null);
  const [recentFocus, setRecentFocus] = useState([]);
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    if (!user) return;
    api.getDashboard(user.id).then(setData).catch(console.error);
    api.getTodayPlan(user.id).then(setPlan).catch(console.error);
    api.getFocusSessions(user.id).then(s => setRecentFocus(s.slice(0, 5))).catch(console.error);
    api.getInsights(user.id).then(setInsights).catch(console.error);
  }, [user]);

  if (!data) return <div className="loading-screen">Loading...</div>;
  const { tasks, subtasks, focus } = data;

  return (
    <div className="page-content" style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Hero greeting */}
      <div className="prismo-hero">
        <h1>{greeting()}, {user?.name || "Student"}</h1>
        <p>Here's your productivity snapshot</p>
      </div>

      {/* Stats grid with icons */}
      <div className="prismo-stats">
        <div className="prismo-stat">
          <div className="prismo-stat-icon" style={{ background: "rgba(129,140,248,0.15)", color: "var(--accent)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
          </div>
          <div className="prismo-stat-val">{tasks.completion_rate}%</div>
          <div className="prismo-stat-label">Completed</div>
        </div>
        <div className="prismo-stat">
          <div className="prismo-stat-icon" style={{ background: "rgba(251,191,36,0.15)", color: "var(--warning)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
          </div>
          <div className="prismo-stat-val">{tasks.total_tasks}</div>
          <div className="prismo-stat-label">Total tasks</div>
        </div>
        <div className="prismo-stat">
          <div className="prismo-stat-icon" style={{ background: "rgba(52,211,153,0.15)", color: "var(--success)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2"/></svg>
          </div>
          <div className="prismo-stat-val">{focus.total_hours}h</div>
          <div className="prismo-stat-label">Focus time</div>
        </div>
        <div className="prismo-stat">
          <div className="prismo-stat-icon" style={{ background: tasks.overdue > 0 ? "rgba(248,113,113,0.15)" : "rgba(129,140,248,0.08)", color: tasks.overdue > 0 ? "var(--danger)" : "var(--text-muted)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div className="prismo-stat-val" style={{ color: tasks.overdue > 0 ? "var(--danger)" : undefined }}>{tasks.overdue}</div>
          <div className="prismo-stat-label">Overdue</div>
        </div>
      </div>

      {/* Ada coach */}
      {insights && (
        <div className="prismo-card prismo-bento-wide" style={{ marginBottom: 20, background: "linear-gradient(135deg, rgba(129,140,248,0.06), rgba(167,139,250,0.03))", borderColor: "rgba(129,140,248,0.12)" }}>
          <div className="ai-coach-header">
            <div className="ai-coach-avatar">A</div>
            <div>
              <div className="ai-coach-name">Ada</div>
              <div className="ai-coach-role">Your study coach</div>
            </div>
          </div>
          <div className="ai-text" style={{ marginBottom: insights.next_task || insights.study_blocks?.length ? 12 : 0 }}>{insights.tip}</div>
          {insights.next_task && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(129,140,248,0.06)", border: "1px solid rgba(129,140,248,0.1)", fontSize: 14, color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text)" }}>Next up:</strong> {insights.next_task.task.title} — <span style={{ color: "var(--accent)" }}>{insights.next_task.reason}</span>
            </div>
          )}
          {insights.study_blocks?.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              {insights.study_blocks.slice(0, 3).map((b, i) => (
                <div key={i} style={{ flex: 1, minWidth: 160, padding: "10px 12px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)", fontSize: 13 }}>
                  <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 14 }}>{b.start_time}–{b.end_time}</div>
                  <div style={{ color: "var(--text-secondary)", marginTop: 2 }}>{b.task_title}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 2 }}>{b.reason}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bento grid */}
      <div className="prismo-bento">
        {/* Today's schedule */}
        <div className="prismo-card">
          <div className="prismo-card-title">
            Today's Schedule
            <span className="prismo-card-sub">{plan ? `${plan.summary.total_classes} classes` : ""}</span>
          </div>
          {plan && plan.classes.length > 0 ? plan.classes.slice(0, 4).map(c => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: c.color || "var(--accent)", flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 14 }}>{c.title}</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.start_time}</span>
            </div>
          )) : <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "12px 0" }}>No classes today</div>}
        </div>

        {/* Task status breakdown */}
        <div className="prismo-card">
          <div className="prismo-card-title">Task Status</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ padding: 14, borderRadius: 10, background: "rgba(129,140,248,0.06)", textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text)" }}>{tasks.pending_tasks}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Pending</div>
            </div>
            <div style={{ padding: 14, borderRadius: 10, background: "rgba(129,140,248,0.06)", textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "var(--accent)" }}>{tasks.in_progress_tasks}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Active</div>
            </div>
            <div style={{ padding: 14, borderRadius: 10, background: "rgba(52,211,153,0.06)", textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "var(--success)" }}>{tasks.completed_tasks}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Done</div>
            </div>
            <div style={{ padding: 14, borderRadius: 10, background: "rgba(251,191,36,0.06)", textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{subtasks.total_subtasks}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Subtasks</div>
            </div>
          </div>
        </div>

        {/* Priority tasks */}
        <div className="prismo-card">
          <div className="prismo-card-title">
            Priority Tasks
            <span className="prismo-card-sub">{plan?.summary.total_tasks || 0} active</span>
          </div>
          {plan && plan.tasks.length > 0 ? plan.tasks.slice(0, 4).map(t => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <span className={`badge badge-${t.priority}`}>{t.priority}</span>
              <span style={{ flex: 1, fontSize: 14 }}>{t.title}</span>
              <span className={`badge badge-${t.status}`}>{t.status.replace("_"," ")}</span>
            </div>
          )) : <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "12px 0" }}>No priority tasks</div>}
        </div>

        {/* Recent focus */}
        <div className="prismo-card">
          <div className="prismo-card-title">
            Focus Sessions
            <span className="prismo-card-sub">{focus.today?.minutes_today || 0}m today</span>
          </div>
          {recentFocus.length > 0 ? recentFocus.slice(0, 4).map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <span className={`badge badge-${s.status}`}>{s.status}</span>
              <span style={{ flex: 1, fontSize: 14 }}>{s.task_title || "Free focus"}</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.duration_minutes}m</span>
            </div>
          )) : <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "12px 0" }}>No sessions yet</div>}
        </div>
      </div>
    </div>
  );
}
