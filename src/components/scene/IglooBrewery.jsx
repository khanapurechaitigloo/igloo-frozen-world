import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Main Igloo Brewery — a large, slightly irregular dome with warm doorway glow.
 * Uses icosahedron geometry for an organic, not-perfectly-round feel.
 */
export default function IglooBrewery({ position = [0, 0, 0] }) {
  const glowRef = useRef()

  useFrame((state) => {
    if (glowRef.current) {
      glowRef.current.material.emissiveIntensity =
        0.8 + Math.sin(state.clock.elapsedTime * 2) * 0.15
    }
  })

  return (
    <group position={position}>
      {/* Main dome — icosahedron for organic lumpy shape */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <icosahedronGeometry args={[2.5, 2]} />
        <meshStandardMaterial
          color="#e8e0d8"
          roughness={0.8}
          metalness={0.0}
          flatShading
        />
      </mesh>

      {/* Snow cap on top */}
      <mesh position={[0, 3.4, 0]}>
        <sphereGeometry args={[1.2, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.3]} />
        <meshStandardMaterial color="#f5f0ef" roughness={0.9} metalness={0} />
      </mesh>

      {/* Door frame — rectangular opening with warm glow */}
      <mesh ref={glowRef} position={[0, 0.8, 2.3]} rotation={[0, 0, 0]}>
        <boxGeometry args={[1.0, 1.4, 0.15]} />
        <meshStandardMaterial
          color="#3a2510"
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Door glow — the warm inviting light */}
      <pointLight position={[0, 1.0, 2.8]} color="#f0a040" intensity={3} distance={6} />

      {/* Interior warmth through doorway */}
      <mesh position={[0, 0.8, 2.25]}>
        <boxGeometry args={[0.7, 1.1, 0.05]} />
        <meshStandardMaterial
          color="#f0a040"
          emissive="#f0a040"
          emissiveIntensity={0.6}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Small chimney */}
      <mesh position={[1.0, 3.2, -0.5]} castShadow>
        <cylinderGeometry args={[0.15, 0.18, 0.8, 8]} />
        <meshStandardMaterial color="#6b5b4f" roughness={0.85} metalness={0} />
      </mesh>

      {/* Smoke particles (just a few rising spheres) */}
      <SmokeParticles position={[1.0, 3.8, -0.5]} />
    </group>
  )
}

function SmokeParticles({ position }) {
  const groupRef = useRef()
  const particles = useMemo(() =>
    Array.from({ length: 5 }, (_, i) => ({
      offset: i * 0.4,
      speed: 0.3 + Math.random() * 0.2,
      x: (Math.random() - 0.5) * 0.3,
      scale: 0.08 + Math.random() * 0.06,
    }))
  , [])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    groupRef.current.children.forEach((child, i) => {
      const p = particles[i]
      const cycle = ((t * p.speed + p.offset) % 3) / 3
      child.position.y = cycle * 1.5
      child.position.x = p.x + Math.sin(t * 0.5 + i) * 0.1
      child.scale.setScalar(p.scale * (1 + cycle * 2))
      child.material.opacity = 0.15 * (1 - cycle)
    })
  })

  return (
    <group ref={groupRef} position={position}>
      {particles.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshStandardMaterial
            color="#c0b8b0"
            transparent
            opacity={0.15}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}
