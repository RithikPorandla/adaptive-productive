import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import { useState, useEffect, createContext, useContext } from "react";
import { api } from "./api";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Schedule from "./pages/Schedule";
import TodayPlan from "./pages/TodayPlan";
import FocusTimer from "./pages/FocusTimer";

export const UserContext = createContext(null);

export function useUser() {
  return useContext(UserContext);
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const users = await api.getUsers();
        if (users.length > 0) {
          setUser(users[0]);
        } else {
          const newUser = await api.createUser({
            email: "student@university.edu",
            name: "Student",
          });
          setUser(newUser);
        }
      } catch (err) {
        console.error("Failed to init user:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        Loading...
      </div>
    );
  }

  return (
    <UserContext.Provider value={user}>
      <div className="app">
        <aside className="sidebar">
          <h1>Adaptive Productive</h1>
          <nav>
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""}>
              <span className="icon">📊</span> Dashboard
            </NavLink>
            <NavLink to="/today" className={({ isActive }) => isActive ? "active" : ""}>
              <span className="icon">📋</span> Today's Plan
            </NavLink>
            <NavLink to="/tasks" className={({ isActive }) => isActive ? "active" : ""}>
              <span className="icon">✅</span> Tasks
            </NavLink>
            <NavLink to="/schedule" className={({ isActive }) => isActive ? "active" : ""}>
              <span className="icon">📅</span> Schedule
            </NavLink>
            <NavLink to="/focus" className={({ isActive }) => isActive ? "active" : ""}>
              <span className="icon">⏱️</span> Focus Timer
            </NavLink>
          </nav>
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
