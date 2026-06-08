import Anthropic from '@anthropic-ai/sdk';
import SONGLIST from '../../lib/songlist';

const client = new Anthropic();

async function askClaude(prompt) {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = message.content[0].text.trim();
  const jsonStr = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(jsonStr);
}

async function getSpotifyPopularity(title, artist) {
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) return null;
  try {
    const creds = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString('base64');
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials',
    });
    const { access_token } = await tokenRes.json();
    if (!access_token) return null;

    const q = encodeURIComponent(`track:${title} artist:${artist}`);
    const searchRes = await fetch(
      `https://api.spotify.com/v1/search?q=${q}&type=track&limit=1`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const data = await searchRes.json();
    return data.tracks?.items?.[0]?.popularity ?? null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { mood, energy, history = [], prevSong, wish } = req.body;
  if (!mood || energy == null) return res.status(400).json({ error: 'Missing mood or energy' });

  const moodLabels = {
    nostalgic: 'Ностальгия (тёплые воспоминания)',
    romantic: 'Романтика (нежно и душевно)',
    energetic: 'Зажигаем (веселье и драйв)',
    melancholic: 'Грустим (душевная грусть)',
    fun: 'Хулиганим (смех и веселье)',
    chill: 'Расслабон (тихо и спокойно)',
  };

  const moodTagMap = {
    nostalgic: 'nostalgic', romantic: 'romantic', energetic: 'rock',
    melancholic: 'melancholic', fun: 'party', chill: 'acoustic',
  };

  const repertoire = SONGLIST.map(s => `${s.title} — ${s.artist}`).join('\n');

  const buildPrompt = (excluded = []) => {
    const excludeNote = excluded.length
      ? `\n\nУже предложено (не повторять): ${excluded.join(', ')}`
      : '';
    const historyNote = history.length
      ? `\n\nУже сыграно (не повторять): ${history.join(', ')}`
      : '';
    const prevNote = prevSong
      ? `\n\nПредыдущая песня: "${prevSong.title}" — ${prevSong.artist}`
      : '';
    const wishNote = wish?.trim()
      ? `\n\nПожелание от гитариста: ${wish.trim()}`
      : '';

    return `Ты — опытный гитарист на вечеринке. Подбери одну песню для исполнения.

Настроение компании: ${moodLabels[mood.id] || mood.id}
Уровень энергии: ${energy}/100 (0=тихо, 100=полный угар)${prevNote}${wishNote}${historyNote}${excludeNote}

РЕПЕРТУАР (песни, которые гитарист умеет играть и петь — выбирай ТОЛЬКО из этого списка, если подходящая есть):
${repertoire}

Верни ТОЛЬКО валидный JSON без markdown-блоков, точно в таком формате:
{
  "title": "название песни",
  "artist": "исполнитель",
  "year": 1985,
  "key": "Am",
  "tempo": "умеренно",
  "energy_dots": 7,
  "tag": "${moodTagMap[mood.id] || 'acoustic'}",
  "why": "одна фраза — почему именно эта песня подходит сейчас"
}

Требования:
- ГЛАВНОЕ ПРАВИЛО: выбирай песню из РЕПЕРТУАРА выше — гитарист её точно умеет сыграть. Только если ни одна из репертуара не подходит под настроение и энергию — можно предложить другую
- Песня должна хорошо звучать на акустической гитаре
- energy_dots: число от 0 до 10, соответствующее уровню энергии ${energy}/100
- key: тональность (например Am, G, C, D, Em)
- tempo: словесное описание (медленно / умеренно / быстро)
- why: по-русски, живо и кратко`;
  };

  try {
    const excluded = [];
    let song = await askClaude(buildPrompt());

    // If Spotify keys are set, verify popularity; retry once if track is too obscure
    if (process.env.SPOTIFY_CLIENT_ID) {
      const popularity = await getSpotifyPopularity(song.title, song.artist);
      if (popularity !== null && popularity < 40) {
        excluded.push(`${song.title} — ${song.artist}`);
        song = await askClaude(buildPrompt(excluded));
      }
    }

    res.json(song);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
