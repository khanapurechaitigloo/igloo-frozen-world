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

      {/* Snow patches on the dome — not a separate floating cap */}
      <mesh position={[0, 2.8, 0.5]}>
        <sphereGeometry args={[0.6, 6, 4]} />
        <meshStandardMaterial color="#f5f0ef" roughness={0.95} metalness={0} flatShading />
      </mesh>
      <mesh position={[-0.8, 2.5, -0.3]}>
        <sphereGeometry args={[0.4, 6, 4]} />
        <meshStandardMaterial color="#f0ebe8" roughness={0.95} metalness={0} flatShading />
      </mesh>
      <mesh position={[0.6, 2.6, -0.6]}>
        <sphereGeometry args={[0.35, 6, 4]} />
        <meshStandardMaterial color="#f2edeb" roughness={0.95} metalness={0} flatShading />
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
    Array.from({ length: 12 }, (_, i) => ({
      offset: i * 0.3,
      speed: 0.2 + Math.random() * 0.15,
      x: (Math.random() - 0.5) * 0.5,
      scale: 0.15 + Math.random() * 0.1,
    }))
  , [])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    groupRef.current.children.forEach((child, i) => {
      const p = particles[i]
      const cycle = ((t * p.speed + p.offset) % 4) / 4
      child.position.y = cycle * 3.0
      child.position.x = p.x + Math.sin(t * 0.5 + i) * 0.2
      child.scale.setScalar(p.scale * (1 + cycle * 4))
      child.material.opacity = 0.45 * (1 - cycle * 0.8)
    })
  })

  return (
    <group ref={groupRef} position={position}>
      {particles.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial
            color="#a8a098"
            transparent
            opacity={0.45}
            depthWrite={false}
            emissive="#888078"
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}
    </group>
  )
}
