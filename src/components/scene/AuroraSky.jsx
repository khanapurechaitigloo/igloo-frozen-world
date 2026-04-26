import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Aurora borealis sky dome — a large hemisphere with a shader that renders
 * animated aurora curtains with Brownian motion drift.
 */
export default function AuroraSky() {
  const meshRef = useRef()
  const materialRef = useRef()

  const shader = useMemo(() => ({
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;
      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vPosition;

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
        for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
        return v;
      }

      void main() {
        float t = uTime * 0.3;

        // Sky gradient — deep indigo to black
        float y = vUv.y;
        vec3 skyBottom = vec3(0.02, 0.02, 0.06);
        vec3 skyMid = vec3(0.04, 0.04, 0.12);
        vec3 skyTop = vec3(0.01, 0.01, 0.04);
        vec3 sky = mix(skyBottom, skyMid, smoothstep(0.0, 0.4, y));
        sky = mix(sky, skyTop, smoothstep(0.4, 1.0, y));

        // Brownian drift
        float bx = sin(t*0.7) + sin(t*1.3+2.1)*0.5 + sin(t*0.4+5.3)*0.3;
        float bz = cos(t*0.9) + cos(t*1.1+1.7)*0.5 + cos(t*0.6+3.8)*0.3;
        vec2 drift = vec2(bx, bz) * 0.08;

        // Aurora bands
        vec2 base = vUv * vec2(1.0, 0.5) + drift;
        float n1 = fbm(base * 3.0 + vec2(t * 0.15, t * 0.08));
        float n2 = fbm(base * 5.0 + vec2(t * -0.1, t * 0.12));
        float n3 = fbm(base * 8.0 + vec2(t * 0.2, t * -0.06));
        float aurora = n1 * 0.5 + n2 * 0.35 + n3 * 0.15;

        // Curtain mask — aurora sits low on the horizon
        float curtain = smoothstep(0.05, 0.18, vUv.y) * smoothstep(0.65, 0.35, vUv.y);

        // Color palette — greens, cyans, hints of purple
        vec3 col1 = vec3(0.1, 0.7, 0.25);
        vec3 col2 = vec3(0.05, 0.5, 0.5);
        vec3 col3 = vec3(0.3, 0.1, 0.6);
        vec3 col4 = vec3(0.1, 0.8, 0.35);

        vec3 auroraColor = mix(col1, col2, smoothstep(0.0, 0.4, aurora));
        auroraColor = mix(auroraColor, col3, smoothstep(0.4, 0.7, aurora));
        auroraColor = mix(auroraColor, col4, smoothstep(0.7, 1.0, aurora));

        // Pulsing intensity
        float pulse = 0.6 + sin(uTime * 1.5) * 0.2 + sin(uTime * 0.7 + 1.0) * 0.15;
        float intensity = aurora * curtain * pulse * 2.5;

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
      <sphereGeometry args={[80, 64, 32, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
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
