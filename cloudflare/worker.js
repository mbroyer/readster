// Readster: Whisper-Auswertung über Cloudflare Workers AI und Fortschritt pro Code.
// POST /                 nimmt eine WAV-Aufnahme entgegen und gibt die erkannten Wörter mit Zeiten zurück (nichts wird gespeichert).
// GET  /fortschritt/CODE liest den gespeicherten Fortschritt zu einem Code (404, wenn es den Code noch nicht gibt).
// PUT  /fortschritt/CODE speichert den Fortschritt zu einem Code (nur Zahlen und Einstellungen, keine Aufnahmen).
// POST /feedback         nimmt Feedback aus der App an (Text, Gesicht, optional Sprachnachricht) und legt es im Speicher ab.
// GET  /feedback?k=…     zeigt Mark alle Feedbacks (Schlüssel = Geheimnis FEEDBACK_SCHLUESSEL).
// Einrichtung: siehe ANLEITUNG.md

const ERLAUBT = ['https://asimplemanslab.com', 'https://www.asimplemanslab.com', 'https://mbroyer.github.io']; // nur Readster darf den Dienst nutzen
const MAX_BYTES = 8 * 1024 * 1024;     // etwa 4 Minuten Aufnahme
const MAX_STAND = 512 * 1024;          // Fortschritt ist normalerweise nur wenige KB groß
const CODE_RE = /^[A-Z0-9-]{4,24}$/;
const MAX_FEEDBACK = 6 * 1024 * 1024;  // Sprachnachricht bis etwa 2 Minuten

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

// ---------- Feedback ----------
// Gespeichert im selben KV wie der Fortschritt: f:<Zeit rückwärts>:<Zufall> (neueste zuerst) und t:<id> für den Ton.
function feedbackId() {
  return String(1e13 - Date.now()).padStart(13, '0') + '-' + Math.random().toString(36).slice(2, 8);
}
async function feedbackSenden(req, env, origin) {
  if (!env.FORTSCHRITT) return antwort({ fehler: 'Speicher ist nicht verbunden (Binding FORTSCHRITT fehlt)' }, 500, origin);
  const code = normCode(req.headers.get('X-Readster-Code'));
  if (!codeErlaubt(code, env)) return antwort({ fehler: 'unbekannter Code' }, 403, origin);
  const text = await req.text();
  if (!text || text.length > MAX_FEEDBACK) return antwort({ fehler: 'zu groß' }, 413, origin);
  let d;
  try { d = JSON.parse(text); } catch (e) { return antwort({ fehler: 'ungültig' }, 400, origin); }
  const nachricht = String(d.text || '').slice(0, 4000);
  const stimmung = [0, 1, 2].includes(d.stimmung) ? d.stimmung : null;
  const ton = typeof d.ton === 'string' && d.ton.length > 100 ? d.ton : '';
  if (!nachricht.trim() && !ton && stimmung === null) return antwort({ fehler: 'leer' }, 400, origin);
  const id = feedbackId();
  const eintrag = {
    ts: Date.now(), code, text: nachricht, stimmung,
    ton: ton ? { mime: String(d.mime || 'audio/mp4').slice(0, 60), sek: Number(d.sek) || 0 } : null,
    info: String(d.info || '').slice(0, 300),
  };
  if (ton) await env.FORTSCHRITT.put('t:' + id, ton);
  await env.FORTSCHRITT.put('f:' + id, JSON.stringify(eintrag));
  return antwort({ ok: true }, 200, origin);
}
function html(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
function seite(inhalt, status) {
  return new Response('<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Readster Feedback</title><style>' +
    'body{font:16px/1.45 system-ui,sans-serif;margin:0;background:#f4f1ea;color:#1d2a30}main{max-width:720px;margin:0 auto;padding:16px}h1{font-size:1.4rem}' +
    '.fb{background:#fff;border-radius:14px;padding:14px 16px;margin:12px 0;box-shadow:0 1px 3px #0001}.kopf{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap;color:#5b6b72;font-size:.9rem}' +
    '.kopf b{color:#0f5e66;font-size:1rem}.gesicht{font-size:1.6rem}.txt{white-space:pre-wrap;margin:8px 0}audio{width:100%;margin-top:6px}.info{color:#8a979c;font-size:.78rem;margin-top:6px}' +
    'form.weg{text-align:right;margin:0}form.weg button{background:none;border:0;color:#a33;cursor:pointer;font-size:.85rem}input{font-size:1rem;padding:8px;border-radius:8px;border:1px solid #bbb}button.go{font-size:1rem;padding:8px 14px}' +
    '</style></head><body><main>' + inhalt + '</main></body></html>',
    { status: status || 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}
function schluesselOk(k, env) {
  return !!env.FEEDBACK_SCHLUESSEL && typeof k === 'string' && k === env.FEEDBACK_SCHLUESSEL;
}
async function feedbackAnsicht(req, env, url, rest) {
  if (!env.FEEDBACK_SCHLUESSEL) return seite('<h1>Feedback</h1><p>Das Geheimnis <b>FEEDBACK_SCHLUESSEL</b> ist beim Worker noch nicht angelegt (siehe ANLEITUNG.md).</p>', 500);
  if (!env.FORTSCHRITT) return seite('<h1>Feedback</h1><p>Speicher ist nicht verbunden (Binding FORTSCHRITT fehlt).</p>', 500);
  let k = url.searchParams.get('k') || '';
  let form = null;
  if (req.method === 'POST') { form = await req.formData(); k = String(form.get('k') || ''); }
  if (!schluesselOk(k, env)) {
    return seite('<h1>Readster Feedback</h1><form method="get" action="/feedback"><p>Schlüssel:</p><input name="k" type="password" autocomplete="current-password"> <button class="go">Öffnen</button></form>' + (k ? '<p>Der Schlüssel stimmt nicht.</p>' : ''), k ? 403 : 200);
  }
  // Sprachnachricht abspielen
  const mt = /^\/ton\/([0-9a-z-]+)$/.exec(rest);
  if (mt) {
    const [ton, roh] = await Promise.all([env.FORTSCHRITT.get('t:' + mt[1]), env.FORTSCHRITT.get('f:' + mt[1])]);
    if (!ton) return new Response('nicht gefunden', { status: 404 });
    let mime = 'audio/mp4';
    try { mime = JSON.parse(roh).ton.mime || mime; } catch (e) { /* Standard */ }
    const bin = Uint8Array.from(atob(ton), (c) => c.charCodeAt(0));
    return new Response(bin, { headers: { 'Content-Type': mime.split(';')[0], 'Cache-Control': 'private, max-age=86400' } });
  }
  // Löschen
  if (form && form.get('loeschen')) {
    const id = String(form.get('loeschen')).replace(/[^0-9a-z-]/g, '');
    await Promise.all([env.FORTSCHRITT.delete('f:' + id), env.FORTSCHRITT.delete('t:' + id)]);
    return Response.redirect(url.origin + '/feedback?k=' + encodeURIComponent(k), 303);
  }
  const liste = await env.FORTSCHRITT.list({ prefix: 'f:', limit: 100 });
  const eintraege = await Promise.all(liste.keys.map(async (x) => {
    const roh = await env.FORTSCHRITT.get(x.name);
    try { return { id: x.name.slice(2), ...JSON.parse(roh) }; } catch (e) { return null; }
  }));
  const ke = encodeURIComponent(k);
  const zeit = (ts) => new Date(ts).toLocaleString('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'medium', timeStyle: 'short' });
  const gesicht = ['🙁', '😐', '🙂'];
  let h = '<h1>Readster Feedback</h1><p>' + eintraege.filter(Boolean).length + (liste.list_complete ? '' : '+') + ' Nachrichten, neueste zuerst.</p>';
  for (const e of eintraege) {
    if (!e) continue;
    h += '<div class="fb"><div class="kopf"><b>' + html(e.code) + '</b><span>' + html(zeit(e.ts)) + '</span>' + (e.stimmung !== null && e.stimmung !== undefined ? '<span class="gesicht">' + gesicht[e.stimmung] + '</span>' : '') + '</div>' +
      (e.text ? '<div class="txt">' + html(e.text) + '</div>' : '') +
      (e.ton ? '<audio controls preload="none" src="/feedback/ton/' + html(e.id) + '?k=' + ke + '"></audio>' : '') +
      (e.info ? '<div class="info">' + html(e.info) + '</div>' : '') +
      '<form class="weg" method="post" action="/feedback" onsubmit="return confirm(\'Dieses Feedback löschen?\')"><input type="hidden" name="k" value="' + html(k) + '"><button name="loeschen" value="' + html(e.id) + '">Löschen</button></form></div>';
  }
  return seite(h);
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors(origin) });
    const url = new URL(req.url);
    const pfad = url.pathname.replace(/\/+$/, '');
    if (pfad === '/feedback' && req.method === 'POST' && ERLAUBT.includes(origin)) return feedbackSenden(req, env, origin);
    if (pfad === '/feedback' || pfad.startsWith('/feedback/')) return feedbackAnsicht(req, env, url, pfad.slice('/feedback'.length));
    const m = /^\/fortschritt\/([^/]+)$/.exec(pfad);
    if (m) {
      if (!ERLAUBT.includes(origin)) return antwort({ fehler: 'nicht erlaubt' }, 403, origin);
      return fortschritt(req, env, origin, decodeURIComponent(m[1]).toUpperCase());
    }
    if (req.method !== 'POST') return antwort({ ok: true, dienst: 'Readster Whisper', fortschritt: !!env.FORTSCHRITT, feedback: !!env.FEEDBACK_SCHLUESSEL }, 200, origin);
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
