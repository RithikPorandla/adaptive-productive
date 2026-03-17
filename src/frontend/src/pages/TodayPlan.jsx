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

  return (
    <>
      <div className="page-topbar">
        <div className="page-topbar-left">
          <span className="page-topbar-title">{DAYS[plan.day_of_week]}, {plan.date}</span>
          <span className="page-topbar-sub">{plan.summary.total_classes} classes · {plan.summary.total_tasks} tasks</span>
        </div>
      </div>
      <div className="page-content">
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
