async function getToken() {
  const creds = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Spotify auth failed');
  return data.access_token;
}

export default async function handler(req, res) {
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    return res.json({ available: false });
  }

  const { title, artist } = req.query;
  if (!title || !artist) return res.status(400).json({ error: 'Missing title/artist' });

  try {
    const token = await getToken();

    // Search for track to get ID
    const q = encodeURIComponent(`track:${title} artist:${artist}`);
    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${q}&type=track&limit=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const searchData = await searchRes.json();
    const track = searchData.tracks?.items?.[0];
    if (!track) return res.json({ available: true, track: null });

    // Get audio features for the track
    const featRes = await fetch(
      `https://api.spotify.com/v1/audio-features/${track.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const features = await featRes.json();

    res.json({
      available: true,
      track: {
        id: track.id,
        name: track.name,
        artist: track.artists[0]?.name,
        album: track.album?.name,
        image: track.album?.images?.[1]?.url || track.album?.images?.[0]?.url,
        preview_url: track.preview_url,
        spotify_url: track.external_urls?.spotify,
        popularity: track.popularity,
      },
      features: features.error ? null : {
        valence: features.valence,
        energy: features.energy,
        acousticness: features.acousticness,
        danceability: features.danceability,
        tempo: Math.round(features.tempo),
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
