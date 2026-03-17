/**
 * AI service for task decomposition, smart parsing, and study tips.
 *
 * Uses OpenAI GPT-4 when OPENAI_API_KEY is set; otherwise falls back to
 * rule-based heuristics so all features work without an API key during dev.
 */

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

async function callLLM(apiKey, systemPrompt, userPrompt) {
  const resp = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 600,
    }),
  });
  if (!resp.ok) throw new Error(`OpenAI API error ${resp.status}`);
  const data = await resp.json();
  return data.choices[0].message.content.trim();
}

/**
 * Parse natural-language task input into structured fields.
 */
export async function parseTaskInput(input) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) return parseWithLLM(apiKey, input);
  return parseWithHeuristic(input);
}

async function parseWithLLM(apiKey, input) {
  const raw = await callLLM(
    apiKey,
    `You parse student task descriptions into structured data. Return ONLY a JSON object with: title (string), priority ("low"|"medium"|"high"), due_date (ISO date string or null), estimated_minutes (number or null). Infer priority from urgency cues. Infer due_date from relative dates like "tomorrow", "friday", "next week". Today is ${new Date().toISOString().slice(0, 10)}.`,
    input
  );
  const jsonStr = raw.replace(/```json\n?/g, "").replace(/```/g, "").trim();
  return JSON.parse(jsonStr);
}

function parseWithHeuristic(input) {
  const lower = input.toLowerCase();
  let priority = "medium";
  if (lower.includes("urgent") || lower.includes("asap") || lower.includes("important") || lower.includes("high priority")) priority = "high";
  else if (lower.includes("low priority") || lower.includes("whenever") || lower.includes("optional")) priority = "low";

  let due_date = null;
  const today = new Date();
  if (lower.includes("tomorrow")) {
    const d = new Date(today); d.setDate(d.getDate() + 1);
    due_date = d.toISOString().slice(0, 10);
  } else if (lower.includes("next week")) {
    const d = new Date(today); d.setDate(d.getDate() + 7);
    due_date = d.toISOString().slice(0, 10);
  } else if (lower.includes("tonight") || lower.includes("today")) {
    due_date = today.toISOString().slice(0, 10);
  } else {
    const dateMatch = input.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) due_date = dateMatch[1];
    const monthMatch = input.match(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{1,2})/i);
    if (monthMatch) {
      const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
      const mKey = input.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i)[0].toLowerCase().slice(0, 3);
      const d = new Date(today.getFullYear(), months[mKey], parseInt(monthMatch[1]));
      if (d < today) d.setFullYear(d.getFullYear() + 1);
      due_date = d.toISOString().slice(0, 10);
    }
  }

  let estimated_minutes = null;
  const hourMatch = lower.match(/(\d+)\s*(?:hour|hr)/);
  const minMatch = lower.match(/(\d+)\s*(?:min)/);
  if (hourMatch) estimated_minutes = parseInt(hourMatch[1]) * 60;
  if (minMatch) estimated_minutes = (estimated_minutes || 0) + parseInt(minMatch[1]);

  let title = input
    .replace(/\b(urgent|asap|important|high priority|low priority|optional|whenever)\b/gi, "")
    .replace(/\b(tomorrow|tonight|today|next week)\b/gi, "")
    .replace(/\b(?:about|around|approximately)?\s*\d+\s*(?:hours?|hrs?|min(?:ute)?s?)\b/gi, "")
    .replace(/\b(?:due|by|before)\b/gi, "")
    .replace(/\d{4}-\d{2}-\d{2}/g, "")
    .replace(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2}/gi, "")
    .replace(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, "")
    .replace(/,/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!title) title = input.trim();

  return { title, priority, due_date, estimated_minutes };
}

/**
 * Generate a contextual study tip based on today's workload.
 */
export async function generateStudyTip(tasks, classes) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    const context = `Today's classes: ${classes.map(c => c.title).join(", ") || "none"}. Tasks: ${tasks.map(t => `${t.title} (${t.priority}, ${t.status})`).join(", ") || "none"}.`;
    const raw = await callLLM(apiKey,
      "You are a friendly study coach for college students. Give one brief, actionable study tip (2-3 sentences) based on the student's current workload. Be specific and encouraging.",
      context
    );
    return raw;
  }
  return generateTipHeuristic(tasks, classes);
}

function generateTipHeuristic(tasks, classes) {
  const highPriority = tasks.filter(t => t.priority === "high" && t.status !== "completed");
  const inProgress = tasks.filter(t => t.status === "in_progress");
  const pending = tasks.filter(t => t.status === "pending");

  if (highPriority.length > 0) {
    return `You have ${highPriority.length} high-priority task${highPriority.length > 1 ? "s" : ""} — start with "${highPriority[0].title}". Break it into smaller chunks and tackle the hardest part first while your energy is highest.`;
  }
  if (inProgress.length > 0 && pending.length > 2) {
    return `You're working on "${inProgress[0].title}" — great momentum! Try the Pomodoro technique: 25 minutes focused work, then a 5-minute break. You've got ${pending.length} more tasks waiting.`;
  }
  if (classes.length > 0) {
    return `You have ${classes.length} class${classes.length > 1 ? "es" : ""} today. Review your notes from the last session before each class — even 5 minutes of review boosts retention by 40%.`;
  }
  if (tasks.length === 0) {
    return "No tasks on your plate! This is a great time to plan ahead — review upcoming deadlines and get a head start on bigger assignments.";
  }
  return `You have ${tasks.length} task${tasks.length > 1 ? "s" : ""} to work through. Start with the quickest one to build momentum, then switch to deeper work.`;
}

/**
 * Suggest what to work on next.
 */
export function suggestNextTask(tasks) {
  const actionable = tasks.filter(t => t.status !== "completed" && t.status !== "cancelled" && !t.parent_task_id);
  if (actionable.length === 0) return null;

  const scored = actionable.map(t => {
    let score = 0;
    if (t.priority === "high") score += 30;
    else if (t.priority === "medium") score += 15;
    if (t.status === "in_progress") score += 20;
    if (t.due_date) {
      const daysUntil = (new Date(t.due_date) - new Date()) / 86400000;
      if (daysUntil < 0) score += 50;
      else if (daysUntil < 1) score += 40;
      else if (daysUntil < 3) score += 25;
      else if (daysUntil < 7) score += 10;
    }
    return { ...t, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  let reason;
  if (best.due_date && new Date(best.due_date) < new Date()) reason = "This is overdue";
  else if (best.due_date && (new Date(best.due_date) - new Date()) / 86400000 < 1) reason = "Due today";
  else if (best.priority === "high") reason = "Highest priority";
  else if (best.status === "in_progress") reason = "Already in progress";
  else reason = "Best to tackle next";

  return { task: best, reason };
}

/**
 * Decompose a task into 3-5 actionable subtasks.
 * @param {string} title  – parent task title
 * @param {string|null} description – optional context
 * @param {number|null} estimatedMinutes – total estimated effort
 * @returns {Promise<Array<{title: string, estimated_minutes: number}>>}
 */
export async function decomposeTask(title, description, estimatedMinutes) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    return decomposeWithOpenAI(apiKey, title, description, estimatedMinutes);
  }
  return decomposeWithHeuristic(title, description, estimatedMinutes);
}

async function decomposeWithOpenAI(apiKey, title, description, estimatedMinutes) {
  const prompt = `You are a study planning assistant. Break the following assignment into 3-5 concrete, actionable subtasks. Each subtask should have a short title and an estimated duration in minutes.

Assignment: ${title}${description ? `\nDetails: ${description}` : ""}${estimatedMinutes ? `\nTotal estimated effort: ${estimatedMinutes} minutes` : ""}

Respond ONLY with a JSON array. Each element: {"title": "...", "estimated_minutes": N}
No explanation, just the JSON array.`;

  const resp = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 500,
    }),
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    throw new Error(`OpenAI API error ${resp.status}: ${errBody}`);
  }

  const data = await resp.json();
  const content = data.choices[0].message.content.trim();

  // Parse JSON (strip potential markdown fences)
  const jsonStr = content.replace(/```json\n?/g, "").replace(/```/g, "").trim();
  const subtasks = JSON.parse(jsonStr);

  if (!Array.isArray(subtasks)) throw new Error("AI response was not an array");
  return subtasks.slice(0, 5).map((s) => ({
    title: String(s.title),
    estimated_minutes: Number(s.estimated_minutes) || 30,
  }));
}

function decomposeWithHeuristic(title, _description, estimatedMinutes) {
  const total = estimatedMinutes || 120;
  const lowerTitle = title.toLowerCase();

  // Common assignment patterns
  if (lowerTitle.includes("paper") || lowerTitle.includes("essay") || lowerTitle.includes("report")) {
    return [
      { title: "Research and gather sources", estimated_minutes: Math.round(total * 0.25) },
      { title: "Create outline", estimated_minutes: Math.round(total * 0.1) },
      { title: "Write first draft", estimated_minutes: Math.round(total * 0.35) },
      { title: "Revise and edit", estimated_minutes: Math.round(total * 0.2) },
      { title: "Final proofreading and formatting", estimated_minutes: Math.round(total * 0.1) },
    ];
  }
  if (lowerTitle.includes("study") || lowerTitle.includes("exam") || lowerTitle.includes("test")) {
    return [
      { title: "Review lecture notes", estimated_minutes: Math.round(total * 0.25) },
      { title: "Summarize key concepts", estimated_minutes: Math.round(total * 0.2) },
      { title: "Practice problems", estimated_minutes: Math.round(total * 0.3) },
      { title: "Self-quiz and review weak areas", estimated_minutes: Math.round(total * 0.25) },
    ];
  }
  if (lowerTitle.includes("project") || lowerTitle.includes("presentation")) {
    return [
      { title: "Define scope and outline", estimated_minutes: Math.round(total * 0.15) },
      { title: "Research and gather materials", estimated_minutes: Math.round(total * 0.25) },
      { title: "Build / create content", estimated_minutes: Math.round(total * 0.35) },
      { title: "Review and refine", estimated_minutes: Math.round(total * 0.15) },
      { title: "Prepare for delivery", estimated_minutes: Math.round(total * 0.1) },
    ];
  }
  // Generic fallback
  return [
    { title: "Understand requirements", estimated_minutes: Math.round(total * 0.15) },
    { title: "Plan approach", estimated_minutes: Math.round(total * 0.1) },
    { title: "Work on main content", estimated_minutes: Math.round(total * 0.45) },
    { title: "Review and finalize", estimated_minutes: Math.round(total * 0.3) },
  ];
}
