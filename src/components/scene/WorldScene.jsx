import React, { useRef, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import SnowTerrain from './SnowTerrain'
// import AuroraSky from './AuroraSky'
import IglooBrewery from './IglooBrewery'
import BeerCottage from './BeerCottage'
import Snowfall from './Snowfall'
import StringLights from './StringLights'
import CameraController from './CameraController'
import {
  SnowPineTree,
  Lantern,
  Barrel,
  SnowPath,
} from './EnvironmentProps'
import { BEERS } from '../../data/beers'

export default function WorldScene({ selectedBeer, onSelectBeer, flyTarget }) {
  const controlsRef = useRef()

  const handleBeerClick = useCallback((id) => {
    onSelectBeer?.(id === selectedBeer ? null : id)
  }, [selectedBeer, onSelectBeer])

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [0, 12, 18], fov: 45 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#0d0f1a']} />
        <fog attach="fog" args={['#0d0f1a', 25, 60]} />
        <ambientLight intensity={0.5} color="#8899bb" />
        <directionalLight position={[10, 15, 8]} intensity={0.8} color="#c8d8f0" />
        <hemisphereLight skyColor="#1a2040" groundColor="#0a0e18" intensity={0.3} />
        {/* <AuroraSky /> */}
        <Stars radius={60} depth={40} count={1500} factor={2} saturation={0.1} />
        <SnowTerrain size={60} segments={128} />
        <IglooBrewery position={[0, 0, 0]} />
        {BEERS.map((beer) => (
          <BeerCottage key={beer.id} beer={beer} onClick={handleBeerClick} selected={beer.id === selectedBeer} />
        ))}
        <Snowfall count={2500} area={40} height={15} />
        <StringLights from={[-6, 1.8, -3]} to={[6, 1.8, -3]} count={12} color="#f0c060" />
        <StringLights from={[-5, 1.5, 5]} to={[0, 1.5, -8]} count={10} color="#e8a040" />
        <StringLights from={[5, 1.5, 5]} to={[0, 1.5, -8]} count={10} color="#e8a040" />
        {[
          [-10, 0, -8], [-12, 0, -3], [-11, 0, 4], [-9, 0, 8],
          [10, 0, -8], [12, 0, -3], [11, 0, 4], [9, 0, 8],
        ].map((pos, i) => (
          <SnowPineTree key={`tree-${i}`} position={pos} scale={0.8 + (i * 0.05)} />
        ))}
        {[[-3, 0, 1.5], [3, 0, 1.5]].map((pos, i) => (
          <Lantern key={`lantern-${i}`} position={pos} />
        ))}
        {[[1.5, 0, 0.5], [2.0, 0, 0.3], [-1.5, 0, 1.0]].map((pos, i) => (
          <Barrel key={`barrel-${i}`} position={pos} rotation={[0, i * 1.2, 0]} />
        ))}
        <SnowPath from={[0, 0, 1.5]} to={[-6, 0, -3]} />
        <SnowPath from={[0, 0, 1.5]} to={[6, 0, -3]} />
        <SnowPath from={[0, 0, 1.5]} to={[0, 0, -8]} />
        <SnowPath from={[0, 0, 1.5]} to={[-5, 0, 5]} />
        <SnowPath from={[0, 0, 1.5]} to={[5, 0, 5]} />
        <CameraController flyTarget={flyTarget} controlsRef={controlsRef} />
        <OrbitControls
          ref={controlsRef}
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
      </Canvas>
    </div>
  )
}
