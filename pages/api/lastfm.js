export default async function handler(req, res) {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) return res.status(400).json({ error: 'LASTFM_API_KEY not set' });

  const { artist, track, tag } = req.query;

  let url;
  if (artist && track) {
    url = `https://ws.audioscrobbler.com/2.0/?method=track.getsimilar` +
      `&artist=${encodeURIComponent(artist)}` +
      `&track=${encodeURIComponent(track)}` +
      `&api_key=${apiKey}&limit=9&autocorrect=1&format=json`;
  } else if (tag) {
    url = `https://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks` +
      `&tag=${encodeURIComponent(tag)}` +
      `&api_key=${apiKey}&limit=9&format=json`;
  } else {
    return res.status(400).json({ error: 'Provide artist+track or tag' });
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
