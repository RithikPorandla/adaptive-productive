#!/usr/bin/env node
/**
 * Seed demo data for local development
 * Run: node scripts/seed-demo.js
 * Requires backend DB to exist (run backend first)
 */

const API = 'http://localhost:3000';

async function post(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.status === 204 ? null : res.json();
}

async function main() {
  try {
    const today = new Date().getDay();
    await post('/api/schedule', { title: 'Math 101', day_of_week: today, start_time: '09:00', end_time: '10:15', color: '#0D9488' });
    await post('/api/schedule', { title: 'English 201', day_of_week: today, start_time: '11:00', end_time: '12:15', color: '#F97316' });
    await post('/api/schedule', { title: 'CS Lab', day_of_week: (today + 2) % 7, start_time: '14:00', end_time: '16:00', color: '#6366F1' });

    const todayStr = new Date().toISOString().slice(0, 10);
    await post('/api/tasks', { title: 'Read Chapter 5', due_date: todayStr, estimated_minutes: 45 });
    await post('/api/tasks', { title: 'Problem set 3', due_date: todayStr, estimated_minutes: 60 });
    await post('/api/tasks', { title: 'Research paper outline', due_date: todayStr, estimated_minutes: 30 });

    console.log('Demo data seeded.');
  } catch (e) {
    console.error('Seed failed. Is the backend running?', e.message);
    process.exit(1);
  }
}

main();
