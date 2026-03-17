import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import { useState, useEffect, createContext, useContext } from "react";
import { api } from "./api";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Schedule from "./pages/Schedule";
import TodayPlan from "./pages/TodayPlan";
import FocusTimer from "./pages/FocusTimer";

export const UserContext = createContext(null);
export function useUser() { return useContext(UserContext); }

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ tasks: 0, today: 0 });

  useEffect(() => {
    (async () => {
      try {
        const users = await api.getUsers();
        const u = users.length > 0
          ? users[0]
          : await api.createUser({ email: "student@university.edu", name: "Student" });
        setUser(u);
        const tasks = await api.getTasks({ user_id: u.id, parent_task_id: "null" });
        const active = tasks.filter(t => t.status !== "completed" && t.status !== "cancelled");
        setCounts({ tasks: active.length, today: active.length });
      } catch (err) {
        console.error("Failed to init:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="loading-screen">Loading...</div>;

  return (
    <UserContext.Provider value={user}>
      <div className="app">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            <h1>Adaptive</h1>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-label">Main</div>
            <nav>
              <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""}>
                <span className="nav-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                </span>
                Overview
              </NavLink>
              <NavLink to="/today" className={({ isActive }) => isActive ? "active" : ""}>
                <span className="nav-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </span>
                Today
                {counts.today > 0 && <span className="nav-count">{counts.today}</span>}
              </NavLink>
              <NavLink to="/tasks" className={({ isActive }) => isActive ? "active" : ""}>
                <span className="nav-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                </span>
                Tasks
                {counts.tasks > 0 && <span className="nav-count">{counts.tasks}</span>}
              </NavLink>
            </nav>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-label">Tools</div>
            <nav>
              <NavLink to="/schedule" className={({ isActive }) => isActive ? "active" : ""}>
                <span className="nav-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </span>
                Schedule
              </NavLink>
              <NavLink to="/focus" className={({ isActive }) => isActive ? "active" : ""}>
                <span className="nav-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2"/></svg>
                </span>
                Focus Timer
              </NavLink>
            </nav>
          </div>

          <div className="sidebar-footer">{user?.name || "Student"}</div>
        </aside>

        <main className="main">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/today" element={<TodayPlan />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/focus" element={<FocusTimer />} />
          </Routes>
        </main>
      </div>
    </UserContext.Provider>
  );
}
