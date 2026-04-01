import React, { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Float, MeshDistortMaterial, MeshWobbleMaterial } from '@react-three/drei'
import { motion } from 'framer-motion'
import * as THREE from 'three'

// Premium ZYRON Palette
const NEON_YELLOW = '#FDE047';
const BRUSHED_STEEL = '#0a0a0a';
const GRID_COLOR = '#ffffff05';

function MusclePart({ position, args, type = 'box', groupName, activeGroup, heatMap = {}, rotation = [0, 0, 0] }) {
  const intensity = useMemo(() => {
    if (Object.keys(heatMap).length > 0) return heatMap[groupName] || 0;
    return groupName === activeGroup ? 1.0 : 0;
  }, [activeGroup, heatMap, groupName]);

  const isActive = intensity > 0;
  
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        {type === 'box' && <boxGeometry args={args} />}
        {type === 'sphere' && <sphereGeometry args={args} />}
        {type === 'cylinder' && <cylinderGeometry args={args} />}
        {type === 'capsule' && <capsuleGeometry args={args} />}
        <meshStandardMaterial 
          color={isActive ? NEON_YELLOW : '#1a1a1a'}
          metalness={isActive ? 0.2 : 0.9}
          roughness={isActive ? 0.1 : 0.3}
          emissive={isActive ? NEON_YELLOW : '#000000'}
          emissiveIntensity={isActive ? 2.5 : 0}
          envMapIntensity={1}
        />
      </mesh>
      
      {/* Energy Shell for active muscles */}
      {isActive && (
        <mesh scale={[1.15, 1.15, 1.15]}>
          {type === 'box' && <boxGeometry args={args} />}
          {type === 'sphere' && <sphereGeometry args={args} />}
          {type === 'cylinder' && <cylinderGeometry args={args} />}
          {type === 'capsule' && <capsuleGeometry args={args} />}
          <MeshWobbleMaterial 
            color={NEON_YELLOW} 
            transparent 
            opacity={0.15} 
            wireframe 
            speed={2} 
            factor={0.1}
          />
        </mesh>
      )}
    </group>
  );
}

function HumanFigure({ activeGroup, heatMap = {} }) {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.15
    }
  })

  return (
    <group ref={groupRef} position={[0, -0.8, 0]}>
      {/* HEAD */}
      <MusclePart groupName="Cabeca" activeGroup={activeGroup} position={[0, 2.5, 0]} args={[0.15, 32, 32]} type="sphere" />
      <MusclePart groupName="Pescoco" activeGroup={activeGroup} position={[0, 2.35, 0]} args={[0.06, 0.06, 0.15]} type="cylinder" />

      {/* TORSO */}
      {/* Pecs */}
      <MusclePart groupName="Peito" activeGroup={activeGroup} position={[-0.15, 2.05, 0.1]} args={[0.16, 0.22, 0.1]} type="box" rotation={[0, 0, 0.05]} />
      <MusclePart groupName="Peito" activeGroup={activeGroup} position={[0.15, 2.05, 0.1]} args={[0.16, 0.22, 0.1]} type="box" rotation={[0, 0, -0.05]} />
      
      {/* Abdomen */}
      <MusclePart groupName="Abdômen" activeGroup={activeGroup} position={[0, 1.8, 0.08]} args={[0.2, 0.3, 0.12]} type="box" />
      
      {/* Lats */}
      <MusclePart groupName="Costas" activeGroup={activeGroup} position={[-0.22, 2.0, -0.05]} args={[0.12, 0.4, 0.08]} type="box" rotation={[0, 0, 0.3]} />
      <MusclePart groupName="Costas" activeGroup={activeGroup} position={[0.22, 2.0, -0.05]} args={[0.12, 0.4, 0.08]} type="box" rotation={[0, 0, -0.3]} />

      {/* SHOULDERS */}
      <MusclePart groupName="Ombro" activeGroup={activeGroup} position={[-0.38, 2.15, 0]} args={[0.14, 32, 32]} type="sphere" />
      <MusclePart groupName="Ombro" activeGroup={activeGroup} position={[0.38, 2.15, 0]} args={[0.14, 32, 32]} type="sphere" />

      {/* ARMS */}
      <MusclePart groupName="Bíceps" activeGroup={activeGroup} position={[-0.48, 1.85, 0.05]} args={[0.08, 0.4]} type="capsule" rotation={[0, 0, 0.1]} />
      <MusclePart groupName="Bíceps" activeGroup={activeGroup} position={[0.48, 1.85, 0.05]} args={[0.08, 0.4]} type="capsule" rotation={[0, 0, -0.1]} />
      
      <MusclePart groupName="Tríceps" activeGroup={activeGroup} position={[-0.48, 1.8, -0.05]} args={[0.08, 0.4]} type="capsule" rotation={[0, 0, 0.1]} />
      <MusclePart groupName="Tríceps" activeGroup={activeGroup} position={[0.48, 1.8, -0.05]} args={[0.08, 0.4]} type="capsule" rotation={[0, 0, -0.1]} />

      {/* LEGS */}
      <MusclePart groupName="Perna" activeGroup={activeGroup} position={[-0.18, 1.1, 0]} args={[0.12, 0.7]} type="capsule" />
      <MusclePart groupName="Perna" activeGroup={activeGroup} position={[0.18, 1.1, 0]} args={[0.12, 0.7]} type="capsule" />
      
      <MusclePart groupName="Panturrilha" activeGroup={activeGroup} position={[-0.18, 0.4, -0.02]} args={[0.09, 0.5]} type="capsule" />
      <MusclePart groupName="Panturrilha" activeGroup={activeGroup} position={[0.18, 0.4, -0.02]} args={[0.09, 0.5]} type="capsule" />

      <MusclePart groupName="Pé" activeGroup={activeGroup} position={[-0.18, 0, 0.1]} args={[0.1, 0.05, 0.2]} type="box" />
      <MusclePart groupName="Pé" activeGroup={activeGroup} position={[0.18, 0, 0.1]} args={[0.1, 0.05, 0.2]} type="box" />

      {/* Scan Line */}
      <Float speed={2} rotationIntensity={0} floatIntensity={0.5}>
        <mesh position={[0, 1.25, 0.3]}>
          <planeGeometry args={[2.5, 0.02]} />
          <meshBasicMaterial color={NEON_YELLOW} transparent opacity={0.2} />
        </mesh>
      </Float>
    </group>
  )
}

export default function Anatomy3D({ activeGroup, heatMap = {} }) {
  const hasHeat = Object.keys(heatMap).length > 0 || activeGroup;

  return (
    <div className="h-64 w-full bg-black/40 rounded-3xl border border-white/5 overflow-hidden relative shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]">
      {/* HUD OVERLAY */}
      <div className="absolute top-5 left-6 z-10">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className={`absolute w-4 h-4 rounded-full ${hasHeat ? 'animate-ping' : ''} bg-yellow-400/20`} />
            <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_10px_#FDE047]" />
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic">Neural Scan</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[7px] font-bold text-neutral-600 uppercase tracking-widest leading-none">Status:</span>
              <span className="text-[7px] font-black text-yellow-400 uppercase tracking-widest leading-none">
                {hasHeat ? 'Recrutamento Ativo' : 'Aguardando Carga'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {activeGroup && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-5 right-6 z-10 text-right"
        >
          <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest block mb-0.5 underline decoration-yellow-400/30">Target Focus</span>
          <span className="text-sm font-black text-yellow-500 uppercase italic tracking-tighter">{activeGroup}</span>
        </motion.div>
      )}

      {/* Decorative HUD corners */}
      <div className="absolute bottom-5 left-6 z-10 flex flex-col gap-1.5">
         <div className="flex gap-1">
            <div className="w-1 h-3 bg-yellow-400/40 rounded-full" />
            <div className="w-1 h-1.5 bg-yellow-400/20 rounded-full" />
         </div>
         <span className="text-[7px] font-mono text-neutral-700 tracking-tighter uppercase">ANATOMY.ENGINE.v2.0</span>
      </div>

      <Canvas camera={{ position: [0, 1.2, 4.5], fov: 35 }} dpr={[1, 2]}>
        <ambientLight intensity={0.4} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-5, 5, -5]} intensity={0.5} color={NEON_YELLOW} />
        
        <Suspense fallback={null}>
          <HumanFigure activeGroup={activeGroup} heatMap={heatMap} />
        </Suspense>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.8}
        />
        <gridHelper args={[20, 20, GRID_COLOR, GRID_COLOR]} position={[0, -0.8, 0]} />
      </Canvas>

      {/* Scan Lines Overlay Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay">
        <div className="w-full h-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      </div>
    </div>
  )
}
