import { useRef, useCallback, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

/**
 * CameraController — smooth fly-to animation when clicking cottages.
 * Animates OrbitControls target + camera position for a cinematic feel.
 */
export default function CameraController({ flyTarget, controlsRef }) {
  const { camera } = useThree()
  const animRef = useRef({
    active: false,
    startTime: 0,
    duration: 1.5,
    fromPos: null,
    toPos: null,
    fromTarget: null,
    toTarget: null,
  })

  const animateTo = useCallback((targetPos) => {
    if (!targetPos || !controlsRef.current) return

    const offset = [0, 6, 10] // camera offset from target
    const toPos = [
      targetPos[0] + offset[0],
      targetPos[1] + offset[1],
      targetPos[2] + offset[2],
    ]

    animRef.current = {
      active: true,
      startTime: performance.now() / 1000,
      duration: 1.4,
      fromPos: camera.position.clone(),
      toPos: toPos,
      fromTarget: controlsRef.current.target.clone(),
      toTarget: targetPos,
    }
  }, [camera, controlsRef])

  useEffect(() => {
    if (flyTarget) {
      animateTo(flyTarget)
    } else {
      // Fly back to overview
      animateTo([0, 3, -2])
    }
  }, [flyTarget, animateTo])

  useFrame(() => {
    const anim = animRef.current
    if (!anim.active || !controlsRef.current) return

    const now = performance.now() / 1000
    const elapsed = now - anim.startTime
    let t = Math.min(elapsed / anim.duration, 1)

    // Smooth ease in-out
    t = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

    camera.position.lerpVectors(anim.fromPos, anim.toPos, t)
    controlsRef.current.target.lerpVectors(anim.fromTarget, anim.toTarget, t)
    controlsRef.current.update()

    if (t >= 1) {
      anim.active = false
    }
  })

  return null
}
