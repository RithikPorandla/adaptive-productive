import { useState, useEffect } from "react";
import { api } from "../api";
import { useUser } from "../App";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const user = useUser();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (user) api.getDashboard(user.id).then(setData).catch(console.error);
  }, [user]);

  if (!data) return <div className="loading-screen">Loading...</div>;

  const { tasks, subtasks, focus } = data;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="greeting">{getGreeting()}</div>
        <h1 className="page-title">Overview</h1>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-value">{tasks.completion_rate}%</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{tasks.total_tasks}</div>
          <div className="stat-label">Tasks</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{focus.total_hours}h</div>
          <div className="stat-label">Focused</div>
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
          <div className="stat-value">{tasks.completed_tasks}</div>
          <div className="stat-label">Done</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value">{tasks.in_progress_tasks}</div>
          <div className="stat-label">Active</div>
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
    </div>
  );
}
