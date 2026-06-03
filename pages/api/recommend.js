import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { mood, energy, history = [], prevSong } = req.body;
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

  const historyNote = history.length
    ? `\n\nУже сыграно (не повторять): ${history.join(', ')}`
    : '';

  const prevNote = prevSong
    ? `\n\nПредыдущая песня: "${prevSong.title}" — ${prevSong.artist}`
    : '';

  const prompt = `Ты — опытный гитарист на вечеринке. Подбери одну песню для исполнения.

Настроение компании: ${moodLabels[mood.id] || mood.id}
Уровень энергии: ${energy}/100 (0=тихо, 100=полный угар)${prevNote}${historyNote}

Верни ТОЛЬКО валидный JSON без markdown-блоков, точно в таком формате:
{
  "title": "название песни по-английски",
  "artist": "исполнитель",
  "year": 1985,
  "key": "Am",
  "tempo": "умеренно",
  "energy_dots": 7,
  "tag": "${moodTagMap[mood.id] || 'acoustic'}",
  "why": "одна фраза — почему именно эта песня подходит сейчас"
}

Требования:
- ПРИОРИТЕТ: русскоязычные песни (русский рок, авторская песня, советская эстрада, современная российская музыка). Английские — только если нет подходящей русской
- Реальная известная песня, хорошо звучащая на акустической гитаре
- energy_dots: число от 0 до 10, соответствующее уровню энергии ${energy}/100
- key: тональность (например Am, G, C, D, Em)
- tempo: словесное описание (медленно / умеренно / быстро)
- why: по-русски, живо и кратко`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].text.trim();
    const jsonStr = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const song = JSON.parse(jsonStr);

    res.json(song);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
