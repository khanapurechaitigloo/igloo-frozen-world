import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * StringLights — small glowing spheres strung between two points.
 * Creates that warm festive/frozen-wonderland feeling.
 */
export default function StringLights({
  from = [-2, 2, 0],
  to = [2, 2, 0],
  count = 8,
  droop = 0.6,
  color = '#f0c060',
  size = 0.04,
  flickerSpeed = 2,
}) {
  const lightsRef = useRef()
  const lineRef = useRef()

  const positions = useMemo(() => {
    const pts = []
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1)
      const x = from[0] + (to[0] - from[0]) * t
      const y = from[1] + (to[1] - from[1]) * t - Math.sin(t * Math.PI) * droop
      const z = from[2] + (to[2] - from[2]) * t
      pts.push(new THREE.Vector3(x, y, z))
    }
    return pts
  }, [from, to, count, droop])

  // Wire geometry (catenary curve)
  const wireGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(positions)
  }, [positions])

  useFrame((state) => {
    if (!lightsRef.current) return
    const t = state.clock.elapsedTime
    lightsRef.current.children.forEach((light, i) => {
      light.material.emissiveIntensity =
        0.6 + Math.sin(t * flickerSpeed + i * 1.7) * 0.15 +
        Math.sin(t * flickerSpeed * 2.3 + i * 0.9) * 0.1
    })
  })

  return (
    <group>
      {/* Wire */}
      <line ref={lineRef} geometry={wireGeometry}>
        <lineBasicMaterial color="#3a3028" linewidth={1} transparent opacity={0.6} />
      </line>

      {/* Light bulbs */}
      <group ref={lightsRef}>
        {positions.map((pos, i) => (
          <mesh key={i} position={pos}>
            <sphereGeometry args={[size, 8, 8]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.8}
              transparent
              opacity={0.9}
            />
          </mesh>
        ))}
      </group>

      {/* Warm light from center of string */}
      <pointLight
        position={[
          (from[0] + to[0]) / 2,
          (from[1] + to[1]) / 2 - droop * 0.4,
          (from[2] + to[2]) / 2,
        ]}
        color={color}
        intensity={0.5}
        distance={3}
      />
    </group>
  )
}
