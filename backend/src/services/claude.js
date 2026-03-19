'use strict';

const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-20250514';

async function generateBriefing(user, tasks, context) {
  const upcomingTasks = tasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 10);

  const schema = {
    mood: 'focused|calm|warning|critical',
    greeting: 'string — personal, name-aware',
    insight: 'string — one key observation from their behavior data',
    directive: 'string — the single most important thing to do today',
    riskAlert: 'string|null — crunch warning if 3+ tasks due within 7 days',
    adaptationNote: 'string|null — how Ada has adapted the plan based on learned patterns',
  };

  const systemPrompt = `You are Ada, an intelligent academic planner. You know the student deeply through their behavior data. Speak directly, warmly, and with confidence. You are not a generic assistant — you are their personal academic co-pilot. Return ONLY valid JSON matching this schema: ${JSON.stringify(schema)}`;

  const userMessage = `
Current date: ${new Date().toISOString()}
Student: ${user.name || 'Student'}, ${user.university || 'University'}, ${user.major || 'undeclared major'}

Upcoming tasks (next 7 days):
${upcomingTasks.map(t => `- ${t.title} (${t.course_code || 'no course'}) due ${t.due_date}, priority: ${t.priority}`).join('\n')}

Behavioral context:
${JSON.stringify(context, null, 2)}

Generate Ada's morning briefing as JSON.
`.trim();

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const text = response.content[0].text;
    const parsed = JSON.parse(text);

    // Crunch detection override
    const crunchTasks = upcomingTasks.filter(t => {
      const days = (new Date(t.due_date) - new Date()) / (1000 * 60 * 60 * 24);
      return days <= 7;
    });
    if (crunchTasks.length >= 3 && !parsed.riskAlert) {
      parsed.riskAlert = `Crunch week detected: ${crunchTasks.length} tasks due in the next 7 days. Ada is prioritizing your schedule.`;
    }

    return parsed;
  } catch {
    return {
      mood: 'calm',
      greeting: `Good ${getTimeOfDay()}, ${user.name || 'there'}. Ada is here.`,
      insight: 'Keep going — every task completed builds momentum.',
      directive: 'Start with your most urgent task today.',
      riskAlert: null,
      adaptationNote: null,
    };
  }
}

async function parseSyllabus(pdfBase64, courseCode, userId) {
  const schema = [
    {
      title: 'string',
      type: 'assignment|exam|quiz|lab|project|reading',
      due_date: 'ISO date string',
      estimated_hours: 'number',
      priority: 'low|medium|high|critical',
    },
  ];

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdfBase64,
              },
            },
            {
              type: 'text',
              text: `Extract all assignments, exams, quizzes, labs, and projects from this syllabus. Return ONLY a JSON array matching this schema: ${JSON.stringify(schema)}. Use ISO date strings for due_date. If a year is not specified, assume the current academic year. Course code: ${courseCode}.`,
            },
          ],
        },
      ],
    });

    const text = response.content[0].text;
    // Strip any markdown code fences
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error('Failed to parse syllabus: ' + err.message);
  }
}

async function decomposeTask(task, context) {
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Break down this task into 3-5 concrete subtasks. Return ONLY a JSON array of strings.

Task: ${task.title}
Type: ${task.type}
Course: ${task.course_code || 'N/A'}
Due: ${task.due_date}
Estimated hours: ${task.estimated_hours || 'unknown'}

Student context: ${JSON.stringify(context)}`,
        },
      ],
    });

    const text = response.content[0].text;
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return [`Start ${task.title}`, `Work through ${task.title}`, `Review and submit ${task.title}`];
  }
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

module.exports = { generateBriefing, parseSyllabus, decomposeTask };
