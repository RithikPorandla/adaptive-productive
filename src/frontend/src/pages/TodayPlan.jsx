import { useState, useEffect } from "react";
import { api } from "../api";
import { useUser } from "../App";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TodayPlan() {
  const user = useUser();
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    if (user) api.getTodayPlan(user.id).then(setPlan).catch(console.error);
  }, [user]);

  if (!plan) return <div className="empty">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Today</h1>
        <p className="page-subtitle">
          {DAYS[plan.day_of_week]}, {plan.date} — {plan.summary.total_classes} class{plan.summary.total_classes !== 1 ? "es" : ""}, {plan.summary.total_tasks} task{plan.summary.total_tasks !== 1 ? "s" : ""}
          {plan.summary.due_today > 0 ? `, ${plan.summary.due_today} due today` : ""}
        </p>
      </div>

      {plan.classes.length > 0 && (
        <div className="plan-section">
          <div className="plan-section-title">Lectures</div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {plan.classes.map((c) => (
              <div key={c.id} className="schedule-item">
                <div className="color-dot" style={{ background: c.color || "var(--gold)", color: c.color || "var(--gold)" }} />
                <div className="schedule-time">{c.start_time} – {c.end_time}</div>
                <div className="schedule-info">
                  <div className="schedule-title">{c.title}</div>
                  {c.location && <div className="schedule-location">{c.location}</div>}
                </div>
                <span className="badge badge-class">Class</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {plan.tasks.length > 0 && (
        <div className="plan-section">
          <div className="plan-section-title">Quests</div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {plan.tasks.map((t) => (
              <div key={t.id} className="task-item">
                <div className="task-info">
                  <div className="task-title">{t.title}</div>
                  <div className="task-meta">
                    <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                    <span className={`badge badge-${t.status}`}>{t.status.replace("_", " ")}</span>
                    {t.due_date && <span>Due {t.due_date}</span>}
                    {t.estimated_minutes && <span>{t.estimated_minutes}m</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {plan.classes.length === 0 && plan.tasks.length === 0 && (
        <div className="card empty">
          <div className="empty-icon">---</div>
          <p>A day of rest. No classes or tasks today.</p>
        </div>
      )}
    </div>
  );
}
