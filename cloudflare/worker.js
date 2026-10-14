// Readster: Whisper-Auswertung über Cloudflare Workers AI und Fortschritt pro Code.
// POST /                 nimmt eine WAV-Aufnahme entgegen und gibt die erkannten Wörter mit Zeiten zurück (nichts wird gespeichert).
// GET  /fortschritt/CODE liest den gespeicherten Fortschritt zu einem Code (404, wenn es den Code noch nicht gibt).
// PUT  /fortschritt/CODE speichert den Fortschritt zu einem Code (nur Zahlen und Einstellungen, keine Aufnahmen).
// Einrichtung: siehe ANLEITUNG.md

const ERLAUBT = ['https://asimplemanslab.com', 'https://www.asimplemanslab.com', 'https://mbroyer.github.io']; // nur Readster darf den Dienst nutzen
const MAX_BYTES = 8 * 1024 * 1024;     // etwa 4 Minuten Aufnahme
const MAX_STAND = 512 * 1024;          // Fortschritt ist normalerweise nur wenige KB groß
const CODE_RE = /^[A-Z0-9-]{4,24}$/;

function antwort(daten, status, origin) {
  return new Response(JSON.stringify(daten), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...cors(origin) },
  });
}
function cors(origin) {
  return {
    'Access-Control-Allow-Origin': ERLAUBT.includes(origin) ? origin : ERLAUBT[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Readster-Code',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}
function base64(buf) {
  const b = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  return btoa(s);
}
// Variable CODES (z. B. "MOND-4821, TIGER-1234") erlaubt nur diese Codes, für Fortschritt und Whisper-Auswertung.
// Ohne CODES ist jeder Code erlaubt und die Auswertung offen.
function normCode(c) {
  return String(c || '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
}
function codeErlaubt(code, env) {
  if (!CODE_RE.test(code)) return false;
  const liste = String(env.CODES || '').split(/[\s,;]+/).map((c) => c.trim().toUpperCase()).filter(Boolean);
  return !liste.length || liste.includes(code);
}

async function fortschritt(req, env, origin, code) {
  if (!env.FORTSCHRITT) return antwort({ fehler: 'Speicher ist nicht verbunden (Binding FORTSCHRITT fehlt)' }, 500, origin);
  if (!codeErlaubt(code, env)) return antwort({ fehler: 'unbekannter Code' }, 403, origin);
  const key = 'p:' + code;
  if (req.method === 'GET') {
    const wert = await env.FORTSCHRITT.get(key);
    if (!wert) return antwort({ fehler: 'neu' }, 404, origin);
    return new Response(wert, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...cors(origin) } });
  }
  if (req.method === 'PUT') {
    const text = await req.text();
    if (!text || text.length > MAX_STAND) return antwort({ fehler: 'ungültig' }, 413, origin);
    let d;
    try { d = JSON.parse(text); } catch (e) { return antwort({ fehler: 'ungültig' }, 400, origin); }
    if (!d || typeof d !== 'object' || !d.state || typeof d.state.xp !== 'number') return antwort({ fehler: 'ungültig' }, 400, origin);
    const ts = Number(d.state.ts) || Date.now();
    await env.FORTSCHRITT.put(key, JSON.stringify({ state: d.state, ts, gespeichert: Date.now() }));
    return antwort({ ok: true, ts }, 200, origin);
  }
  return antwort({ fehler: 'nicht erlaubt' }, 405, origin);
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors(origin) });
    const pfad = new URL(req.url).pathname.replace(/\/+$/, '');
    const m = /^\/fortschritt\/([^/]+)$/.exec(pfad);
    if (m) {
      if (!ERLAUBT.includes(origin)) return antwort({ fehler: 'nicht erlaubt' }, 403, origin);
      return fortschritt(req, env, origin, decodeURIComponent(m[1]).toUpperCase());
    }
    if (req.method !== 'POST') return antwort({ ok: true, dienst: 'Readster Whisper', fortschritt: !!env.FORTSCHRITT }, 200, origin);
    if (!ERLAUBT.includes(origin)) return antwort({ fehler: 'nicht erlaubt' }, 403, origin);
    if (env.CODES && !codeErlaubt(normCode(req.headers.get('X-Readster-Code')), env)) return antwort({ fehler: 'unbekannter Code' }, 403, origin);
    if (!env.AI) return antwort({ fehler: 'Workers AI ist nicht verbunden (Binding AI fehlt)' }, 500, origin);
    const buf = await req.arrayBuffer();
    if (!buf.byteLength) return antwort({ fehler: 'leer' }, 400, origin);
    if (buf.byteLength > MAX_BYTES) return antwort({ fehler: 'zu groß' }, 413, origin);
    try {
      const out = await env.AI.run('@cf/openai/whisper-large-v3-turbo', {
        audio: base64(buf),
        language: 'de',
        vad_filter: false,
        condition_on_previous_text: false,
      });
      const woerter = [];
      for (const seg of out.segments || []) {
        for (const w of seg.words || []) {
          woerter.push({ word: w.word ?? w.text ?? '', start: w.start, end: w.end });
        }
      }
      return antwort({ text: out.text || '', words: woerter }, 200, origin);
    } catch (e) {
      return antwort({ fehler: String((e && e.message) || e) }, 502, origin);
    }
  },
};
