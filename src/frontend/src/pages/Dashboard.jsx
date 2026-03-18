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
    <>
      <div className="page-topbar">
        <div className="page-topbar-left">
          <span className="page-topbar-title">{greeting()}</span>
          <span className="page-topbar-sub">Here's what's happening today</span>
        </div>
      </div>
      <div className="page-content">
        {/* Stats row */}
        <div className="dash-stats-row">
          <div className="dash-stat">
            <div className="dash-stat-value">{tasks.completion_rate}%</div>
            <div className="dash-stat-label">Completion rate</div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${tasks.completion_rate}%` }} /></div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-value">{tasks.total_tasks}</div>
            <div className="dash-stat-label">Total tasks</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-value">{tasks.completed_tasks}</div>
            <div className="dash-stat-label">Completed</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-value" style={{ color: tasks.overdue > 0 ? "var(--danger)" : undefined }}>{tasks.overdue}</div>
            <div className={`dash-stat-label${tasks.overdue > 0 ? " danger" : ""}`}>Overdue</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-value">{focus.total_hours}h</div>
            <div className="dash-stat-label">Focus time</div>
          </div>
        </div>

        {/* Ada - AI Study Coach */}
        {insights && (
          <div className="card ai-card card-padded" style={{ marginBottom: 16 }}>
            <div className="ai-coach-header">
              <div className="ai-coach-avatar">A</div>
              <div>
                <div className="ai-coach-name">Ada</div>
                <div className="ai-coach-role">Your study coach</div>
              </div>
            </div>
            <div className="ai-text">{insights.tip}</div>
            {insights.next_task && (
              <div className="ai-suggestion">
                <strong>Next up:</strong> {insights.next_task.task.title} — {insights.next_task.reason}
              </div>
            )}
            {insights.study_blocks && insights.study_blocks.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Suggested study blocks</div>
                {insights.study_blocks.slice(0, 3).map((b, i) => (
                  <div key={i} style={{ fontSize: 13, color: "var(--text-secondary)", padding: "4px 0" }}>
                    {b.start_time}–{b.end_time} · {b.task_title} <span style={{ color: "var(--text-muted)" }}>({b.reason})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Two-column layout */}
        <div className="dash-grid">
          {/* Left: Today's plan */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Today</span>
              <span className="card-subtitle">{plan ? `${plan.summary.total_classes} classes · ${plan.summary.total_tasks} tasks` : ""}</span>
            </div>
            {plan && plan.classes.length > 0 && plan.classes.map(c => (
              <div key={c.id} className="list-item">
                <div className="color-dot" style={{ background: c.color || "var(--accent)" }} />
                <span>{c.title}</span>
                <span className="list-item-secondary" style={{ marginLeft: "auto" }}>{c.start_time}–{c.end_time}</span>
              </div>
            ))}
            {plan && plan.tasks.length > 0 && plan.tasks.slice(0, 5).map(t => (
              <div key={t.id} className="list-item">
                <span className={`badge badge-${t.priority}`} style={{ fontSize: 10 }}>{t.priority}</span>
                <span style={{ flex: 1 }}>{t.title}</span>
                <span className={`badge badge-${t.status}`} style={{ fontSize: 10 }}>{t.status.replace("_"," ")}</span>
              </div>
            ))}
            {plan && plan.classes.length === 0 && plan.tasks.length === 0 && (
              <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>Nothing planned</div>
            )}
          </div>

          {/* Right: Activity / stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Task breakdown */}
            <div className="card card-padded">
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Task status</div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <span style={{ fontSize: 20, fontWeight: 600, color: "var(--text)" }}>{tasks.pending_tasks}</span>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Pending</div>
                </div>
                <div>
                  <span style={{ fontSize: 20, fontWeight: 600, color: "var(--accent)" }}>{tasks.in_progress_tasks}</span>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Active</div>
                </div>
                <div>
                  <span style={{ fontSize: 20, fontWeight: 600, color: "var(--success)" }}>{tasks.completed_tasks}</span>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Done</div>
                </div>
                <div>
                  <span style={{ fontSize: 20, fontWeight: 600 }}>{subtasks.total_subtasks}</span>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Subtasks</div>
                </div>
              </div>
            </div>

            {/* Recent focus */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Recent focus</span>
                <span className="card-subtitle">{focus.today?.minutes_today || 0}m today</span>
              </div>
              {recentFocus.length > 0 ? recentFocus.map(s => (
                <div key={s.id} className="list-item">
                  <span className={`badge badge-${s.status}`} style={{ fontSize: 10 }}>{s.status}</span>
                  <span style={{ flex: 1 }}>{s.task_title || "Free focus"}</span>
                  <span className="list-item-secondary">{s.duration_minutes}m</span>
                </div>
              )) : (
                <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>No sessions yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
