import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

// All active muscles use Neon Yellow in the Black Gold edition
const NEON_YELLOW = '#FDE047';
const BRUSHED_STEEL = '#222222';

function HumanFigure({ activeGroup, heatMap = {} }) {
  const groupRef = useRef()

  const getHeatIntensity = (part) => {
    // If we have a heatmap (Phase 6), prioritize it:
    if (Object.keys(heatMap).length > 0) {
      return heatMap[part] || 0; // Returns 0.0 to 1.0
    }
    // Backward compatibility with activeGroup
    return part === activeGroup ? 1.0 : 0;
  }

  const getMaterialProps = (part) => {
    const intensity = getHeatIntensity(part);
    const isActive = intensity > 0;
    
    return {
      color: isActive ? NEON_YELLOW : BRUSHED_STEEL,
      metalness: isActive ? 0.3 : 0.9, // Brushed steel is highly metal
      roughness: isActive ? 0.2 : 0.45, // Brushed steel has medium roughness
      emissive: isActive ? NEON_YELLOW : '#000000',
      emissiveIntensity: isActive ? (1.5 * intensity) : 0
    }
  }

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.3
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Head */}
      <mesh position={[0, 1.65, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial {...getMaterialProps('Cabeca')} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 1.42, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.18, 12]} />
        <meshStandardMaterial {...getMaterialProps('Pescoco')} />
      </mesh>

      {/* Torso / Chest */}
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[0.55, 0.7, 0.28]} />
        <meshStandardMaterial {...getMaterialProps('Peito')} />
      </mesh>

      {/* Abdômen */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.48, 0.35, 0.25]} />
        <meshStandardMaterial {...getMaterialProps('Abdômen')} />
      </mesh>

      {/* Shoulders */}
      <mesh position={[-0.35, 1.2, 0]}>
        <sphereGeometry args={[0.13, 12, 12]} />
        <meshStandardMaterial {...getMaterialProps('Ombro')} />
      </mesh>
      <mesh position={[0.35, 1.2, 0]}>
        <sphereGeometry args={[0.13, 12, 12]} />
        <meshStandardMaterial {...getMaterialProps('Ombro')} />
      </mesh>

      {/* Upper Arms (Bíceps/Tríceps) */}
      <mesh position={[-0.45, 0.88, 0]}>
        <cylinderGeometry args={[0.09, 0.08, 0.45, 10]} />
        <meshStandardMaterial {...getMaterialProps('Bíceps')} />
      </mesh>
      <mesh position={[0.45, 0.88, 0]}>
        <cylinderGeometry args={[0.09, 0.08, 0.45, 10]} />
        <meshStandardMaterial {...getMaterialProps('Bíceps')} />
      </mesh>

      {/* Forearms (Tríceps continued) */}
      <mesh position={[-0.45, 0.42, 0]}>
        <cylinderGeometry args={[0.07, 0.055, 0.4, 10]} />
        <meshStandardMaterial {...getMaterialProps('Tríceps')} />
      </mesh>
      <mesh position={[0.45, 0.42, 0]}>
        <cylinderGeometry args={[0.07, 0.055, 0.4, 10]} />
        <meshStandardMaterial {...getMaterialProps('Tríceps')} />
      </mesh>

      {/* Back (visible from back) */}
      <mesh position={[0, 1.0, -0.08]}>
        <boxGeometry args={[0.5, 0.65, 0.12]} />
        <meshStandardMaterial {...getMaterialProps('Costas')} />
      </mesh>

      {/* Hips */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.5, 0.22, 0.27]} />
        <meshStandardMaterial {...getMaterialProps('Quadril')} />
      </mesh>

      {/* Upper Legs (Perna) */}
      <mesh position={[-0.16, -0.12, 0]}>
        <cylinderGeometry args={[0.11, 0.09, 0.55, 10]} />
        <meshStandardMaterial {...getMaterialProps('Perna')} />
      </mesh>
      <mesh position={[0.16, -0.12, 0]}>
        <cylinderGeometry args={[0.11, 0.09, 0.55, 10]} />
        <meshStandardMaterial {...getMaterialProps('Perna')} />
      </mesh>

      {/* Lower Legs (Panturrilha) */}
      <mesh position={[-0.16, -0.58, 0]}>
        <cylinderGeometry args={[0.08, 0.065, 0.5, 10]} />
        <meshStandardMaterial {...getMaterialProps('Panturrilha')} />
      </mesh>
      <mesh position={[0.16, -0.58, 0]}>
        <cylinderGeometry args={[0.08, 0.065, 0.5, 10]} />
        <meshStandardMaterial {...getMaterialProps('Panturrilha')} />
      </mesh>

      {/* Feet */}
      <mesh position={[-0.16, -0.87, 0.05]}>
        <boxGeometry args={[0.1, 0.07, 0.22]} />
        <meshStandardMaterial {...getMaterialProps('Pe')} />
      </mesh>
      <mesh position={[0.16, -0.87, 0.05]}>
        <boxGeometry args={[0.1, 0.07, 0.22]} />
        <meshStandardMaterial {...getMaterialProps('Pe')} />
      </mesh>
    </group>
  )
}

export function Anatomy3D({ activeGroup, heatMap = {} }) {
  const activeColor = NEON_YELLOW;
  
  // Calculate if there's any active recovering muscle in heatmap
  const hasHeat = Object.keys(heatMap).length > 0 || activeGroup;

  return (
    <div className="h-56 w-full bg-neutral-900/40 rounded-3xl border border-white/5 overflow-hidden relative shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
      {/* Label */}
      <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${hasHeat ? 'animate-pulse' : ''}`}
          style={{ backgroundColor: hasHeat ? activeColor : '#475569', boxShadow: hasHeat ? `0 0 10px ${activeColor}` : 'none' }}
        />
        <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
          {activeGroup ? `Foco Muscular: ${activeGroup}` : 'Smart Anatomy Engine'}
        </span>
      </div>

      <Canvas camera={{ position: [0, 0.5, 3.2], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[2, 3, 2]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-2, 1, -2]} intensity={0.5} color={activeColor} />
        <HumanFigure activeGroup={activeGroup} heatMap={heatMap} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.8}
        />
      </Canvas>

      {/* Touch hint */}
      <div className="absolute bottom-2 right-4 z-10 pointer-events-none">
        <p className="text-[8px] font-bold text-slate-700 uppercase tracking-[0.2em]">drag to rotate</p>
      </div>
    </div>
  )
}
