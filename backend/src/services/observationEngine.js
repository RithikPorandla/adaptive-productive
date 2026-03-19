'use strict';

const db = require('../db');

const RULES = [
  // Rule 1: Peak hours confirmed
  {
    type: 'peak_hours',
    run(profile) {
      if (profile.dataPoints < 10) return null;
      return {
        severity: 'info',
        title: `You work best in the ${profile.peakPeriod}`,
        body: `${Math.round(profile.completionRate * 100)}% of your completions happen during ${profile.peakPeriod} hours. Ada now schedules your hardest tasks in that window automatically.`,
        action_tag: 'applied',
      };
    },
  },

  // Rule 2: Subject time overrun
  {
    type: 'time_overrun',
    run(profile) {
      const entries = Object.entries(profile.subjectDifficulty || {});
      if (!entries.length) return null;
      const [code, pct] = entries.sort(([, a], [, b]) => b - a)[0];
      if (pct < 20) return null;
      return {
        severity: pct > 40 ? 'warning' : 'info',
        title: `You underestimate ${code} by ${pct}%`,
        body: `Every ${code} task you've completed took ${pct}% longer than you estimated. Ada now adds a ${Math.round(pct * 0.6)}min buffer to all ${code} tasks.`,
        action_tag: 'buffer_added',
      };
    },
  },

  // Rule 3: Subject skip streak
  {
    type: 'subject_skip',
    run(profile) {
      if (!profile.recentSkipSubjects?.length) return null;
      const code = profile.recentSkipSubjects[0];
      return {
        severity: 'critical',
        title: `You've skipped ${code} multiple times`,
        body: `Ada has detected a skip pattern in ${code} over the last 3 weeks. This subject is at risk. It's been moved higher in your priority stack.`,
        action_tag: 'intervention',
      };
    },
  },

  // Rule 4: Procrastination pattern
  {
    type: 'procrastination',
    run(profile) {
      const idx = profile.procrastinationIndex;
      if (!idx || idx < 0.5) return null;
      const pct = Math.round(idx * 100);
      return {
        severity: idx > 0.7 ? 'warning' : 'info',
        title: `${pct}% of your tasks are done last-minute`,
        body: `Ada has noticed you start most tasks within 24 hours of the deadline. To protect you, deadlines in your plan now appear 2 days earlier than the real due date.`,
        action_tag: 'applied',
      };
    },
  },

  // Rule 5: Strong subject reinforcement
  {
    type: 'strong_subject',
    run(profile) {
      if (!profile.strongSubject) return null;
      return {
        severity: 'info',
        title: `${profile.strongSubject} is your strongest subject`,
        body: `Your completion rate for ${profile.strongSubject} is consistently high and on-time. Ada schedules these tasks with tighter windows to free up time for harder subjects.`,
        action_tag: 'learning',
      };
    },
  },
];

function runObservationEngine(userId, profile) {
  if (!profile || profile.dataPoints < 5) return [];

  for (const rule of RULES) {
    const result = rule.run(profile, userId);
    if (!result) continue;

    const existing = db.prepare(
      `SELECT id FROM observations WHERE user_id = ? AND type = ?`
    ).get(userId, rule.type);

    if (existing) {
      db.prepare(
        `UPDATE observations SET title=?, body=?, severity=?, action_tag=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
      ).run(result.title, result.body, result.severity, result.action_tag, existing.id);
    } else {
      db.prepare(
        `INSERT INTO observations (user_id, type, severity, title, body, action_tag) VALUES (?, ?, ?, ?, ?, ?)`
      ).run(userId, rule.type, result.severity, result.title, result.body, result.action_tag);
    }
  }

  return db.prepare(
    `SELECT * FROM observations WHERE user_id = ? AND is_active = 1 ORDER BY severity DESC, updated_at DESC`
  ).all(userId);
}

module.exports = { runObservationEngine };
