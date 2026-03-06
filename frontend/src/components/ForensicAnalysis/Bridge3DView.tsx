'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Float, Text, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

interface BridgeComponent {
  id: string;
  name: string;
  status: 'pending' | 'verified' | 'anomaly';
  progress: number;
}

interface Bridge3DViewProps {
  components: BridgeComponent[];
}

function BridgeModel({ components }: Bridge3DViewProps) {
  return (
    <group>
      {/* Grid Floor Helper */}
      <gridHelper args={[20, 20, '#1e293b', '#0f172a']} position={[0, -3, 0]} />
      
      {/* Abutment Left */}
      <mesh position={[-6, 1, 0]}>
        <boxGeometry args={[2.2, 4.2, 3.2]} />
        <meshStandardMaterial color="#0f172a" wireframe opacity={0.3} transparent />
      </mesh>
      <mesh position={[-6, 1, 0]}>
        <boxGeometry args={[2, 4, 3]} />
        <meshStandardMaterial color="#334155" roughness={0.1} metalness={0.8} />
      </mesh>

      {/* Main Spans */}
      {components.filter(c => c.id.startsWith('span')).map((c, i) => (
        <group key={c.id} position={[-2 + i * 4, 1.5, 0]}>
          <mesh>
            <boxGeometry args={[3.8, 1, 3]} />
            <meshStandardMaterial 
                color={c.status === 'anomaly' ? '#ef4444' : c.status === 'verified' ? '#10b981' : '#1e293b'} 
                emissive={c.status === 'anomaly' ? '#ef4444' : c.status === 'verified' ? '#10b981' : '#000000'}
                emissiveIntensity={c.status === 'anomaly' ? 0.8 : c.status === 'verified' ? 0.2 : 0}
                transparent
                opacity={0.8}
                roughness={0}
            />
          </mesh>
          
          {/* Wireframe overlay for forensic feel */}
          <mesh scale={[1.02, 1.02, 1.02]}>
            <boxGeometry args={[3.8, 1, 3]} />
            <meshStandardMaterial color="white" wireframe opacity={0.1} transparent />
          </mesh>
          
          {/* Progress Indicator inside mesh */}
          <mesh position={[0, -0.4, 0]}>
            <boxGeometry args={[3.8 * (c.progress / 100), 0.2, 3.1]} />
            <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={2} />
          </mesh>

          <Text
            position={[0, 1.5, 0]}
            fontSize={0.25}
            color="white"
            anchorX="center"
            anchorY="middle"
            font="https://fonts.gstatic.com/s/robotomono/v22/L0tkDFI86yb8AZXaacSlW67LmqpS.woff"
          >
            {c.name.toUpperCase()}
          </Text>
        </group>
      ))}

      {/* Abutment Right */}
      <mesh position={[6, 1, 0]}>
        <boxGeometry args={[2, 4, 3]} />
        <meshStandardMaterial color="#334155" roughness={0.1} metalness={0.8} />
      </mesh>

      {/* The Road Deck */}
      <mesh position={[0, 2.1, 0]}>
        <boxGeometry args={[14, 0.2, 3.2]} />
        <meshStandardMaterial color="#0f172a" metalness={1} roughness={0} />
      </mesh>
      
      {/* Support Pillars */}
      {[-4, 0, 4].map((x, i) => (
        <group key={i} position={[x, -1, 0]}>
            <mesh>
                <cylinderGeometry args={[0.5, 0.8, 4, 16]} />
                <meshStandardMaterial color="#475569" metalness={0.5} />
            </mesh>
            <mesh scale={[1.1, 1, 1.1]}>
                <cylinderGeometry args={[0.5, 0.8, 4, 16]} />
                <meshStandardMaterial color="#6366f1" wireframe opacity={0.1} transparent />
            </mesh>
        </group>
      ))}
    </group>
  );
}

function ScanningLight() {
    const lightRef = React.useRef<THREE.SpotLight>(null);
    useFrame((state) => {
        if (!lightRef.current) return;
        const t = state.clock.getElapsedTime();
        lightRef.current.position.x = Math.sin(t) * 10;
    });

    return (
        <spotLight 
            ref={lightRef}
            position={[0, 10, 0]} 
            angle={0.3} 
            penumbra={1} 
            intensity={20} 
            color="#6366f1" 
            castShadow 
        />
    );
}

import { useFrame } from '@react-three/fiber';

export default function Bridge3DView({ components }: Bridge3DViewProps) {
  return (
    <div className="w-full h-full min-h-[400px] bg-slate-950/50 rounded-3xl overflow-hidden border border-white/5 relative">
      <div className="absolute top-6 left-6 z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">3D Schematic Active</span>
        </div>
      </div>
      
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[10, 8, 15]} fov={35} />
        <OrbitControls 
            enablePan={true} 
            enableZoom={true} 
            minDistance={5} 
            maxDistance={30}
            maxPolarAngle={Math.PI / 2}
        />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        
        <Suspense fallback={null}>
            <Float speed={1.4} rotationIntensity={0.5} floatIntensity={0.5}>
                <BridgeModel components={components} />
            </Float>
            <ContactShadows position={[0, -3, 0]} opacity={0.4} scale={20} blur={2.4} far={4.5} />
            <Environment preset="city" />
        </Suspense>
      </Canvas>

      <div className="absolute bottom-6 right-6 z-10 text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-white/5">
        Left-Click to Rotate // Scroll to Zoom
      </div>
    </div>
  );
}
