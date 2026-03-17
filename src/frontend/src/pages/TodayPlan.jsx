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

  if (!plan) return <div className="loading-screen">Loading...</div>;

  const isEmpty = plan.classes.length === 0 && plan.tasks.length === 0;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Today</h1>
        <p className="page-subtitle">
          {DAYS[plan.day_of_week]} · {plan.summary.total_classes} class{plan.summary.total_classes !== 1 ? "es" : ""} · {plan.summary.total_tasks} task{plan.summary.total_tasks !== 1 ? "s" : ""}
        </p>
      </div>

      {plan.classes.length > 0 && (
        <div className="plan-section">
          <div className="plan-section-title">Classes</div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {plan.classes.map((c) => (
              <div key={c.id} className="schedule-item">
                <div className="color-dot" style={{ background: c.color || "#fff" }} />
                <div className="schedule-time">{c.start_time} – {c.end_time}</div>
                <div className="schedule-info">
                  <div className="schedule-title">{c.title}</div>
                  {c.location && <div className="schedule-location">{c.location}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {plan.tasks.length > 0 && (
        <div className="plan-section">
          <div className="plan-section-title">Tasks</div>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {plan.tasks.map((t) => (
              <div key={t.id} className="task-item">
                <div className="task-info">
                  <div className="task-title">{t.title}</div>
                  <div className="task-meta">
                    <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                    <span className={`badge badge-${t.status}`}>{t.status.replace("_", " ")}</span>
                    {t.due_date && <span>{t.due_date}</span>}
                    {t.estimated_minutes && <span>{t.estimated_minutes}m</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isEmpty && (
        <div className="empty">Nothing planned for today</div>
      )}
    </div>
  );
}
