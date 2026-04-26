import React, { useState, useCallback } from 'react'
import WorldScene from './components/scene/WorldScene'
import AmbientAudio from './components/AmbientAudio'
import { BEERS } from './data/beers'

/**
 * App — the top-level component.
 * The 3D world IS the experience. The HUD is a whisper, not a shout.
 */
export default function App() {
  const [selectedBeer, setSelectedBeer] = useState(null)
  const [showSplash, setShowSplash] = useState(true)
  const [flyTarget, setFlyTarget] = useState(null)
  const [audioPlaying, setAudioPlaying] = useState(false)

  const selected = BEERS.find((b) => b.id === selectedBeer)

  const handleSelectBeer = useCallback((id) => {
    if (id) {
      const beer = BEERS.find((b) => b.id === id)
      if (beer) {
        setSelectedBeer(id)
        setFlyTarget([beer.x, 0, beer.z])
      }
    } else {
      setSelectedBeer(null)
      setFlyTarget(null) // fly back to overview
    }
  }, [])

  const handleClose = useCallback(() => {
    setSelectedBeer(null)
    setFlyTarget(null)
  }, [])

  const handleEnter = useCallback(() => {
    setShowSplash(false)
    setAudioPlaying(true)
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* ─── 3D WORLD ─── */}
      <WorldScene
        selectedBeer={selectedBeer}
        onSelectBeer={handleSelectBeer}
        flyTarget={flyTarget}
      />

      {/* ─── AMBIENT AUDIO ─── */}
      <AmbientAudio playing={audioPlaying} />

      {/* ─── WELCOME SPLASH ─── */}
      {showSplash && (
        <div style={styles.splashOverlay}>
          <div style={styles.splashContent}>
            <div style={styles.splashLogo}>❄</div>
            <h1 style={styles.splashTitle}>IGLOO</h1>
            <p style={styles.splashSub}>craft beers · frozen world</p>
            <p style={styles.splashDesc}>
              Step into a frozen craft wonderland.<br />
              Six beers. Six worlds. Your adventure.
            </p>
            <button style={styles.enterBtn} onClick={handleEnter}>
              Enter the World
            </button>
            <p style={styles.splashHint}>
              drag to orbit · scroll to zoom · click to explore
            </p>
          </div>
        </div>
      )}

      {/* ─── HUD ─── */}
      {!showSplash && (
        <>
          {/* Title — always visible, top-left, minimal */}
          <div style={styles.titleBar}>
            <span style={styles.titleText}>IGLOO</span>
            <span style={styles.titleSub}>frozen craft</span>
          </div>

          {/* Hint — shown briefly at bottom */}
          <div style={styles.hint}>
            click a cottage to explore · drag to orbit · scroll to zoom
          </div>

          {/* Beer detail panel — slides in when selected */}
          {selected && (
            <div style={styles.panel}>
              <button style={styles.closeBtn} onClick={handleClose}>✕</button>
              <h2 style={styles.beerName}>{selected.name}</h2>
              <p style={styles.beerStyle}>{selected.style}</p>
              <p style={styles.beerDesc}>{selected.description}</p>
              <div style={styles.tagRow}>
                {selected.tags.map((tag) => (
                  <span key={tag} style={styles.tag}>{tag}</span>
                ))}
              </div>
              <div style={{ ...styles.accentLine, background: `linear-gradient(90deg, ${selected.glow}, transparent)` }} />
              <p style={styles.beerMood}>{selected.mood}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const styles = {
  splashOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(ellipse at center, rgba(13, 15, 30, 0.85) 0%, rgba(13, 15, 30, 0.97) 100%)',
    zIndex: 100,
    animation: 'fadeIn 0.8s ease-out',
  },
  splashContent: {
    textAlign: 'center',
    pointerEvents: 'auto',
  },
  splashLogo: {
    fontSize: 64,
    marginBottom: 8,
    filter: 'drop-shadow(0 0 20px rgba(100, 180, 255, 0.4))',
  },
  splashTitle: {
    fontFamily: "'Caveat', cursive",
    fontSize: 72,
    fontWeight: 700,
    color: 'rgba(255, 255, 255, 0.92)',
    margin: '0 0 4px 0',
    letterSpacing: '0.2em',
    textShadow: '0 0 40px rgba(100, 160, 255, 0.3), 0 0 80px rgba(100, 160, 255, 0.1)',
  },
  splashSub: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: 14,
    fontWeight: 300,
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: '0.4em',
    textTransform: 'uppercase',
    margin: '0 0 32px 0',
  },
  splashDesc: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: 16,
    fontWeight: 300,
    color: 'rgba(255, 255, 255, 0.55)',
    lineHeight: 1.8,
    margin: '0 0 40px 0',
  },
  enterBtn: {
    fontFamily: "'Caveat', cursive",
    fontSize: 22,
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.9)',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: 40,
    padding: '14px 48px',
    cursor: 'pointer',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    letterSpacing: '0.05em',
  },
  splashHint: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: 11,
    fontWeight: 300,
    color: 'rgba(255, 255, 255, 0.2)',
    letterSpacing: '0.08em',
    marginTop: 40,
    whiteSpace: 'nowrap',
  },
  titleBar: {
    position: 'absolute',
    top: 20,
    left: 20,
    display: 'flex',
    flexDirection: 'column',
    pointerEvents: 'none',
    zIndex: 10,
  },
  titleText: {
    fontFamily: "'Caveat', cursive",
    fontSize: 32,
    fontWeight: 700,
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: '0.15em',
    textShadow: '0 0 20px rgba(100, 160, 255, 0.3)',
  },
  titleSub: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: 11,
    fontWeight: 300,
    color: 'rgba(255, 255, 255, 0.45)',
    letterSpacing: '0.3em',
    textTransform: 'uppercase',
    marginTop: -2,
    marginLeft: 2,
  },
  hint: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    fontFamily: "'Outfit', sans-serif",
    fontSize: 12,
    fontWeight: 300,
    color: 'rgba(255, 255, 255, 0.3)',
    letterSpacing: '0.08em',
    pointerEvents: 'none',
    zIndex: 10,
    whiteSpace: 'nowrap',
  },
  panel: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 320,
    maxWidth: 'calc(100vw - 48px)',
    background: 'rgba(12, 14, 26, 0.88)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: 16,
    padding: '28px 24px',
    zIndex: 20,
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 8px 40px rgba(0, 0, 0, 0.5)',
    animation: 'slideUp 0.4s ease-out',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 16,
    background: 'none',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 18,
    cursor: 'pointer',
    padding: '4px 8px',
  },
  beerName: {
    fontFamily: "'Caveat', cursive",
    fontSize: 28,
    fontWeight: 700,
    color: '#fff',
    margin: '0 0 4px 0',
  },
  beerStyle: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: 13,
    fontWeight: 400,
    color: 'rgba(255, 255, 255, 0.5)',
    margin: '0 0 12px 0',
    letterSpacing: '0.05em',
  },
  beerDesc: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: 15,
    fontWeight: 300,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 1.6,
    margin: '0 0 16px 0',
  },
  tagRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tag: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: 11,
    fontWeight: 400,
    color: 'rgba(255, 255, 255, 0.6)',
    background: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: '4px 12px',
    letterSpacing: '0.04em',
  },
  accentLine: {
    width: 40,
    height: 2,
    borderRadius: 1,
    marginBottom: 12,
  },
  beerMood: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: 12,
    fontWeight: 300,
    color: 'rgba(255, 255, 255, 0.35)',
    fontStyle: 'italic',
    margin: 0,
    letterSpacing: '0.06em',
  },
}
