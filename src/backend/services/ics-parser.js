/**
 * Minimal ICS parser. Extracts VEVENT blocks from .ics calendar files.
 * Works with Outlook, Google Calendar, Apple Calendar, Canvas, Blackboard.
 */

export function parseICS(icsText) {
  const events = [];
  const blocks = icsText.split("BEGIN:VEVENT");

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].split("END:VEVENT")[0];
    const ev = {};
    for (const line of unfold(block)) {
      const [key, ...rest] = line.split(":");
      const val = rest.join(":").trim();
      const baseKey = key.split(";")[0];
      if (baseKey === "SUMMARY") ev.summary = val;
      else if (baseKey === "DTSTART") ev.dtstart = parseICSDate(val);
      else if (baseKey === "DTEND") ev.dtend = parseICSDate(val);
      else if (baseKey === "LOCATION") ev.location = val;
      else if (baseKey === "DESCRIPTION") ev.description = val.replace(/\\n/g, "\n").replace(/\\,/g, ",");
      else if (baseKey === "RRULE") ev.rrule = val;
      else if (baseKey === "CATEGORIES") ev.categories = val;
    }
    if (ev.summary && ev.dtstart) events.push(ev);
  }
  return events;
}

function unfold(text) {
  return text.replace(/\r\n[ \t]/g, "").split(/\r?\n/).filter(l => l.trim());
}

function parseICSDate(val) {
  const clean = val.replace(/[TZ]/g, m => m === "T" ? "T" : "");
  if (clean.length >= 15) {
    const y = clean.slice(0, 4), mo = clean.slice(4, 6), d = clean.slice(6, 8);
    const h = clean.slice(9, 11), mi = clean.slice(11, 13);
    return { date: `${y}-${mo}-${d}`, time: `${h}:${mi}`, full: `${y}-${mo}-${d}T${h}:${mi}` };
  }
  if (clean.length >= 8) {
    const y = clean.slice(0, 4), mo = clean.slice(4, 6), d = clean.slice(6, 8);
    return { date: `${y}-${mo}-${d}`, time: null, full: `${y}-${mo}-${d}` };
  }
  return { date: null, time: null, full: val };
}

/**
 * Detect day-of-week from RRULE or from the event date.
 */
export function getDayOfWeek(event) {
  if (event.rrule) {
    const byDay = event.rrule.match(/BYDAY=([^;]+)/);
    if (byDay) {
      const map = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
      return byDay[1].split(",").map(d => map[d.trim()]).filter(n => n !== undefined);
    }
  }
  if (event.dtstart?.date) {
    return [new Date(event.dtstart.date + "T12:00:00").getDay()];
  }
  return [];
}
