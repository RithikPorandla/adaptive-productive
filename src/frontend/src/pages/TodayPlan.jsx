import { useState, useEffect } from "react";
import { api } from "../api";
import { useUser } from "../App";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function friendlyDate() {
  const d = new Date();
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export default function TodayPlan() {
  const user = useUser();
  const [plan, setPlan] = useState(null);
  const [tip, setTip] = useState(null);

  useEffect(() => {
    if (user) {
      api.getTodayPlan(user.id).then(setPlan).catch(console.error);
      api.getInsights(user.id).then(d => setTip(d.tip)).catch(console.error);
    }
  }, [user]);

  if (!plan) return <div className="loading-screen">Loading...</div>;

  const urgentTasks = plan.tasks.filter(t => t.priority === "high");
  const otherTasks = plan.tasks.filter(t => t.priority !== "high");

  return (
    <>
      <div className="page-topbar">
        <div className="page-topbar-left">
          <span className="page-topbar-title">{friendlyDate()}</span>
        </div>
      </div>
      <div className="page-content">
        {/* Hero stats */}
        <div className="today-hero">
          <div className="today-hero-stat">
            <div className="today-hero-val">{plan.summary.total_classes}</div>
            <div className="today-hero-label">Classes today</div>
          </div>
          <div className="today-hero-stat">
            <div className="today-hero-val">{plan.summary.total_tasks}</div>
            <div className="today-hero-label">Tasks to work on</div>
          </div>
          <div className="today-hero-stat">
            <div className="today-hero-val" style={{ color: plan.summary.due_today > 0 ? "var(--danger)" : undefined }}>
              {plan.summary.due_today}
            </div>
            <div className="today-hero-label">Due today</div>
          </div>
        </div>

        {/* Ada's tip */}
        {tip && (
          <div className="card ai-card card-padded" style={{ marginBottom: 20 }}>
            <div className="ai-coach-header">
              <div className="ai-coach-avatar">A</div>
              <div>
                <div className="ai-coach-name">Ada</div>
                <div className="ai-coach-role">Your study coach</div>
              </div>
            </div>
            <div className="ai-text">{tip}</div>
          </div>
        )}

        {/* Classes */}
        {plan.classes.length > 0 && (
          <div className="today-section">
            <div className="section-label">Classes</div>
            {plan.classes.map(c => (
              <div key={c.id} className="today-class-card" style={{ borderLeftColor: c.color || "var(--accent)" }}>
                <div className="schedule-time" style={{ minWidth: 90 }}>{c.start_time}–{c.end_time}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>{c.title}</div>
                  {c.location && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{c.location}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Urgent tasks */}
        {urgentTasks.length > 0 && (
          <div className="today-section">
            <div className="section-label" style={{ color: "var(--danger)" }}>Needs attention</div>
            {urgentTasks.map(t => (
              <div key={t.id} className="today-task-card" style={{ borderLeft: "3px solid var(--danger)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500 }}>{t.title}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                      <span className="badge badge-high">high</span>
                      <span className={`badge badge-${t.status}`}>{t.status.replace("_", " ")}</span>
                      {t.due_date && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.due_date}</span>}
                      {t.estimated_minutes && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.estimated_minutes}m</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Other tasks */}
        {otherTasks.length > 0 && (
          <div className="today-section">
            <div className="section-label">Also on your plate</div>
            <div className="task-card-grid">
              {otherTasks.map(t => (
                <div key={t.id} className="today-task-card">
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{t.title}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                    {t.due_date && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.due_date}</span>}
                    {t.estimated_minutes && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.estimated_minutes}m</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {plan.classes.length === 0 && plan.tasks.length === 0 && (
          <div className="empty">Nothing planned for today — enjoy your free time!</div>
        )}
      </div>
    </>
  );
}
