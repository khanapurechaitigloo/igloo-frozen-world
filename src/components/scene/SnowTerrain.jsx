import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Snowy terrain — a large plane with vertex displacement using layered noise.
 * The irregular surface reads like a real snowfield, not a flat plane.
 */
export default function SnowTerrain({ size = 60, segments = 128 }) {
  const meshRef = useRef()

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, segments, segments)
    geo.rotateX(-Math.PI / 2)

    const pos = geo.attributes.position
    const colors = new Float32Array(pos.count * 3)

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)

      // Layered noise for organic snow drifts
      const h =
        Math.sin(x * 0.15) * Math.cos(z * 0.12) * 1.2 +
        Math.sin(x * 0.4 + 1.3) * Math.cos(z * 0.35 + 0.7) * 0.5 +
        Math.sin(x * 0.9 + 2.1) * Math.cos(z * 0.8 + 1.1) * 0.15 +
        Math.sin(x * 1.8 + 0.5) * Math.cos(z * 1.6 + 0.3) * 0.05

      // Flatten the center area for the village
      const distFromCenter = Math.sqrt(x * x + z * z)
      const flatten = smoothstep(8, 15, distFromCenter)

      pos.setY(i, h * flatten)

      // Color variation — slight blue-white patches
      const shade = 0.88 + Math.sin(x * 0.6 + z * 0.4) * 0.05 + Math.random() * 0.04
      colors[i * 3] = shade
      colors[i * 3 + 1] = shade * 1.02
      colors[i * 3 + 2] = shade + 0.04
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.computeVertexNormals()
    return geo
  }, [size, segments])

  return (
    <mesh ref={meshRef} geometry={geometry} receiveShadow>
      <meshStandardMaterial
        vertexColors
        roughness={0.85}
        metalness={0.02}
        envMapIntensity={0.3}
      />
    </mesh>
  )
}

// Utility: smoothstep
function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}
