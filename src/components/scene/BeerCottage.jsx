import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

/**
 * BeerCottage — proper A-frame cottages that actually look like buildings.
 * Each beer gets a unique wood-and-roof palette but shares the cozy cottage DNA.
 * Walls, a pitched roof, windows with warm glow, chimney, snow on top.
 */

// Unique cottage palettes per beer
const COTTAGE_STYLES = {
  'wit-and-wisdom': {
    wallColor: '#c4955a',
    roofColor: '#8b5e3c',
    trimColor: '#f5e6c8',
    windowColor: '#f0a830',
    roofPitch: 0.9,
    width: 1.8,
    depth: 1.4,
    wallHeight: 0.9,
  },
  'deep-ocean': {
    wallColor: '#3a3a50',
    roofColor: '#2a2a3a',
    trimColor: '#4a5a7a',
    windowColor: '#2d4a7a',
    roofPitch: 1.2,
    width: 1.6,
    depth: 1.6,
    wallHeight: 0.8,
  },
  'arctic-dawn': {
    wallColor: '#d4a574',
    roofColor: '#c47530',
    trimColor: '#ffd6a5',
    windowColor: '#ff8c42',
    roofPitch: 1.0,
    width: 2.0,
    depth: 1.6,
    wallHeight: 1.0,
  },
  'frost-bite': {
    wallColor: '#b8c8d8',
    roofColor: '#7090a8',
    trimColor: '#d8eaf4',
    windowColor: '#55c5f5',
    roofPitch: 1.3,
    width: 1.6,
    depth: 1.4,
    wallHeight: 0.7,
  },
  'tundra-blaze': {
    wallColor: '#6b4a30',
    roofColor: '#4a2a18',
    trimColor: '#c1694f',
    windowColor: '#e84a23',
    roofPitch: 0.8,
    width: 2.2,
    depth: 1.8,
    wallHeight: 1.0,
  },
  'polar-night': {
    wallColor: '#4a3a5a',
    roofColor: '#3d2c5e',
    trimColor: '#6a5080',
    windowColor: '#9b59b6',
    roofPitch: 1.1,
    width: 1.8,
    depth: 1.6,
    wallHeight: 0.6,
  },
}

export default function BeerCottage({ beer, onClick, selected }) {
  const groupRef = useRef()
  const glowRef = useRef()
  const style = COTTAGE_STYLES[beer.id] || COTTAGE_STYLES['wit-and-wisdom']

  useFrame((state) => {
    if (!groupRef.current) return
    // Very subtle breathing — not a bob
    const t = state.clock.elapsedTime
    groupRef.current.position.y = Math.sin(t * 0.4 + beer.x) * 0.015
    // Pulse window glow
    if (glowRef.current) {
      glowRef.current.material.emissiveIntensity =
        0.6 + Math.sin(t * 1.2 + beer.z) * 0.3
    }
  })

  const handleClick = (e) => {
    e.stopPropagation()
    onClick?.(beer.id)
  }

  const { wallColor, roofColor, trimColor, windowColor, roofPitch, width, depth, wallHeight } = style
  const roofOverhang = 0.15

  return (
    <group ref={groupRef} position={[beer.x, 0, beer.z]} onClick={handleClick}>
      {/* ── FOUNDATION ── */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.1, 0.1, depth + 0.1]} />
        <meshStandardMaterial color="#5a5048" roughness={0.95} metalness={0} flatShading />
      </mesh>

      {/* ── WALLS ── */}
      <mesh position={[0, wallHeight * 0.5 + 0.1, 0]} castShadow>
        <boxGeometry args={[width, wallHeight, depth]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} metalness={0} flatShading />
      </mesh>

      {/* ── TRIM BEAMS (horizontal wooden beams) ── */}
      <mesh position={[0, wallHeight + 0.1, 0]}>
        <boxGeometry args={[width + 0.06, 0.06, depth + 0.06]} />
        <meshStandardMaterial color={trimColor} roughness={0.8} metalness={0} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[width + 0.04, 0.04, depth + 0.04]} />
        <meshStandardMaterial color={trimColor} roughness={0.8} metalness={0} />
      </mesh>

      {/* ── A-FRAME ROOF ── */}
      <group position={[0, wallHeight + 0.1, 0]}>
        {/* Left slope */}
        <mesh position={[-width * 0.25, roofPitch * 0.3, 0]} rotation={[0, 0, -Math.atan2(roofPitch, width * 0.5)]} castShadow>
          <boxGeometry args={[Math.sqrt(roofPitch * roofPitch + (width * 0.5) * (width * 0.5)) + 0.05, 0.08, depth + roofOverhang * 2]} />
          <meshStandardMaterial color={roofColor} roughness={0.75} metalness={0} flatShading />
        </mesh>
        {/* Right slope */}
        <mesh position={[width * 0.25, roofPitch * 0.3, 0]} rotation={[0, 0, Math.atan2(roofPitch, width * 0.5)]} castShadow>
          <boxGeometry args={[Math.sqrt(roofPitch * roofPitch + (width * 0.5) * (width * 0.5)) + 0.05, 0.08, depth + roofOverhang * 2]} />
          <meshStandardMaterial color={roofColor} roughness={0.75} metalness={0} flatShading />
        </mesh>
        {/* Ridge cap */}
        <mesh position={[0, roofPitch * 0.6, 0]}>
          <boxGeometry args={[0.08, 0.06, depth + roofOverhang * 2 + 0.05]} />
          <meshStandardMaterial color={trimColor} roughness={0.7} metalness={0} />
        </mesh>
      </group>

      {/* ── SNOW ON ROOF ── */}
      <group position={[0, wallHeight + 0.1 + roofPitch * 0.55, 0]}>
        <mesh position={[0, 0.06, 0]}>
          <boxGeometry args={[width * 0.3, 0.08, depth * 0.6]} />
          <meshStandardMaterial color="#f5f0ef" roughness={0.95} metalness={0} />
        </mesh>
        <mesh position={[-width * 0.15, -0.05, 0]}>
          <boxGeometry args={[width * 0.25, 0.06, depth * 0.4]} />
          <meshStandardMaterial color="#f0ebe8" roughness={0.95} metalness={0} />
        </mesh>
      </group>

      {/* ── DOOR ── */}
      <mesh position={[0, 0.35, depth * 0.5 + 0.01]}>
        <boxGeometry args={[0.3, 0.6, 0.03]} />
        <meshStandardMaterial color="#3a2510" roughness={0.9} metalness={0} />
      </mesh>
      {/* Door frame */}
      <mesh position={[0, 0.35, depth * 0.5 + 0.02]}>
        <boxGeometry args={[0.36, 0.66, 0.01]} />
        <meshStandardMaterial color={trimColor} roughness={0.8} metalness={0} />
      </mesh>
      {/* Door knob */}
      <mesh position={[0.1, 0.35, depth * 0.5 + 0.03]}>
        <sphereGeometry args={[0.015, 6, 6]} />
        <meshStandardMaterial color="#c0a030" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* ── WINDOWS (front face) ── */}
      <WindowPane position={[-width * 0.3, 0.55, depth * 0.5 + 0.01]} windowColor={windowColor} glowRef={glowRef} />
      <WindowPane position={[width * 0.3, 0.55, depth * 0.5 + 0.01]} windowColor={windowColor} />

      {/* ── WINDOWS (side faces) ── */}
      <WindowPane position={[width * 0.5 + 0.01, 0.55, 0.3]} rotation={[0, Math.PI / 2, 0]} windowColor={windowColor} />
      <WindowPane position={[-width * 0.5 - 0.01, 0.55, -0.3]} rotation={[0, Math.PI / 2, 0]} windowColor={windowColor} />

      {/* ── CHIMNEY ── */}
      <mesh position={[width * 0.3, wallHeight + roofPitch * 0.5 + 0.3, -depth * 0.2]} castShadow>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
        <meshStandardMaterial color="#6b5040" roughness={0.9} metalness={0} flatShading />
      </mesh>
      {/* Chimney rim */}
      <mesh position={[width * 0.3, wallHeight + roofPitch * 0.5 + 0.58, -depth * 0.2]}>
        <boxGeometry args={[0.2, 0.05, 0.2]} />
        <meshStandardMaterial color="#5a4535" roughness={0.9} metalness={0} />
      </mesh>

      {/* ── WARM INTERIOR GLOW ── */}
      <pointLight
        position={[0, wallHeight * 0.5, depth * 0.3]}
        color={windowColor}
        intensity={selected ? 5 : 2}
        distance={selected ? 10 : 5}
      />

      {/* ── SNOW PILE at base ── */}
      <mesh position={[width * 0.5 + 0.15, 0.08, 0]}>
        <sphereGeometry args={[0.15, 6, 4]} />
        <meshStandardMaterial color="#f0ebe8" roughness={0.95} metalness={0} />
      </mesh>
      <mesh position={[-width * 0.5 - 0.1, 0.06, 0.3]}>
        <sphereGeometry args={[0.12, 6, 4]} />
        <meshStandardMaterial color="#eee8e4" roughness={0.95} metalness={0} />
      </mesh>

      {/* ── SIGN POST ── */}
      <SignPost beer={beer} width={width} />

      {/* ── SELECTION RING ── */}
      {selected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[width * 0.7, width * 0.8, 32]} />
          <meshStandardMaterial
            color={windowColor}
            emissive={windowColor}
            emissiveIntensity={1.0}
            transparent
            opacity={0.5}
          />
        </mesh>
      )}
    </group>
  )
}

function WindowPane({ position = [0, 0, 0], rotation = [0, 0, 0], windowColor, glowRef }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Window frame */}
      <mesh>
        <boxGeometry args={[0.22, 0.22, 0.02]} />
        <meshStandardMaterial color="#3a3028" roughness={0.85} metalness={0} />
      </mesh>
      {/* Glowing pane */}
      <mesh ref={glowRef}>
        <boxGeometry args={[0.18, 0.18, 0.025]} />
        <meshStandardMaterial
          color={windowColor}
          emissive={windowColor}
          emissiveIntensity={0.7}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* Cross divider */}
      <mesh position={[0, 0, 0.015]}>
        <boxGeometry args={[0.19, 0.015, 0.005]} />
        <meshStandardMaterial color="#3a3028" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0, 0.015]}>
        <boxGeometry args={[0.015, 0.19, 0.005]} />
        <meshStandardMaterial color="#3a3028" roughness={0.85} />
      </mesh>
    </group>
  )
}

function SignPost({ beer, width }) {
  return (
    <group position={[width * 0.5 + 0.3, 0, 0.3]}>
      {/* Post */}
      <mesh castShadow>
        <cylinderGeometry args={[0.025, 0.03, 1.0, 6]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.85} metalness={0} />
      </mesh>
      {/* Sign board — slightly weathered, hand-painted feel */}
      <mesh position={[0.2, 0.5, 0]} rotation={[0, 0, -0.08]} castShadow>
        <boxGeometry args={[0.55, 0.22, 0.04]} />
        <meshStandardMaterial color="#d4b896" roughness={0.85} metalness={0} />
      </mesh>
      {/* Sign accent stripe */}
      <mesh position={[0.2, 0.5, 0.025]} rotation={[0, 0, -0.08]}>
        <boxGeometry args={[0.5, 0.03, 0.005]} />
        <meshStandardMaterial color={beer.glow} emissive={beer.glow} emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}
