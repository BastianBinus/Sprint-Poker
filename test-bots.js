// test-bots.js — Sprint Poker Bot Tester (Firebase direkt, kein Browser)
// Usage: npm run usertest -- "https://url?s=SESSION_ID&m=casino"

const https = require('https');

const URL_ARG = process.argv[2];
if (!URL_ARG) { console.error('Usage: npm run usertest -- "URL"'); process.exit(1); }

const FIREBASE_URL = 'https://sprint-poker-pax-default-rtdb.firebaseio.com';

const params = new URLSearchParams(URL_ARG.split('?')[1]);
const SESSION_ID = params.get('s');
const MODE = params.get('m') || 'casino';

if (!SESSION_ID) { console.error('Keine Session ID in URL gefunden'); process.exit(1); }

const BOT_NAMES = ['Alice', 'Bob', 'Charlie', 'Diana'];
const VOTES = ['1', '2', '3', '5', '8', '13', '21'];
const START_CHIPS = 1000;

function genId() { return Math.random().toString(36).slice(2, 10); }
function randomVote() { return VOTES[Math.floor(Math.random() * VOTES.length)]; }

function firebaseRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const url = `${FIREBASE_URL}${path}.json`;
    const body = data ? JSON.stringify(data) : null;
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {})
      }
    };
    const req = https.request(options, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve(raw); } });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function checkSession() {
  const data = await firebaseRequest('GET', `/sessions/${SESSION_ID}`, null);
  if (!data) { console.error('Session nicht gefunden:', SESSION_ID); process.exit(1); }
  console.log(`Session gefunden: "${data.storyName}" (${data.mode})`);
  return data;
}

async function runBot(name, index) {
  const myId = genId();
  const vote = randomVote();

  const playerData = {
    name,
    vote: null,
    locked: false,
    isHost: false,
    spectator: false,
    ...(MODE === 'casino' ? { chips: START_CHIPS } : {})
  };

  await firebaseRequest('PATCH', `/sessions/${SESSION_ID}/players/${myId}`, playerData);
  console.log(`[${name}] Beigetreten`);

  await new Promise(r => setTimeout(r, 1000 + index * 500));

  await firebaseRequest('PATCH', `/sessions/${SESSION_ID}/players/${myId}`, { vote, locked: true });
  console.log(`[${name}] Vote: ${vote}`);

  await new Promise(r => setTimeout(r, 30000));

  await firebaseRequest('DELETE', `/sessions/${SESSION_ID}/players/${myId}`, null);
  console.log(`[${name}] Verlässt`);
}

(async () => {
  console.log(`\nSprint Poker Bot Tester`);
  console.log(`Session: ${SESSION_ID} | Mode: ${MODE}\n`);
  await checkSession();
  BOT_NAMES.forEach((name, i) => setTimeout(() => runBot(name, i), i * 1200));
})();