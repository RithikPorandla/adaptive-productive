import { useState, useEffect } from "react";
import { api } from "../api";
import { useUser } from "../App";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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

  return (
    <>
      <div className="page-topbar">
        <div className="page-topbar-left">
          <span className="page-topbar-title">{DAYS[plan.day_of_week]}, {plan.date}</span>
          <span className="page-topbar-sub">{plan.summary.total_classes} classes · {plan.summary.total_tasks} tasks</span>
        </div>
      </div>
      <div className="page-content">
        {tip && (
          <div className="card ai-card card-padded" style={{ marginBottom: 20 }}>
            <div className="ai-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a5 5 0 015 5c0 2-1 3-2 4l-1 1v2h-4v-2l-1-1c-1-1-2-2-2-4a5 5 0 015-5z"/><path d="M10 18h4"/><path d="M10 22h4"/></svg>
              Today's tip
            </div>
            <div className="ai-text">{tip}</div>
          </div>
        )}

        {plan.classes.length > 0 && (
          <>
            <div className="section-label">Classes</div>
            <div className="card" style={{ marginBottom: 20 }}>
              {plan.classes.map(c => (
                <div key={c.id} className="schedule-item">
                  <div className="color-dot" style={{ background: c.color || "var(--accent)" }} />
                  <div className="schedule-time">{c.start_time} – {c.end_time}</div>
                  <div className="schedule-info">
                    <div className="schedule-title">{c.title}</div>
                    {c.location && <div className="schedule-location">{c.location}</div>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {plan.tasks.length > 0 && (
          <>
            <div className="section-label">Tasks</div>
            <div className="card">
              {plan.tasks.map(t => (
                <div key={t.id} className="task-item">
                  <div className="task-info">
                    <div className="task-title">{t.title}</div>
                    <div className="task-meta">
                      <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                      <span className={`badge badge-${t.status}`}>{t.status.replace("_"," ")}</span>
                      {t.due_date && <span>{t.due_date}</span>}
                      {t.estimated_minutes && <span>{t.estimated_minutes}m</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {plan.classes.length === 0 && plan.tasks.length === 0 && (
          <div className="empty">Nothing planned for today</div>
        )}
      </div>
    </>
  );
}
