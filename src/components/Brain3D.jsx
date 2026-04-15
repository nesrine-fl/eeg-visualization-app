import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

// Brain region mapping
const BRAIN_REGIONS = {
  frontal_lobe: { 
    position: [0, 0.3, 0.2], 
    color: '#00ff88',
    size: 0.3,
    label: 'Frontal Lobe'
  },
  temporal_lobe: { 
    position: [-0.4, 0, 0], 
    color: '#00ccff',
    size: 0.25,
    label: 'Temporal Lobe'
  },
  motor_cortex: { 
    position: [0, 0.4, 0], 
    color: '#ffaa00',
    size: 0.2,
    label: 'Motor Cortex'
  },
  sensory_cortex: { 
    position: [0, 0.2, 0], 
    color: '#ff6600',
    size: 0.2,
    label: 'Sensory Cortex'
  },
  parietal_lobe: { 
    position: [0, 0.1, -0.1], 
    color: '#00ffcc',
    size: 0.25,
    label: 'Parietal Lobe'
  },
  occipital_lobe: { 
    position: [0, 0, -0.3], 
    color: '#ff00ff',
    size: 0.2,
    label: 'Occipital Lobe'
  }
};

// Brain region component
function BrainRegion({ region, activity, isSeizure, isArtifact }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  const regionData = BRAIN_REGIONS[region];
  // Use real activity value from backend heatmap, ensure it's a number
  const activityValue = typeof activity === 'number' ? activity : 0;
  const intensity = Math.min(activityValue * 2, 1);
  
  // Determine color based on real activity from backend
  let color = regionData.color;
  if (isSeizure) {
    color = '#ff0000'; // Red for seizure
  } else if (isArtifact) {
    color = '#ffaa00'; // Orange for artifact
  } else if (activityValue > 0.7) {
    color = '#00ff00'; // Green for high activity
  } else if (activityValue > 0.4) {
    color = '#ffff00'; // Yellow for medium activity
  } else {
    color = '#0066ff'; // Blue for low activity
  }
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = Date.now() * 0.001; // Convert to seconds
      // Pulsing effect for high activity
      if (activityValue > 0.5 || isSeizure) {
        meshRef.current.scale.setScalar(
          regionData.size * (1 + Math.sin(time * 3) * 0.1 * intensity)
        );
      }
      
      // Rotation for seizures
      if (isSeizure) {
        meshRef.current.rotation.y = time * 2;
      }
    }
  });
  
  return (
    <mesh
      ref={meshRef}
      position={regionData.position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[regionData.size, 32, 32]} />
      <meshStandardMaterial 
        color={color} 
        emissive={color}
        emissiveIntensity={intensity * 0.5}
        transparent
        opacity={0.8}
        roughness={0.3}
        metalness={0.6}
      />
      {hovered && (
        <Text
          position={[0, regionData.size + 0.1, 0]}
          fontSize={0.05}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {regionData.label}
          <meshBasicMaterial attach="material" color="white" />
        </Text>
      )}
    </mesh>
  );
}

// Main brain mesh
function BrainMesh({ heatmap, seizures, artifacts }) {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      // Subtle rotation
      meshRef.current.rotation.y = Date.now() * 0.0001;
    }
  });
  
  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 2]} />
      <meshStandardMaterial 
        color="#1a1a2e" 
        wireframe
        transparent
        opacity={0.3}
      />
      
      {/* Render brain regions */}
      {Object.entries(heatmap).map(([region, activity]) => (
        <BrainRegion
          key={region}
          region={region}
          activity={activity}
          isSeizure={seizures.some(s => s.region === region)}
          isArtifact={artifacts.some(a => a.region === region)}
        />
      ))}
    </mesh>
  );
}

// Connection lines between regions
function BrainConnections() {
  const linesRef = useRef();
  
  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.rotation.y = Date.now() * 0.00005;
    }
  });
  
  const connections = [
    [BRAIN_REGIONS.frontal_lobe.position, BRAIN_REGIONS.temporal_lobe.position],
    [BRAIN_REGIONS.frontal_lobe.position, BRAIN_REGIONS.motor_cortex.position],
    [BRAIN_REGIONS.motor_cortex.position, BRAIN_REGIONS.sensory_cortex.position],
    [BRAIN_REGIONS.sensory_cortex.position, BRAIN_REGIONS.parietal_lobe.position],
    [BRAIN_REGIONS.parietal_lobe.position, BRAIN_REGIONS.occipital_lobe.position],
  ];
  
  return (
    <group ref={linesRef}>
      {connections.map(([start, end], index) => (
        <line key={index}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([...start, ...end])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#00ffff" opacity={0.3} transparent />
        </line>
      ))}
    </group>
  );
}

export default function Brain3D({ heatmap = {}, seizures = [], artifacts = [], mode = 'student' }) {
  // No loading state - render immediately with real data
  
  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [2, 1, 2], fov: 50 }}
        style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00ffff" />
        
        {/* Brain visualization */}
        <BrainMesh heatmap={heatmap} seizures={seizures} artifacts={artifacts} />
        <BrainConnections />
        
        {/* Controls */}
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1.5}
          maxDistance={4}
        />
        
        {/* Mode-specific overlays */}
        {mode === 'patient' && (
          <Text
            position={[0, -1.5, 0]}
            fontSize={0.1}
            color="#00ff00"
            anchorX="center"
            anchorY="middle"
          >
            Your brain activity is stable
            <meshBasicMaterial attach="material" color="#00ff00" />
          </Text>
        )}
        
        {mode === 'doctor' && (
          <Text
            position={[0, -1.5, 0]}
            fontSize={0.08}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            Real-time EEG Analysis - {seizures.length} seizures detected
            <meshBasicMaterial attach="material" color="#ffffff" />
          </Text>
        )}
      </Canvas>
      
      {/* Status indicators */}
      <div className="absolute top-4 left-4 space-y-2">
        {seizures.length > 0 && (
          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
            SEIZURE DETECTED
          </div>
        )}
        {artifacts.length > 0 && (
          <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            ARTIFACTS: {artifacts.length}
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 p-3 rounded-lg">
        <div className="text-white text-xs space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Normal Activity</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Seizure Activity</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>Artifacts</span>
          </div>
        </div>
      </div>
    </div>
  );
}
