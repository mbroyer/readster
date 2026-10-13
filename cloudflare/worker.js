// Readster: Whisper-Auswertung über Cloudflare Workers AI.
// Nimmt eine WAV-Aufnahme entgegen und gibt die erkannten Wörter mit Start- und Endzeit zurück.
// Nichts wird gespeichert. Einrichtung: siehe ANLEITUNG.md

const ERLAUBT = ['https://mbroyer.github.io']; // nur Readster darf den Dienst nutzen
const MAX_BYTES = 8 * 1024 * 1024;              // etwa 4 Minuten Aufnahme

function antwort(daten, status, origin) {
  return new Response(JSON.stringify(daten), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...cors(origin) },
  });
}
function cors(origin) {
  return {
    'Access-Control-Allow-Origin': ERLAUBT.includes(origin) ? origin : ERLAUBT[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors(origin) });
    if (req.method !== 'POST') return antwort({ ok: true, dienst: 'Readster Whisper' }, 200, origin);
    if (!ERLAUBT.includes(origin)) return antwort({ fehler: 'nicht erlaubt' }, 403, origin);
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
