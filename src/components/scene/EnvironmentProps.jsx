import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * SnowPineTree — a triangular conifer snow-covered tree.
 * The classic frozen wonderland element.
 */
export function SnowPineTree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 0.4, 6]} />
        <meshStandardMaterial color="#4a3520" roughness={0.9} metalness={0} />
      </mesh>
      {/* Foliage layers */}
      {[0.5, 0.9, 1.2].map((y, i) => (
        <group key={i}>
          <mesh position={[0, y, 0]} castShadow>
            <coneGeometry args={[0.4 - i * 0.1, 0.5, 8]} />
            <meshStandardMaterial
              color={i === 0 ? '#1a3a1a' : i === 1 ? '#2a4a2a' : '#3a5a3a'}
              roughness={0.85}
              metalness={0}
              flatShading
            />
          </mesh>
          {/* Snow on top of each layer */}
          <mesh position={[0, y + 0.2, 0]}>
            <coneGeometry args={[0.15 - i * 0.03, 0.1, 6]} />
            <meshStandardMaterial color="#f0ebe8" roughness={0.9} metalness={0} />
          </mesh>
        </group>
      ))}
      {/* Snow cap on top */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.08, 6, 4]} />
        <meshStandardMaterial color="#f5f0ee" roughness={0.9} metalness={0} />
      </mesh>
    </group>
  )
}

/**
 * SnowyBoulder — a smooth ice-covered rock.
 */
export function SnowyBoulder({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow>
        <dodecahedronGeometry args={[0.3, 1]} />
        <meshStandardMaterial color="#6a6a78" roughness={0.7} metalness={0.1} flatShading />
      </mesh>
      {/* Snow cap */}
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.2, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.3]} />
        <meshStandardMaterial color="#f0ebe8" roughness={0.9} metalness={0} />
      </mesh>
    </group>
  )
}

/**
 * Lantern — a small glowing lantern on a post.
 * Warm golden light that flickers subtly.
 */
export function Lantern({ position }) {
  const lightRef = useRef()

  useFrame((state) => {
    if (lightRef.current) {
      const t = state.clock.elapsedTime
      lightRef.current.intensity =
        1.2 + Math.sin(t * 3 + position[0] * 5) * 0.5 +
        Math.sin(t * 7 + position[2] * 3) * 0.3 +
        Math.sin(t * 11 + position[0]) * 0.2
    }
  })

  return (
    <group position={position}>
      {/* Post */}
      <mesh castShadow>
        <cylinderGeometry args={[0.02, 0.02, 1.0, 4]} />
        <meshStandardMaterial color="#3a3028" roughness={0.9} metalness={0} />
      </mesh>
      {/* Lantern housing */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.1, 0.12, 0.1]} />
        <meshStandardMaterial color="#2a2520" roughness={0.7} metalness={0.3} />
      </mesh>
      {/* Glow */}
      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial
          color="#f0a040"
          emissive="#f0a040"
          emissiveIntensity={1.0}
          transparent
          opacity={0.8}
        />
      </mesh>
      <pointLight ref={lightRef} position={[0, 0.55, 0]} color="#f0a040" intensity={1.2} distance={3} />
    </group>
  )
}

/**
 * Barrel — a wooden barrel lying on its side or standing.
 */
export function Barrel({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <cylinderGeometry args={[0.12, 0.14, 0.3, 10]} />
        <meshStandardMaterial color="#5a3a20" roughness={0.85} metalness={0} />
      </mesh>
      {/* Metal bands */}
      <mesh position={[0, 0.06, 0]}>
        <torusGeometry args={[0.13, 0.008, 4, 12]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, -0.06, 0]}>
        <torusGeometry args={[0.135, 0.008, 4, 12]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.4} metalness={0.6} />
      </mesh>
    </group>
  )
}

/**
 * SnowPath — subtle grooved tracks in the snow between buildings.
 */
export function SnowPath({ from, to, width = 0.4 }) {
  const geometry = useMemo(() => {
    const dx = to[0] - from[0]
    const dz = to[2] - from[2]
    const len = Math.sqrt(dx * dx + dz * dz)
    const geo = new THREE.PlaneGeometry(width, len, 1, 8)
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [from, to, width])

  const angle = Math.atan2(to[0] - from[0], to[2] - from[2])
  const midX = (from[0] + to[0]) / 2
  const midZ = (from[2] + to[2]) / 2

  return (
    <mesh
      position={[midX, 0.01, midZ]}
      rotation={[0, angle, 0]}
      geometry={geometry}
    >
      <meshStandardMaterial
        color="#d8d2cc"
        roughness={0.95}
        metalness={0}
        transparent
        opacity={0.5}
      />
    </mesh>
  )
}

/**
 * FencePost — simple wooden fence post with two rails.
 */
export function FencePost({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Post */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 0.5, 5]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.9} metalness={0} />
      </mesh>
      {/* Rails */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.6, 0.03, 0.02]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[0.6, 0.03, 0.02]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.9} metalness={0} />
      </mesh>
    </group>
  )
}
