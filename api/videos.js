// Pulls Meet Kevin's latest videos straight from YouTube's public RSS feed.
// No API key needed.
//
// Channel: Meet Kevin (UCUvvj5lwue7PspotMDjk5UA)

const KEVIN_CHANNEL_ID = 'UCUvvj5lwue7PspotMDjk5UA';

function decode(s) {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
}

export default async function handler(req, res) {
  try {
    const channel = (req.query.channel || KEVIN_CHANNEL_ID).toString();
    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channel)}`;
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) throw new Error(`youtube rss ${r.status}`);
    const xml = await r.text();

    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(m => {
      const block = m[1];
      const get = (re) => { const x = block.match(re); return x ? x[1].trim() : ''; };
      const videoId = get(/<yt:videoId>([^<]+)<\/yt:videoId>/);
      return {
        videoId,
        title:     decode(get(/<title>([^<]+)<\/title>/)),
        published: get(/<published>([^<]+)<\/published>/),
        link:      get(/<link[^>]*href="([^"]+)"/),
        thumbnail: videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : '',
      };
    }).filter(v => v.videoId);

    // Cache at the edge for 10 minutes — keeps things snappy and reduces 429s.
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800');
    res.status(200).json(entries);
  } catch (e) {
    console.error('VIDEOS ERROR:', e);
    res.status(500).json({ error: e.message });
  }
}
