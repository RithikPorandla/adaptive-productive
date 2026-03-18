const BASE = "/api";

async function request(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export const api = {
  // Users
  createUser: (body) => request("/users", { method: "POST", body: JSON.stringify(body) }),
  getUsers: () => request("/users"),
  getUser: (id) => request(`/users/${id}`),

  // Tasks
  createTask: (body) => request("/tasks", { method: "POST", body: JSON.stringify(body) }),
  getTasks: (params) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/tasks?${qs}`);
  },
  getTask: (id) => request(`/tasks/${id}`),
  updateTask: (id, body) => request(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: "DELETE" }),

  // Schedules
  createSchedule: (body) => request("/schedules", { method: "POST", body: JSON.stringify(body) }),
  getSchedules: (params) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/schedules?${qs}`);
  },
  updateSchedule: (id, body) => request(`/schedules/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteSchedule: (id) => request(`/schedules/${id}`, { method: "DELETE" }),

  // Plan
  getTodayPlan: (userId) => request(`/plan/today?user_id=${userId}`),

  // AI
  decompose: (taskId) => request(`/ai/tasks/${taskId}/decompose`, { method: "POST" }),
  parseTask: (input) => request("/ai/parse-task", { method: "POST", body: JSON.stringify({ input }) }),
  getInsights: (userId) => request(`/ai/insights?user_id=${userId}`),
  importSyllabus: (userId, text) => request("/ai/syllabus", { method: "POST", body: JSON.stringify({ user_id: userId, text }) }),

  // Focus
  startFocus: (body) => request("/focus", { method: "POST", body: JSON.stringify(body) }),
  getFocusSessions: (userId) => request(`/focus?user_id=${userId}`),
  completeFocus: (id) => request(`/focus/${id}/complete`, { method: "PUT" }),
  cancelFocus: (id) => request(`/focus/${id}/cancel`, { method: "PUT" }),
  getFocusProfile: (userId) => request(`/focus/profile?user_id=${userId}`),

  // Import
  importICS: (userId, icsText) => request("/import/ics", { method: "POST", body: JSON.stringify({ user_id: userId, ics_text: icsText }) }),

  // Dashboard
  getDashboard: (userId) => request(`/dashboard?user_id=${userId}`),
};
