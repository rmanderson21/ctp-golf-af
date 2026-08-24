// Closest to the Pin — tiny backend
//
// Serves the site (from /public) and stores the current event/bracket
// state as a single JSON blob on disk, at DATA_FILE below. The admin
// panel and the TV display both read/write this same file through
// /api/state, which is how they stay in sync — same idea as the
// Claude artifact version, just backed by a real file instead of
// Claude's storage.
//
// Separately, HISTORY_FILE holds an array of past completed tournaments,
// archived automatically by the frontend whenever a champion is decided
// and the admin starts fresh. The event-history page (/control.html)
// reads from this independently of the live board.

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// If you attach a persistent disk (recommended — see README), point
// DATA_DIR at its mount path via the DATA_DIR env var. Otherwise this
// falls back to a local file next to server.js.
const DATA_DIR = process.env.DATA_DIR || __dirname;
const DATA_FILE = path.join(DATA_DIR, 'data.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const MAX_HISTORY_EVENTS = 300; // sane cap so the file can't grow forever

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function readState() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return null; // no file yet, or unreadable — frontend handles null fine
  }
}

function writeState(obj) {
  // write-then-rename so a crash mid-write can't corrupt the file
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj));
  fs.renameSync(tmp, DATA_FILE);
}

function readHistory() {
  try {
    const raw = fs.readFileSync(HISTORY_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function writeHistory(arr) {
  const tmp = HISTORY_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(arr));
  fs.renameSync(tmp, HISTORY_FILE);
}

app.get('/api/state', (req, res) => {
  res.json({ value: readState() });
});

app.post('/api/state', (req, res) => {
  try {
    writeState(req.body);
    res.json({ ok: true });
  } catch (e) {
    console.error('Failed to write state:', e);
    res.status(500).json({ ok: false, error: 'write failed' });
  }
});

app.get('/api/history', (req, res) => {
  const events = readHistory().sort((a, b) => (b.savedAt||0) - (a.savedAt||0));
  res.json({ events });
});

app.post('/api/history', (req, res) => {
  try {
    const event = req.body;
    if(!event || !event.id) {
      res.status(400).json({ ok:false, error: 'missing event id' });
      return;
    }
    const events = readHistory();
    const idx = events.findIndex(e => e.id === event.id);
    if(idx >= 0) events[idx] = event; else events.push(event);
    while(events.length > MAX_HISTORY_EVENTS) events.shift();
    writeHistory(events);
    res.json({ ok: true });
  } catch (e) {
    console.error('Failed to write history:', e);
    res.status(500).json({ ok: false, error: 'write failed' });
  }
});

app.delete('/api/history/:id', (req, res) => {
  try {
    const events = readHistory().filter(e => e.id !== req.params.id);
    writeHistory(events);
    res.json({ ok: true });
  } catch (e) {
    console.error('Failed to delete history entry:', e);
    res.status(500).json({ ok: false, error: 'delete failed' });
  }
});

app.get('/healthz', (req, res) => res.send('ok'));

app.listen(PORT, () => {
  console.log(`Closest to the Pin server running on port ${PORT}`);
  console.log(`Storing event data at ${DATA_FILE}`);
  console.log(`Storing event history at ${HISTORY_FILE}`);
});

