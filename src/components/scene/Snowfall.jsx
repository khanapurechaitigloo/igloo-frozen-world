import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Snowfall — a large particle system that drifts gently downward
 * with lateral wind sway. Uses points for performance.
 */
export default function Snowfall({ count = 2000, area = 40, height = 15 }) {
  const pointsRef = useRef()

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * area
      pos[i * 3 + 1] = Math.random() * height
      pos[i * 3 + 2] = (Math.random() - 0.5) * area
      vel[i * 3] = (Math.random() - 0.5) * 0.02
      vel[i * 3 + 1] = -(0.01 + Math.random() * 0.03)
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02
    }
    return { positions: pos, velocities: vel }
  }, [count, area, height])

  const particleTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(0.4, 'rgba(240, 245, 255, 0.8)')
    gradient.addColorStop(1, 'rgba(230, 235, 250, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 32, 32)
    const tex = new THREE.CanvasTexture(canvas)
    return tex
  }, [])

  useFrame((state) => {
    if (!pointsRef.current) return
    const posAttr = pointsRef.current.geometry.attributes.position
    const t = state.clock.elapsedTime

    for (let i = 0; i < count; i++) {
      let x = posAttr.getX(i) + velocities[i * 3] + Math.sin(t * 0.5 + i * 0.1) * 0.003
      let y = posAttr.getY(i) + velocities[i * 3 + 1]
      let z = posAttr.getZ(i) + velocities[i * 3 + 2] + Math.cos(t * 0.3 + i * 0.15) * 0.003

      // Reset when it hits the ground
      if (y < 0) {
        x = (Math.random() - 0.5) * area
        y = height + Math.random() * 3
        z = (Math.random() - 0.5) * area
      }

      posAttr.setXYZ(i, x, y, z)
    }
    posAttr.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        map={particleTexture}
        transparent
        opacity={0.7}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        color="#e8eef5"
        sizeAttenuation
      />
    </points>
  )
}
