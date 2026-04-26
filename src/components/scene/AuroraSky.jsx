import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Aurora borealis sky dome — lightweight shader
 */
export default function AuroraSky() {
  const meshRef = useRef()
  const materialRef = useRef()

  const shader = useMemo(() => ({
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision mediump float;
      uniform float uTime;
      varying vec2 vUv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float noise(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
                   mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
      }
      float fbm(vec2 p) {
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 3; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
        return v;
      }

      void main() {
        float t = uTime * 0.3;
        float y = vUv.y;
        vec3 sky = mix(vec3(0.02, 0.02, 0.06), vec3(0.01, 0.01, 0.04), y);

        float bx = sin(t*0.7) + sin(t*1.3+2.1)*0.5;
        vec2 drift = vec2(bx, cos(t*0.9)) * 0.08;
        vec2 base = vUv * vec2(1.0, 0.5) + drift;
        float n = fbm(base * 3.0 + vec2(t * 0.15, t * 0.08));

        float curtain = smoothstep(0.05, 0.18, vUv.y) * smoothstep(0.65, 0.35, vUv.y);
        vec3 auroraColor = mix(vec3(0.1, 0.7, 0.25), vec3(0.05, 0.5, 0.5), n);
        float pulse = 0.6 + sin(uTime * 1.5) * 0.2;
        float intensity = n * curtain * pulse * 2.0;

        vec3 finalColor = mix(sky, auroraColor, intensity);
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
  }), [])

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return (
    <mesh ref={meshRef} scale={[1, 1, 1]}>
      <sphereGeometry args={[80, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={shader.vertexShader}
        fragmentShader={shader.fragmentShader}
        uniforms={{ uTime: { value: 0 } }}
        side={THREE.BackSide}
      />
    </mesh>
  )
}
