import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * BeerCottage — a unique little building for each beer.
 * Shape varies: dome, cave, terrace, crystal, bonfire, cellar.
 * Each has warm window glow and character.
 */
export default function BeerCottage({ beer, onClick, selected }) {
  const groupRef = useRef()
  const glowRef = useRef()

  useFrame((state) => {
    if (!groupRef.current) return
    // Gentle hover bob
    const t = state.clock.elapsedTime
    groupRef.current.position.y = Math.sin(t * 0.8 + beer.x * 2) * 0.05
    // Pulse glow
    if (glowRef.current) {
      glowRef.current.material.emissiveIntensity =
        0.5 + Math.sin(t * 1.5 + beer.z) * 0.2
    }
  })

  const handleClick = (e) => {
    e.stopPropagation()
    onClick?.(beer.id)
  }

  return (
    <group
      ref={groupRef}
      position={[beer.x, 0, beer.z]}
      onClick={handleClick}
    >
      {/* Building body */}
      <BuildingShape beer={beer} glowRef={glowRef} />

      {/* Window glow */}
      <pointLight
        position={[0, 1.0, 0.8]}
        color={beer.glow}
        intensity={selected ? 4 : 1.5}
        distance={selected ? 8 : 4}
      />

      {/* Small sign post */}
      <SignPost beer={beer} />

      {/* Snow patches on building */}
      <mesh position={[0, getBuildingHeight(beer.shape) - 0.05, 0]}>
        <sphereGeometry args={[getBuildingWidth(beer.shape) * 0.5, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.2]} />
        <meshStandardMaterial color="#f8f4f2" roughness={0.9} metalness={0} />
      </mesh>

      {/* Selection ring on ground */}
      {selected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[getBuildingWidth(beer.shape) + 0.3, getBuildingWidth(beer.shape) + 0.5, 32]} />
          <meshStandardMaterial
            color={beer.glow}
            emissive={beer.glow}
            emissiveIntensity={0.8}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}
    </group>
  )
}

function BuildingShape({ beer, glowRef }) {
  const h = getBuildingHeight(beer.shape)
  const w = getBuildingWidth(beer.shape)

  switch (beer.shape) {
    case 'dome':
      return (
        <group>
          <mesh position={[0, h * 0.5, 0]} castShadow>
            <sphereGeometry args={[w, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <meshStandardMaterial color={beer.accent} roughness={0.75} metalness={0} />
          </mesh>
          {/* Window */}
          <mesh ref={glowRef} position={[0, h * 0.4, w * 0.9]}>
            <circleGeometry args={[0.2, 8]} />
            <meshStandardMaterial color={beer.glow} emissive={beer.glow} emissiveIntensity={0.5} />
          </mesh>
        </group>
      )

    case 'cave':
      return (
        <group>
          {/* Rocky arch */}
          <mesh position={[0, h * 0.4, 0]} castShadow>
            <boxGeometry args={[w * 2, h, w * 1.2]} />
            <meshStandardMaterial color="#2a2a3a" roughness={0.9} metalness={0.1} flatShading />
          </mesh>
          {/* Arch cutout glow */}
          <mesh ref={glowRef} position={[0, h * 0.35, w * 0.5]}>
            <boxGeometry args={[w * 0.8, h * 0.6, 0.1]} />
            <meshStandardMaterial color={beer.glow} emissive={beer.glow} emissiveIntensity={0.4} />
          </mesh>
          {/* Icicles */}
          {[...Array(5)].map((_, i) => (
            <mesh key={i} position={[(i - 2) * 0.35, h * 0.8, w * 0.5]} castShadow>
              <coneGeometry args={[0.03, 0.2 + Math.random() * 0.15, 4]} />
              <meshStandardMaterial color="#c8e0f0" roughness={0.3} metalness={0.2} transparent opacity={0.8} />
            </mesh>
          ))}
        </group>
      )

    case 'terrace':
      return (
        <group>
          {/* Stepped platforms */}
          <mesh position={[0, 0.15, 0]} castShadow>
            <boxGeometry args={[w * 2.2, 0.3, w * 1.8]} />
            <meshStandardMaterial color="#d4a574" roughness={0.8} metalness={0} />
          </mesh>
          <mesh position={[0, 0.45, -0.2]} castShadow>
            <boxGeometry args={[w * 1.6, 0.3, w * 1.2]} />
            <meshStandardMaterial color="#c4955a" roughness={0.8} metalness={0} />
          </mesh>
          {/* Small roof */}
          <mesh position={[0, 0.9, -0.2]} castShadow>
            <boxGeometry args={[w * 1.8, 0.1, w * 1.4]} />
            <meshStandardMaterial color={beer.accent} roughness={0.7} metalness={0} />
          </mesh>
          <mesh ref={glowRef} position={[0, 0.3, w * 0.85]}>
            <planeGeometry args={[0.5, 0.3]} />
            <meshStandardMaterial color={beer.glow} emissive={beer.glow} emissiveIntensity={0.5} />
          </mesh>
        </group>
      )

    case 'crystal':
      return (
        <group>
          {/* Crystal clusters */}
          {[...Array(7)].map((_, i) => {
            const angle = (i / 7) * Math.PI * 2
            const r = 0.3 + (i % 2) * 0.2
            const ch = 0.5 + Math.random() * 0.8
            return (
              <mesh
                key={i}
                position={[Math.cos(angle) * r, ch * 0.5, Math.sin(angle) * r]}
                rotation={[
                  (Math.random() - 0.5) * 0.3,
                  angle,
                  (Math.random() - 0.5) * 0.2
                ]}
                castShadow
              >
                <coneGeometry args={[0.08 + Math.random() * 0.06, ch, 5]} />
                <meshStandardMaterial
                  color="#a8d8ea"
                  roughness={0.2}
                  metalness={0.3}
                  transparent
                  opacity={0.7}
                />
              </mesh>
            )
          })}
          <mesh ref={glowRef} position={[0, 0.3, 0]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshStandardMaterial color={beer.glow} emissive={beer.glow} emissiveIntensity={0.8} transparent opacity={0.6} />
          </mesh>
        </group>
      )

    case 'bonfire':
      return (
        <group>
          {/* Stone circle */}
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2
            return (
              <mesh key={i} position={[Math.cos(angle) * 0.5, 0.12, Math.sin(angle) * 0.5]} castShadow>
                <sphereGeometry args={[0.12, 6, 4]} />
                <meshStandardMaterial color="#5a5048" roughness={0.95} metalness={0} flatShading />
              </mesh>
            )
          })}
          {/* Log pile */}
          <mesh position={[0.2, 0.15, 0.1]} rotation={[0, 0.5, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 0.5, 6]} />
            <meshStandardMaterial color="#4a3520" roughness={0.9} metalness={0} />
          </mesh>
          <mesh position={[-0.1, 0.12, -0.15]} rotation={[0, -0.3, Math.PI / 2 + 0.2]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.4, 6]} />
            <meshStandardMaterial color="#3a2510" roughness={0.9} metalness={0} />
          </mesh>
          {/* Fire glow */}
          <mesh ref={glowRef} position={[0, 0.3, 0]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshStandardMaterial color={beer.glow} emissive={beer.glow} emissiveIntensity={1.0} />
          </mesh>
          <pointLight position={[0, 0.5, 0]} color="#ff6020" intensity={2} distance={5} />
        </group>
      )

    case 'cellar':
      return (
        <group>
          {/* Stone cellar entrance */}
          <mesh position={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[w * 2, 0.6, w * 1.5]} />
            <meshStandardMaterial color="#3a3a4a" roughness={0.92} metalness={0.05} flatShading />
          </mesh>
          {/* Steps down */}
          <mesh position={[0, 0.0, w * 0.6]}>
            <boxGeometry args={[0.6, 0.15, 0.4]} />
            <meshStandardMaterial color="#2a2a3a" roughness={0.9} metalness={0} />
          </mesh>
          {/* Barrel peeking out */}
          <mesh position={[0.6, 0.2, 0.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.15, 0.15, 0.35, 10]} />
            <meshStandardMaterial color="#5a3a20" roughness={0.85} metalness={0} />
          </mesh>
          <mesh ref={glowRef} position={[0, 0.3, w * 0.6]}>
            <planeGeometry args={[0.5, 0.5]} />
            <meshStandardMaterial color={beer.glow} emissive={beer.glow} emissiveIntensity={0.4} transparent opacity={0.5} />
          </mesh>
        </group>
      )

    default:
      return (
        <mesh position={[0, h * 0.5, 0]} castShadow>
          <boxGeometry args={[w, h, w]} />
          <meshStandardMaterial color={beer.accent} roughness={0.8} metalness={0} />
        </mesh>
      )
  }
}

function SignPost({ beer }) {
  return (
    <group position={[getBuildingWidth(beer.shape) + 0.3, 0, 0.2]}>
      {/* Post */}
      <mesh castShadow>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 6]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.85} metalness={0} />
      </mesh>
      {/* Sign board */}
      <mesh position={[0.2, 0.5, 0]} rotation={[0, 0, -0.1]} castShadow>
        <boxGeometry args={[0.6, 0.25, 0.03]} />
        <meshStandardMaterial color="#d4b896" roughness={0.8} metalness={0} />
      </mesh>
    </group>
  )
}

function getBuildingHeight(shape) {
  switch (shape) {
    case 'dome': return 1.5
    case 'cave': return 1.8
    case 'terrace': return 0.8
    case 'crystal': return 1.2
    case 'bonfire': return 0.6
    case 'cellar': return 0.5
    default: return 1.0
  }
}

function getBuildingWidth(shape) {
  switch (shape) {
    case 'dome': return 1.0
    case 'cave': return 0.8
    case 'terrace': return 1.2
    case 'crystal': return 0.6
    case 'bonfire': return 0.7
    case 'cellar': return 0.7
    default: return 0.8
  }
}
