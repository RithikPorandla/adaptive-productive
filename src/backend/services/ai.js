/**
 * AI service for task decomposition.
 *
 * Uses OpenAI GPT-4 when OPENAI_API_KEY is set; otherwise falls back to a
 * rule-based heuristic so the feature works without an API key during dev.
 */

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

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
