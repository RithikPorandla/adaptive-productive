import { useState, useEffect } from "react";
import { api } from "../api";
import { useUser } from "../App";

export default function Dashboard() {
  const user = useUser();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (user) api.getDashboard(user.id).then(setData).catch(console.error);
  }, [user]);

  if (!data) return <div className="empty">Loading...</div>;

  const { tasks, subtasks, focus } = data;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Overview</h1>
        <p className="page-subtitle">Your empire of productivity, at a glance</p>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-value">{tasks.completion_rate}%</div>
          <div className="stat-label">Completion</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{tasks.total_tasks}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{tasks.completed_tasks}</div>
          <div className="stat-label">Conquered</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: tasks.overdue > 0 ? "var(--danger)" : undefined }}>
            {tasks.overdue}
          </div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-value">{focus.total_hours}h</div>
          <div className="stat-label">Focus Time</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{focus.total_sessions}</div>
          <div className="stat-label">Sessions</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{focus.today?.minutes_today || 0}m</div>
          <div className="stat-label">Today</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{subtasks.total_subtasks}</div>
          <div className="stat-label">Subtasks</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Status Breakdown</span>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="badge badge-pending">Pending</span>
            <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{tasks.pending_tasks}</span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="badge badge-in_progress">Active</span>
            <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{tasks.in_progress_tasks}</span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="badge badge-completed">Done</span>
            <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{tasks.completed_tasks}</span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="badge badge-cancelled">Cancelled</span>
            <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{tasks.cancelled_tasks}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
