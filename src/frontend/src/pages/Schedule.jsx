import { useState, useEffect } from "react";
import { api } from "../api";
import { useUser } from "../App";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Schedule() {
  const user = useUser();
  const [schedules, setSchedules] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", day_of_week: "1", start_time: "09:00", end_time: "10:00", location: "", color: "#ffffff" });

  const load = () => {
    if (user) api.getSchedules({ user_id: user.id }).then(setSchedules).catch(console.error);
  };

  useEffect(load, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.createSchedule({ user_id: user.id, ...form, day_of_week: Number(form.day_of_week) });
    setForm({ title: "", day_of_week: "1", start_time: "09:00", end_time: "10:00", location: "", color: "#ffffff" });
    setShowForm(false);
    load();
  };

  const handleDelete = async (id) => {
    await api.deleteSchedule(id);
    load();
  };

  const grouped = {};
  for (const s of schedules) {
    if (!grouped[s.day_of_week]) grouped[s.day_of_week] = [];
    grouped[s.day_of_week].push(s);
  }

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="page-header">
          <h1 className="page-title">Schedule</h1>
          <p className="page-subtitle">Weekly classes</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} style={{ marginTop: 8 }}>
          {showForm ? "Cancel" : "Add class"}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Class name</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="CS 301 - AI Fundamentals" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Day</label>
                <select value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}>
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Start</label>
                <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>End</label>
                <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Location</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Room 204" />
              </div>
              <div className="form-group" style={{ maxWidth: 80 }}>
                <label>Color</label>
                <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ padding: 4, height: 42 }} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Add</button>
          </form>
        </div>
      )}

      {schedules.length === 0 ? (
        <div className="empty">No classes yet</div>
      ) : (
        DAYS.map((dayName, dayIndex) =>
          grouped[dayIndex] ? (
            <div key={dayIndex} className="card" style={{ marginBottom: 12, padding: 0, overflow: "hidden" }}>
              <div className="card-header" style={{ padding: "12px 20px", margin: 0, borderRadius: 0 }}>
                <span className="card-title">{dayName}</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{grouped[dayIndex].length}</span>
              </div>
              {grouped[dayIndex].map((s) => (
                <div key={s.id} className="schedule-item">
                  <div className="color-dot" style={{ background: s.color || "#fff" }} />
                  <div className="schedule-time">{s.start_time} – {s.end_time}</div>
                  <div className="schedule-info">
                    <div className="schedule-title">{s.title}</div>
                    {s.location && <div className="schedule-location">{s.location}</div>}
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>Remove</button>
                </div>
              ))}
            </div>
          ) : null
        )
      )}
    </div>
  );
}
