import { useState, useEffect } from "react";
import { api } from "../api";
import { useUser } from "../App";

export default function Dashboard() {
  const user = useUser();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (user) api.getDashboard(user.id).then(setData).catch(console.error);
  }, [user]);

  if (!data) return <div className="empty">Loading dashboard...</div>;

  const { tasks, subtasks, focus } = data;

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">Your productivity at a glance</p>

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-value">{tasks.completion_rate}%</div>
          <div className="stat-label">Completion Rate</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{tasks.total_tasks}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{tasks.completed_tasks}</div>
          <div className="stat-label">Completed</div>
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
          <div className="stat-label">Total Focus Time</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{focus.total_sessions}</div>
          <div className="stat-label">Focus Sessions</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{focus.today?.minutes_today || 0}m</div>
          <div className="stat-label">Focus Today</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{subtasks.total_subtasks}</div>
          <div className="stat-label">Subtasks</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Task Breakdown</span>
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <span><span className="badge badge-pending">Pending</span> {tasks.pending_tasks}</span>
          <span><span className="badge badge-in_progress">In Progress</span> {tasks.in_progress_tasks}</span>
          <span><span className="badge badge-completed">Completed</span> {tasks.completed_tasks}</span>
          <span><span className="badge badge-cancelled">Cancelled</span> {tasks.cancelled_tasks}</span>
        </div>
      </div>
    </div>
  );
}
