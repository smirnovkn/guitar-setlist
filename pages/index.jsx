import Head from 'next/head';
import { useState, useCallback } from 'react';

// ── Link generators ──────────────────────────────────────────────────────────
const ugUrl     = (t, a) => `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(`${t} ${a}`)}`;
const geniusUrl = (t, a) => `https://genius.com/search?q=${encodeURIComponent(`${t} ${a}`)}`;
const chordsUrl = (t, a) => `https://mychords.net/search/?q=${encodeURIComponent(`${t} ${a}`)}`;

// ── Design ───────────────────────────────────────────────────────────────────
const C = {
  amber: '#e8a838', text: '#f0e2c4',
  muted: '#7a5a2a', dim: '#5a3a10',
};

const MOODS = [
  { id: 'nostalgic',   label: 'Ностальгия',  emoji: '🌙', desc: 'Тёплые воспоминания', tag: 'nostalgic'  },
  { id: 'romantic',    label: 'Романтика',   emoji: '❤️',  desc: 'Нежно и душевно',    tag: 'romantic'   },
  { id: 'energetic',   label: 'Зажигаем',    emoji: '🔥',  desc: 'Веселье и драйв',    tag: 'rock'       },
  { id: 'melancholic', label: 'Грустим',     emoji: '🌧️',  desc: 'Душевная грусть',    tag: 'melancholic'},
  { id: 'fun',         label: 'Хулиганим',   emoji: '🎉',  desc: 'Смех и веселье',     tag: 'party'      },
  { id: 'chill',       label: 'Расслабон',   emoji: '🌊',  desc: 'Тихо и спокойно',    tag: 'acoustic'   },
];

// ── Small components ─────────────────────────────────────────────────────────

function ExtLink({ href, accent, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '8px 14px', borderRadius: 8, textDecoration: 'none',
      fontSize: 13, fontFamily: 'inherit', fontWeight: 600,
      background: accent ? 'rgba(232,168,56,0.15)' : 'rgba(255,255,255,0.05)',
      border: `1px solid ${accent ? 'rgba(232,168,56,0.4)' : 'rgba(255,255,255,0.09)'}`,
      color: accent ? C.amber : C.muted, transition: 'opacity .15s',
    }}
    onMouseEnter={e => e.currentTarget.style.opacity = '.65'}
    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
      {children}
    </a>
  );
}

function EnergyDots({ value }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i < value ? C.amber : 'rgba(232,168,56,0.15)' }} />
      ))}
    </div>
  );
}

function FeatureBar({ label, value }) {
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: C.dim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontSize: 11, color: C.muted }}>{Math.round(value * 100)}%</span>
      </div>
      <div style={{ height: 3, background: 'rgba(232,168,56,0.12)', borderRadius: 2 }}>
        <div style={{ height: '100%', width: `${value * 100}%`, background: C.amber, borderRadius: 2, transition: 'width .6s ease' }} />
      </div>
    </div>
  );
}

function PreviewButton({ url }) {
  const [playing, setPlaying] = useState(false);
  const [audio] = useState(() => typeof Audio !== 'undefined' ? new Audio(url) : null);
  if (!url || !audio) return null;

  const toggle = () => {
    if (playing) { audio.pause(); audio.currentTime = 0; setPlaying(false); }
    else { audio.play(); audio.onended = () => setPlaying(false); setPlaying(true); }
  };

  return (
    <button onClick={toggle} style={{
      background: playing ? 'rgba(232,168,56,0.2)' : 'rgba(255,255,255,0.05)',
      border: `1px solid ${playing ? 'rgba(232,168,56,0.45)' : 'rgba(255,255,255,0.1)'}`,
      borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
      color: playing ? C.amber : C.muted, fontSize: 13, fontFamily: 'inherit', fontWeight: 600,
    }}>
      {playing ? '⏹ Стоп' : '▶ Превью 30с'}
    </button>
  );
}

// ── Main card ────────────────────────────────────────────────────────────────

function MainCard({ song, spotify }) {
  const { title, artist, year, key: songKey, tempo, energy_dots, why } = song;
  const img = spotify?.track?.image;

  return (
    <div style={{ background: 'rgba(232,168,56,0.05)', border: '1px solid rgba(232,168,56,0.28)', borderRadius: 20, padding: '24px 26px' }}>
      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
        {img
          ? <img src={img} alt={title} style={{ width: 88, height: 88, borderRadius: 10, objectFit: 'cover', flexShrink: 0, boxShadow: '0 4px 16px rgba(0,0,0,.5)' }} />
          : <div style={{ width: 88, height: 88, borderRadius: 10, flexShrink: 0, background: 'rgba(232,168,56,0.08)', border: '1px solid rgba(232,168,56,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🎸</div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.15, color: C.text, margin: 0 }}>{title}</h2>
              <p style={{ color: C.muted, fontSize: 18, fontStyle: 'italic', marginTop: 4 }}>
                {artist}{year && <span style={{ fontSize: 13, marginLeft: 8, opacity: 0.6 }}>{year}</span>}
              </p>
            </div>
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              {songKey && <div style={{ background: 'rgba(232,168,56,0.18)', borderRadius: 8, padding: '4px 12px', color: C.amber, fontFamily: 'monospace', fontWeight: 700, fontSize: 15 }}>{songKey}</div>}
              {tempo && <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>{tempo}</div>}
            </div>
          </div>
          {energy_dots != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <span style={{ fontSize: 11, color: C.dim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Энергия</span>
              <EnergyDots value={energy_dots} />
            </div>
          )}
        </div>
      </div>

      {why && (
        <p style={{ color: '#b07830', fontSize: 15, fontStyle: 'italic', lineHeight: 1.5, borderTop: '1px solid rgba(232,168,56,0.1)', paddingTop: 14, marginTop: 16 }}>
          ✦ {why}
        </p>
      )}

      {/* Spotify audio features */}
      {spotify?.features && (
        <div style={{ borderTop: '1px solid rgba(232,168,56,0.08)', paddingTop: 14, marginTop: 14 }}>
          <p style={{ fontSize: 10, color: C.dim, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Spotify Audio Features</p>
          <FeatureBar label="Настроение" value={spotify.features.valence} />
          <FeatureBar label="Энергия" value={spotify.features.energy} />
          <FeatureBar label="Акустичность" value={spotify.features.acousticness} />
          <FeatureBar label="Танцевальность" value={spotify.features.danceability} />
          {spotify.features.tempo && (
            <p style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>🎵 {spotify.features.tempo} BPM</p>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 16, borderTop: '1px solid rgba(232,168,56,0.08)', paddingTop: 16 }}>
        {spotify?.track?.preview_url && <PreviewButton url={spotify.track.preview_url} />}
        <ExtLink href={ugUrl(title, artist)} accent>🎸 UG Tabs</ExtLink>
        <ExtLink href={chordsUrl(title, artist)}>🎵 MyChords</ExtLink>
        <ExtLink href={geniusUrl(title, artist)}>📝 Genius</ExtLink>
        {spotify?.track?.spotify_url && <ExtLink href={spotify.track.spotify_url}>🟢 Spotify</ExtLink>}
      </div>
    </div>
  );
}

// ── Next track card ──────────────────────────────────────────────────────────

function NextCard({ track, onPick }) {
  const [open, setOpen] = useState(false);
  const name   = track.name;
  const artist = typeof track.artist === 'string' ? track.artist : track.artist?.name || '';
  const imgs   = track.image || [];
  const imgUrl = imgs.find(i => i.size === 'medium' || i.size === 'large')?.['#text'];
  const img    = imgUrl && !imgUrl.includes('2a96cbd8b46e442fc41c2b86b821562f') ? imgUrl : null;

  return (
    <div style={{ background: 'rgba(232,168,56,0.03)', border: '1px solid rgba(232,168,56,0.11)', borderRadius: 14, overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', background: 'none', border: 'none', padding: '13px 16px',
        cursor: 'pointer', color: C.text, textAlign: 'left', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        {img
          ? <img src={img} alt={name} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
          : <div style={{ width: 48, height: 48, borderRadius: 8, flexShrink: 0, background: 'rgba(232,168,56,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎵</div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 17 }}>{name}</div>
          <div style={{ color: C.muted, fontSize: 14, marginTop: 2 }}>{artist}</div>
        </div>
        <span style={{ color: C.amber, fontSize: 18, flexShrink: 0, transition: 'transform .2s', transform: open ? 'rotate(90deg)' : 'none' }}>→</span>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid rgba(232,168,56,0.08)', padding: '11px 16px 13px', display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          <ExtLink href={ugUrl(name, artist)} accent>🎸 UG Tabs</ExtLink>
          <ExtLink href={chordsUrl(name, artist)}>🎵 MyChords</ExtLink>
          <ExtLink href={geniusUrl(name, artist)}>📝 Genius</ExtLink>
          {track.url && <ExtLink href={track.url}>🎧 Last.fm</ExtLink>}
          <button onClick={() => onPick(track)} style={{
            marginLeft: 'auto', background: 'rgba(232,168,56,0.12)', border: '1px solid rgba(232,168,56,0.35)',
            borderRadius: 8, padding: '7px 14px', cursor: 'pointer', color: C.amber,
            fontSize: 13, fontFamily: 'inherit', fontWeight: 600,
          }}>Играем →</button>
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [mood, setMood]         = useState(null);
  const [energy, setEnergy]     = useState(55);
  const [wish, setWish]         = useState('');
  const [mainSong, setMainSong] = useState(null);
  const [spotify, setSpotify]   = useState(null);
  const [nextTracks, setNextTracks] = useState([]);
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [loadStep, setLoadStep] = useState('');
  const [error, setError]       = useState(null);

  const energyLabel =
    energy < 25 ? '🌙 Тихо' : energy < 50 ? '🕯️ Спокойно' :
    energy < 75 ? '🔥 Разогреваемся' : '⚡ Полный угар';

  const recommend = useCallback(async (selectedMood, nrg, prevSong = null) => {
    setLoading(true); setMainSong(null); setSpotify(null);
    setNextTracks([]); setError(null);

    try {
      // Step 1: Claude picks seed song
      setLoadStep('Claude подбирает песню…');
      const recRes = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: selectedMood, energy: nrg, history, prevSong, wish }),
      });
      const song = await recRes.json();
      if (song.error) throw new Error(song.error);
      setMainSong(song);

      // Step 2: Last.fm similar tracks (parallel with Spotify)
      setLoadStep('Last.fm подбирает следующие…');
      const [lfmRes, spotifyRes] = await Promise.all([
        fetch(`/api/lastfm?artist=${encodeURIComponent(song.artist)}&track=${encodeURIComponent(song.title)}`),
        fetch(`/api/spotify?title=${encodeURIComponent(song.title)}&artist=${encodeURIComponent(song.artist)}`),
      ]);

      // Last.fm tracks
      const lfmData = await lfmRes.json();
      let tracks = [];
      if (lfmData.similartracks?.track) {
        const t = lfmData.similartracks.track;
        tracks = Array.isArray(t) ? t : [t];
      }
      // Fallback: tag-based
      if (tracks.length < 3) {
        const tagRes = await fetch(`/api/lastfm?tag=${encodeURIComponent(song.tag || 'acoustic')}`);
        const tagData = await tagRes.json();
        const tagTracks = tagData.tracks?.track || [];
        tracks = [...tracks, ...(Array.isArray(tagTracks) ? tagTracks : [tagTracks])];
      }
      // Dedupe
      const seen = new Set([song.title.toLowerCase()]);
      const histSet = new Set(history.map(h => h.toLowerCase()));
      const clean = tracks.filter(t => {
        const k = t.name?.toLowerCase();
        if (!k || seen.has(k) || histSet.has(k)) return false;
        seen.add(k); return true;
      });
      setNextTracks(clean.slice(0, 3));

      // Spotify data
      const spotifyData = await spotifyRes.json();
      if (spotifyData.available && spotifyData.track) setSpotify(spotifyData);

      if (prevSong) setHistory(h => [...h.slice(-7), prevSong.title]);

    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false); setLoadStep('');
    }
  }, [history]);

  const handleMood    = m => { setMood(m); recommend(m, energy); };
  const handleWishKey = e => { if (e.key === 'Enter' && mood) recommend(mood, energy); };
  const handlePick    = t => {
    const picked = { title: t.name, artist: typeof t.artist === 'string' ? t.artist : t.artist?.name };
    recommend(mood, energy, mainSong);
  };
  const handleShuffle = () => recommend(mood, energy, mainSong);
  const handleBack    = () => { setMainSong(null); setMood(null); setNextTracks([]); };

  return (
    <>
      <Head>
        <title>Что сыграть? 🎸</title>
        <meta name="description" content="Умный сетлист для гитариста" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #0d0a06; font-family: 'Cormorant Garamond', serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(232,168,56,.25); border-radius: 2px; }
        input[type=range] { -webkit-appearance: none; height: 3px; border-radius: 2px; outline: none; cursor: pointer; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #e8a838; box-shadow: 0 0 8px rgba(232,168,56,.5); cursor: pointer; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.09); } }
        .mood-btn { transition: all .2s !important; }
        .mood-btn:hover { background: rgba(232,168,56,.14) !important; border-color: rgba(232,168,56,.45) !important; transform: translateY(-2px) !important; }
        .fade { animation: fadeUp .35s ease; }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 30% 10%,#2a1a08,#130d04 55%,#0a0804)', color: C.text }}>
        <div style={{ position: 'fixed', top: -80, left: '50%', transform: 'translateX(-50%)', width: 700, height: 300, background: 'radial-gradient(ellipse,rgba(232,168,56,.06),transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 640, margin: '0 auto', padding: '36px 20px 70px', position: 'relative' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ fontSize: 38, marginBottom: 10 }}>🎸</div>
            <h1 style={{ fontSize: 46, fontWeight: 600, letterSpacing: '-.02em', background: 'linear-gradient(140deg,#f5ead6 30%,#e8a838)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Что сыграть?
            </h1>
            <p style={{ color: C.dim, fontSize: 15, marginTop: 7, fontStyle: 'italic' }}>умный сетлист для гитариста</p>
          </div>

          {/* Mood selection */}
          {!mainSong && !loading && (
            <div className="fade">
              <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.dim, marginBottom: 14 }}>
                Какое настроение у компании?
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 28 }}>
                {MOODS.map(m => (
                  <button key={m.id} className="mood-btn" onClick={() => handleMood(m)} style={{
                    background: 'rgba(232,168,56,.05)', border: '1px solid rgba(232,168,56,.17)',
                    borderRadius: 14, padding: '18px 10px', cursor: 'pointer',
                    color: C.text, textAlign: 'center', fontFamily: 'inherit',
                  }}>
                    <div style={{ fontSize: 30, marginBottom: 8 }}>{m.emoji}</div>
                    <div style={{ fontSize: 17, fontWeight: 600 }}>{m.label}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{m.desc}</div>
                  </button>
                ))}
              </div>

              <div style={{ background: 'rgba(232,168,56,.04)', border: '1px solid rgba(232,168,56,.12)', borderRadius: 12, padding: '18px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 13 }}>
                  <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.dim }}>Энергия</span>
                  <span style={{ fontSize: 15, color: C.amber, fontStyle: 'italic' }}>{energyLabel}</span>
                </div>
                <input type="range" min="0" max="100" value={energy}
                  onChange={e => setEnergy(Number(e.target.value))}
                  style={{ width: '100%', background: `linear-gradient(to right,${C.amber} ${energy}%,rgba(232,168,56,.18) ${energy}%)` }} />
              </div>

              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.dim, marginBottom: 10 }}>
                  Пожелание — необязательно
                </p>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={wish}
                    onChange={e => setWish(e.target.value)}
                    onKeyDown={handleWishKey}
                    placeholder='например: "что-нибудь из Цоя" или "хочу Меладзе"'
                    style={{
                      width: '100%', background: 'rgba(232,168,56,.04)',
                      border: '1px solid rgba(232,168,56,.18)', borderRadius: 10,
                      padding: '12px 16px', color: C.text, fontFamily: 'inherit',
                      fontSize: 15, outline: 'none',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(232,168,56,.45)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(232,168,56,.18)'}
                  />
                  {wish && (
                    <button onClick={() => setWish('')} style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 16,
                    }}>✕</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="fade" style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: 50, animation: 'pulse 1.2s ease-in-out infinite' }}>🎸</div>
              <p style={{ color: C.muted, marginTop: 18, fontSize: 19, fontStyle: 'italic' }}>{loadStep}</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="fade" style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ color: '#c06030', marginBottom: 14 }}>{error}</p>
              <button onClick={handleShuffle} style={{ background: 'rgba(232,168,56,.1)', border: '1px solid rgba(232,168,56,.3)', borderRadius: 8, padding: '10px 22px', color: C.amber, cursor: 'pointer', fontFamily: 'inherit', fontSize: 16 }}>
                Попробовать снова
              </button>
            </div>
          )}

          {/* Results */}
          {mainSong && !loading && (
            <div className="fade">
              <MainCard song={mainSong} spotify={spotify} />

              <div style={{ margin: '14px 0 10px', position: 'relative' }}>
                <input
                  type="text"
                  value={wish}
                  onChange={e => setWish(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleShuffle()}
                  placeholder='уточни пожелание: "хочу Цоя" или "что-то потише"'
                  style={{
                    width: '100%', background: 'rgba(232,168,56,.04)',
                    border: '1px solid rgba(232,168,56,.18)', borderRadius: 10,
                    padding: '11px 36px 11px 14px', color: C.text, fontFamily: 'inherit',
                    fontSize: 15, outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(232,168,56,.45)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(232,168,56,.18)'}
                />
                {wish && (
                  <button onClick={() => setWish('')} style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 16,
                  }}>✕</button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, margin: '0 0 22px' }}>
                <button onClick={handleShuffle} style={{ flex: 1, background: 'rgba(232,168,56,.1)', border: '1px solid rgba(232,168,56,.28)', borderRadius: 10, padding: 13, color: C.amber, cursor: 'pointer', fontSize: 16, fontFamily: 'inherit' }}>
                  🔀 Другую
                </button>
                <button onClick={handleBack} style={{ flex: 1, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: 13, color: C.muted, cursor: 'pointer', fontSize: 16, fontFamily: 'inherit' }}>
                  ← Настроение
                </button>
              </div>

              {history.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 20 }}>
                  <span style={{ fontSize: 11, color: C.dim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Сыграли:</span>
                  {history.map((t, i) => <span key={i} style={{ fontSize: 12, color: C.muted, background: 'rgba(232,168,56,.06)', borderRadius: 6, padding: '2px 8px' }}>{t}</span>)}
                </div>
              )}

              {nextTracks.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, letterSpacing: '0.13em', textTransform: 'uppercase', color: C.dim, marginBottom: 10 }}>
                    Сыграть следующим — по Last.fm
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {nextTracks.map((t, i) => <NextCard key={i} track={t} onPick={handlePick} />)}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
