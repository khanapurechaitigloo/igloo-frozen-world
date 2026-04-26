import React, { Suspense, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Stars } from '@react-three/drei'
import * as THREE from 'three'

import SnowTerrain from './SnowTerrain'
import AuroraSky from './AuroraSky'
import IglooBrewery from './IglooBrewery'
import BeerCottage from './BeerCottage'
import Snowfall from './Snowfall'
import StringLights from './StringLights'
import {
  SnowPineTree,
  SnowyBoulder,
  Lantern,
  Barrel,
  SnowPath,
  FencePost,
} from './EnvironmentProps'
import { BEERS } from '../../data/beers'

/**
 * WorldScene — the frozen craft wonderland.
 * Composes all scene elements into one living world.
 */
export default function WorldScene({ selectedBeer, onSelectBeer }) {
  const [hovered, setHovered] = useState(null)

  const handleBeerClick = useCallback((id) => {
    onSelectBeer(id === selectedBeer ? null : id)
  }, [selectedBeer, onSelectBeer])

  return (
    <Canvas
      shadows
      camera={{
        position: [0, 12, 18],
        fov: 45,
        near: 0.1,
        far: 200,
      }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.9,
      }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#0d0f1a']} />
      <fog attach="fog" args={['#0d0f1a', 25, 60]} />

      <Suspense fallback={null}>
        {/* ─── SKY ─── */}
        <AuroraSky />
        <Stars radius={60} depth={40} count={1500} factor={2} saturation={0.1} />

        {/* ─── TERRAIN ─── */}
        <SnowTerrain size={60} segments={128} />

        {/* ─── LIGHTING ─── */}
        <ambientLight intensity={0.15} color="#8899bb" />
        <directionalLight
          position={[10, 15, 8]}
          intensity={0.4}
          color="#c8d8f0"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={60}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />

        {/* Cold ambient bounce */}
        <hemisphereLight
          skyColor="#1a2040"
          groundColor="#0a0e18"
          intensity={0.3}
        />

        {/* ─── MAIN BREWERY ─── */}
        <IglooBrewery position={[0, 0, 0]} />

        {/* ─── BEER COTTAGES ─── */}
        {BEERS.map((beer) => (
          <BeerCottage
            key={beer.id}
            beer={beer}
            onClick={handleBeerClick}
            selected={beer.id === selectedBeer}
          />
        ))}

        {/* ─── SNOWFALL ─── */}
        <Snowfall count={2500} area={40} height={15} />

        {/* ─── PATHS ─── */}
        <SnowPath from={[0, 0, 1.5]} to={[-6, 0, -3]} />
        <SnowPath from={[0, 0, 1.5]} to={[6, 0, -3]} />
        <SnowPath from={[0, 0, 1.5]} to={[0, 0, -8]} />
        <SnowPath from={[0, 0, 1.5]} to={[-5, 0, 5]} />
        <SnowPath from={[0, 0, 1.5]} to={[5, 0, 5]} />
        <SnowPath from={[0, 0, 0]} to={[0, 0, 0]} /> {/* cellar at center */}

        {/* ─── STRING LIGHTS ─── */}
        <StringLights from={[-6, 1.8, -3]} to={[6, 1.8, -3]} count={12} color="#f0c060" />
        <StringLights from={[-5, 1.5, 5]} to={[0, 1.5, -8]} count={10} color="#e8a040" />
        <StringLights from={[5, 1.5, 5]} to={[0, 1.5, -8]} count={10} color="#e8a040" />
        <StringLights from={[-5, 1.5, 5]} to={[5, 1.5, 5]} count={8} color="#f0c060" />

        {/* ─── TREES ─── */}
        {/* Trees around the perimeter */}
        {[
          [-10, 0, -8], [-12, 0, -3], [-11, 0, 4], [-9, 0, 8],
          [10, 0, -8], [12, 0, -3], [11, 0, 4], [9, 0, 8],
          [-8, 0, -12], [-4, 0, -13], [4, 0, -13], [8, 0, -12],
          [-8, 0, 10], [-3, 0, 12], [3, 0, 12], [8, 0, 10],
        ].map((pos, i) => (
          <SnowPineTree
            key={`tree-${i}`}
            position={pos}
            scale={0.8 + Math.random() * 0.5}
          />
        ))}

        {/* Dense tree cluster — back left */}
        {[
          [-13, 0, -10], [-14, 0, -6], [-15, 0, -2], [-14, 0, 3],
          [-12, 0, -14], [-13, 0, -12], [-15, 0, -8],
        ].map((pos, i) => (
          <SnowPineTree
            key={`cluster-${i}`}
            position={pos}
            scale={0.6 + Math.random() * 0.4}
          />
        ))}

        {/* ─── BOULDERS ─── */}
        {[
          [-8, 0, 2], [7, 0, 1], [-3, 0, 10], [4, 0, -10],
        ].map((pos, i) => (
          <SnowyBoulder key={`boulder-${i}`} position={pos} scale={0.8 + Math.random() * 0.5} />
        ))}

        {/* ─── LANTERNS ─── */}
        {[
          [-3, 0, 1.5], [3, 0, 1.5],
          [-2, 0, -2], [2, 0, -2],
        ].map((pos, i) => (
          <Lantern key={`lantern-${i}`} position={pos} />
        ))}

        {/* ─── BARRELS ─── */}
        {[
          [1.5, 0, 0.5], [2.0, 0, 0.3], [-1.5, 0, 1.0],
          [5.5, 0, 4.8], [4.8, 0, 5.2], [5.2, 0, 4.5],
        ].map((pos, i) => (
          <Barrel
            key={`barrel-${i}`}
            position={pos}
            rotation={[Math.random() * 0.2, Math.random() * Math.PI, 0]}
          />
        ))}

        {/* ─── FENCE ─── */}
        {[
          { pos: [-4, 0, 6], rot: [0, 0.3, 0] },
          { pos: [-3, 0, 6.2], rot: [0, 0.3, 0] },
          { pos: [3, 0, 6.2], rot: [0, -0.3, 0] },
          { pos: [4, 0, 6], rot: [0, -0.3, 0] },
        ].map((f, i) => (
          <FencePost key={`fence-${i}`} position={f.pos} rotation={f.rot} />
        ))}

        {/* ─── ENVIRONMENT MAP ─── */}
        <Environment preset="night" />

        {/* ─── CONTROLS ─── */}
        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          maxPolarAngle={Math.PI * 0.48}
          minPolarAngle={Math.PI * 0.15}
          maxDistance={35}
          minDistance={6}
          target={[0, 0, 0]}
          autoRotate
          autoRotateSpeed={0.15}
          dampingFactor={0.08}
          enableDamping
        />
      </Suspense>
    </Canvas>
  )
}
