'use strict';

const db = require('../db');

function buildUserContext(userId) {
  const user = db.prepare(
    'SELECT behavior_profile, peak_hours FROM users WHERE id = ?'
  ).get(userId);

  let profile = {};
  try {
    profile = user?.behavior_profile ? JSON.parse(user.behavior_profile) : {};
  } catch {
    profile = {};
  }

  return {
    peakHours: profile.peakPeriod || user?.peak_hours || 'unknown',
    procrastinationIndex: profile.procrastinationIndex ?? null,
    subjectDifficulty: profile.subjectDifficulty || {},
    skippedSubjects: profile.recentSkipSubjects || [],
    completionRate: profile.completionRate ?? 0,
    streakDays: profile.streakDays ?? 0,
    strongSubject: profile.strongSubject || null,
    weakSubject: profile.weakSubject || null,
    dataPoints: profile.dataPoints ?? 0,
  };
}

function updateUserStats(userId) {
  const { computeUserProfile, shouldRecompute } = require('./behaviorEngine');
  if (shouldRecompute(userId)) {
    computeUserProfile(userId);
  }
}

module.exports = { buildUserContext, updateUserStats };
