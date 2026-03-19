const CLAUDE_API = "https://api.anthropic.com/v1/messages";

// Build Ada's context from user behavior profile
function buildAdaContext(user, tasks, behaviorLog) {
  const overdueTasks = tasks.filter(t => t.daysUntil <= 0);
  const urgentTasks = tasks.filter(t => t.daysUntil <= 3 && t.status !== "completed");
  const upcomingExams = tasks.filter(t => t.type === "exam" && t.daysUntil <= 21);

  const recentSkips = behaviorLog.filter(l => l.action === "skipped").map(l => l.course);
  const avgOverrun = behaviorLog
    .filter(l => l.action === "completed" && l.minutesTaken && l.scheduled)
    .map(l => ((l.minutesTaken - l.scheduled) / l.scheduled) * 100);
  const overrunPct = avgOverrun.length
    ? Math.round(avgOverrun.reduce((a, b) => a + b, 0) / avgOverrun.length)
    : 0;

  return {
    studentName: user.name,
    major: user.major,
    behaviorInsights: {
      peakProductivityTime: user.behaviorProfile.peakHours,
      completionRate: `${Math.round(user.behaviorProfile.completionRate * 100)}%`,
      procrastinationLevel: user.behaviorProfile.procrastinationIndex > 0.6 ? "high" : "moderate",
      recentlySkippedSubjects: recentSkips,
      taskTimeOverrunAverage: `${overrunPct > 0 ? "+" : ""}${overrunPct}%`,
      strongSubjects: user.behaviorProfile.strongSubjects,
      weakSubjects: user.behaviorProfile.weakSubjects,
    },
    currentWorkload: {
      totalPendingTasks: tasks.filter(t => t.status !== "completed").length,
      urgentTasksDue3Days: urgentTasks.map(t => `${t.course}: ${t.title} (${t.daysUntil}d)`),
      upcomingExams: upcomingExams.map(t => `${t.course} exam in ${t.daysUntil} days`),
      overdueTasks: overdueTasks.map(t => t.title),
    }
  };
}

export async function getAdaBriefing(user, tasks, behaviorLog, apiKey) {
  const context = buildAdaContext(user, tasks, behaviorLog);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const prompt = `You are Ada, an AI academic co-pilot embedded in a student productivity app called Adaptive. You have deep knowledge of this specific student's behavior patterns, learning style, and current workload.

Today is ${today}.

Student Context (learned from behavior tracking):
${JSON.stringify(context, null, 2)}

Generate Ada's morning briefing. This should feel like a brilliant, direct advisor who knows the student deeply — not a generic assistant. Be specific, reference their actual data, and give one sharp actionable directive.

Respond ONLY with valid JSON in this exact shape:
{
  "headline": "one punchy sentence (max 12 words) that captures the most important thing today",
  "insight": "2-3 sentences. Reference specific subjects, specific deadlines, specific behavior patterns you've observed. Sound like you know them.",
  "directive": "one clear action sentence — what should they do in the next 2 hours",
  "riskAlert": "one sentence about the biggest risk this week if they don't act, or null if no major risk",
  "adaptationNote": "one short sentence about a pattern Ada has noticed (e.g. timing, subject difficulty, procrastination), or null",
  "mood": "focused|warning|critical|calm"
}`;

  const res = await fetch(CLAUDE_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await res.json();
  const text = data.content?.[0]?.text || "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export async function parseSyllabus(pdfBase64, courseCode, apiKey) {
  const prompt = `You are parsing a university course syllabus to extract structured data for a student productivity app.

Extract ALL deadlines, assignments, exams, quizzes, and key dates from this syllabus.

Respond ONLY with valid JSON:
{
  "courseName": "full course name",
  "courseCode": "${courseCode}",
  "instructor": "professor name or null",
  "tasks": [
    {
      "title": "assignment/exam name",
      "type": "assignment|exam|quiz|project|lab|reading",
      "dueDate": "YYYY-MM-DD",
      "estimatedHours": number,
      "weight": "percentage of grade or null",
      "description": "brief description or null"
    }
  ],
  "weeklyTopics": [
    { "week": 1, "topic": "topic name" }
  ],
  "gradingBreakdown": {}
}`;

  const res = await fetch(CLAUDE_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: pdfBase64 }
          },
          { type: "text", text: prompt }
        ]
      }]
    })
  });

  const data = await res.json();
  const text = data.content?.[0]?.text || "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}
