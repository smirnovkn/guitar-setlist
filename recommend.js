export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { mood, energy, history = [], prevSong = null } = req.body;

  const histStr = history.length
    ? `\nУже сыграли: ${history.slice(-6).join(', ')}`
    : '';
  const prevStr = prevSong
    ? `\nТолько что играли: "${prevSong.title}" — ${prevSong.artist}`
    : '';

  const prompt = `Ты — умный помощник гитариста на живой вечеринке. Подбираешь реально существующие популярные песни для пения в компании под гитару.

Настроение: ${mood.label} — ${mood.desc}
Энергия аудитории: ${energy}/100 (0 = тихо и душевно, 100 = полный угар)${histStr}${prevStr}

Правила:
— Только известные реально существующие треки (Битлз, ABBA, Кино, ДДТ, Земфира, Eagles, Queen, Высоцкий и т.д.)
— Не повторяй уже сыгранные
— Поле tag: один тег на английском для Last.fm (например: acoustic, rock, nostalgic, romantic, party, chill)

Ответь ТОЛЬКО валидным JSON:
{
  "title": "название",
  "artist": "исполнитель",
  "year": 1983,
  "key": "Am",
  "tempo": "умеренно",
  "energy_dots": 6,
  "tag": "acoustic",
  "why": "одна живая фраза — почему эта песня попадает в точку прямо сейчас"
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content[0].text.trim().replace(/```json|```/g, '').trim();
    res.json(JSON.parse(text));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
