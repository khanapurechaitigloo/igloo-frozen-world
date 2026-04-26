import React, { useState, useCallback } from 'react'
import WorldScene from './components/scene/WorldScene'
import { BEERS } from './data/beers'

/**
 * App — the top-level component.
 * The 3D world IS the experience. The HUD is a whisper, not a shout.
 */
export default function App() {
  const [selectedBeer, setSelectedBeer] = useState(null)

  const selected = BEERS.find((b) => b.id === selectedBeer)

  const handleSelectBeer = useCallback((id) => {
    setSelectedBeer(id)
  }, [])

  const handleClose = useCallback(() => {
    setSelectedBeer(null)
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* ─── 3D WORLD ─── */}
      <WorldScene
        selectedBeer={selectedBeer}
        onSelectBeer={handleSelectBeer}
      />

      {/* ─── HUD ─── */}
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
          <div style={styles.accentLine} />
          <p style={styles.beerMood}>{selected.mood}</p>
        </div>
      )}
    </div>
  )
}

const styles = {
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
    background: 'linear-gradient(90deg, rgba(240, 168, 48, 0.6), transparent)',
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
