// Mock user profile — in prod this comes from DB + behavior tracking
export const mockUser = {
  name: "Rithik",
  major: "Computer Science",
  university: "State University",
  semester: "Spring 2025",
  behaviorProfile: {
    peakHours: "evening",           // learned from completion timestamps
    avgSessionLength: 47,           // minutes
    strongSubjects: ["CS 401", "Data Structures"],
    weakSubjects: ["PHYS 201", "MATH 302"],
    completionRate: 0.68,
    procrastinationIndex: 0.72,     // 0=never, 1=always last minute
    streakDays: 3,
    totalFocusHours: 12.4,
  }
};

export const mockCourses = [
  { id: 1, code: "CS 401", name: "Machine Learning", color: "#818cf8", credits: 3 },
  { id: 2, code: "MATH 302", name: "Linear Algebra", color: "#38bdf8", credits: 3 },
  { id: 3, code: "PHYS 201", name: "Physics II Lab", color: "#fb7185", credits: 2 },
  { id: 4, code: "ENG 210", name: "Technical Writing", color: "#34d399", credits: 3 },
];

export const mockTasks = [
  {
    id: 1, courseId: 1, course: "CS 401",
    title: "Midterm Exam", type: "exam",
    dueDate: "2025-04-02", daysUntil: 14,
    priority: "critical", status: "pending",
    estimatedHours: 8, color: "#818cf8",
    adaNote: "You're solid on neural nets but shaky on SVM — focus there first."
  },
  {
    id: 2, courseId: 2, course: "MATH 302",
    title: "Problem Set 5", type: "assignment",
    dueDate: "2025-03-22", daysUntil: 3,
    priority: "high", status: "pending",
    estimatedHours: 3, color: "#38bdf8",
    adaNote: "You usually underestimate Math by 40%. I've buffered an extra hour."
  },
  {
    id: 3, courseId: 3, course: "PHYS 201",
    title: "Lab Report 3", type: "report",
    dueDate: "2025-03-24", daysUntil: 5,
    priority: "high", status: "in-progress",
    estimatedHours: 4, color: "#fb7185",
    adaNote: "Physics is your toughest subject. Start today, not tomorrow."
  },
  {
    id: 4, courseId: 4, course: "ENG 210",
    title: "Technical Memo Draft", type: "writing",
    dueDate: "2025-03-28", daysUntil: 9,
    priority: "medium", status: "pending",
    estimatedHours: 2, color: "#34d399",
    adaNote: "You're strong at writing. This should be quick — schedule 2h max."
  },
  {
    id: 5, courseId: 1, course: "CS 401",
    title: "Project Proposal", type: "project",
    dueDate: "2025-03-26", daysUntil: 7,
    priority: "high", status: "pending",
    estimatedHours: 5, color: "#818cf8",
    adaNote: null
  },
  {
    id: 6, courseId: 2, course: "MATH 302",
    title: "Quiz 4 — Eigenvalues", type: "quiz",
    dueDate: "2025-03-21", daysUntil: 2,
    priority: "critical", status: "pending",
    estimatedHours: 1.5, color: "#38bdf8",
    adaNote: "Tomorrow. No more delays on this one."
  },
];

export const mockWeekSchedule = [
  { day: "Mon", date: "Mar 18", classes: [
    { code: "CS 401", time: "10:00", room: "Tech 204" },
    { code: "ENG 210", time: "14:00", room: "Hum 112" },
  ]},
  { day: "Tue", date: "Mar 19", classes: [
    { code: "MATH 302", time: "11:00", room: "Math 301" },
    { code: "PHYS 201", time: "13:00", room: "Sci 105" },
  ]},
  { day: "Wed", date: "Mar 20", classes: [
    { code: "CS 401", time: "10:00", room: "Tech 204" },
  ]},
  { day: "Thu", date: "Mar 21", classes: [
    { code: "MATH 302", time: "11:00", room: "Math 301" },
    { code: "PHYS 201", time: "13:00", room: "Sci 105" },
  ]},
  { day: "Fri", date: "Mar 22", classes: [
    { code: "ENG 210", time: "14:00", room: "Hum 112" },
  ]},
];

export const mockCrunchWeeks = [
  { week: "Apr 14–18", deadlines: 4, severity: "critical", label: "Finals Crunch" },
  { week: "Mar 24–28", deadlines: 3, severity: "high", label: "Mid-sprint" },
];

// Behavior log — grows over time, drives Ada's adaptation
export const mockBehaviorLog = [
  { taskId: 2, action: "completed", timestamp: "2025-03-15T22:40:00", minutesTaken: 210, scheduled: 180 },
  { taskId: null, action: "focus_session", timestamp: "2025-03-16T20:15:00", minutes: 52, course: "CS 401" },
  { taskId: null, action: "skipped", timestamp: "2025-03-17T10:00:00", course: "PHYS 201" },
  { taskId: null, action: "focus_session", timestamp: "2025-03-17T21:30:00", minutes: 38, course: "MATH 302" },
];
