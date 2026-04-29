// Persistent cross-device sync via jsonblob.com (no auth, free).
// Your old version used an in-memory `DB = {}` which RESETS every cold start
// on Vercel — so data only survived for a few seconds.
//
// Endpoints:
//   POST   /api/sync             body=any JSON   → { ok:true, id:"..." }
//   GET    /api/sync?id=...                       → the stored JSON
//   PUT    /api/sync?id=...     body=any JSON   → { ok:true, id:"..." }

const BLOB_BASE = 'https://jsonblob.com/api/jsonBlob';

export default async function handler(req, res) {
  const id = (req.query?.id || '').toString();

  try {
    if (req.method === 'POST') {
      const r = await fetch(BLOB_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(req.body || {}),
      });
      if (!r.ok) throw new Error(`upstream ${r.status}`);
      const loc = r.headers.get('location') || '';
      const blobId = loc.split('/').pop();
      if (!blobId) throw new Error('no Location header from upstream');
      return res.status(200).json({ ok: true, id: blobId });
    }

    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'id query param required' });
      const r = await fetch(`${BLOB_BASE}/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(req.body || {}),
      });
      if (!r.ok) throw new Error(`upstream ${r.status}`);
      return res.status(200).json({ ok: true, id });
    }

    if (req.method === 'GET') {
      if (!id) return res.status(400).json({ error: 'id query param required' });
      const r = await fetch(`${BLOB_BASE}/${encodeURIComponent(id)}`, {
        headers: { Accept: 'application/json' },
      });
      if (!r.ok) throw new Error(`upstream ${r.status}`);
      const data = await r.json();
      return res.status(200).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('SYNC ERROR:', e);
    res.status(500).json({ error: e.message });
  }
}
