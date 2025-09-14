"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { create } from "zustand";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, Box, MeshReflectorMaterial } from "@react-three/drei";
import confetti from "canvas-confetti";
import styles from "./page.module.css";

// Store for timeline and contributions
interface TimelineState {
  step: number;
  playing: boolean;
  typical: number;
  invested: number;
  setStep: (step: number) => void;
  setPlaying: (playing: boolean) => void;
  setAmounts: (typical: number, invested: number) => void;
}

const useTimeline = create<TimelineState>((set) => ({
  step: 0,
  playing: true,
  typical: 500,
  invested: 1200,
  setStep: (step) => set({ step }),
  setPlaying: (playing) => set({ playing }),
  setAmounts: (typical, invested) => set({ typical, invested }),
}));

// Simple money pile using boxes
function MoneyStack({ height, color, position }: { height: number; color: string; position: [number, number, number] }) {
  const stacks = Math.max(1, Math.ceil(height / 0.1));
  
  return (
    <group position={position}>
      {Array.from({ length: stacks }).map((_, i) => (
        <Box
          key={i}
          args={[0.8, 0.08, 0.4]}
          position={[0, i * 0.1, 0]}
        >
          <meshStandardMaterial color={color} metalness={0.15} roughness={0.45} emissive={color} emissiveIntensity={0.12} />
        </Box>
      ))}
    </group>
  );
}

// Timeline step advancer driven by the render loop (more reliable than setInterval in some browsers)
function StepAdvancer({ length, duration = 4 }: { length: number; duration?: number }) {
  const { playing, step, setStep } = useTimeline();
  const acc = useRef(0);
  useFrame((_, delta) => {
    if (!playing) return;
    acc.current += delta;
    if (acc.current >= duration) {
      acc.current = 0;
      const next = ((step + 1) % Math.max(1, length));
      setStep(next);
    }
  });
  return null;
}

// Cinematic camera movement constrained to front-of-stage views
function CinematicCamera() {
  const { camera } = useThree();
  const t = useRef(0);
  const { step, typical, invested } = useTimeline();

  // Key vantage points that always keep the camera in front of the stacks (z > 6)
  const vantage = [
    new THREE.Vector3(0, 5.5, 12),
    new THREE.Vector3(4, 6.5, 11),
    new THREE.Vector3(-4, 6, 11.5),
    new THREE.Vector3(0, 7.5, 13),
  ];

  useFrame((_, delta) => {
    t.current += delta * 0.35;

    const len = vantage.length;
    const idx = len && Number.isFinite(step) ? ((step % len) + len) % len : 0;
    const base = vantage[idx] ?? vantage[0];

    // Subtle bobbing in X/Y, never crossing behind (Z fixed)
    const bobX = Math.sin(t.current * 0.6) * 0.8;
    const bobY = Math.sin(t.current * 0.8) * 0.4;
    const target = new THREE.Vector3(base.x + bobX, base.y + bobY, base.z);

    camera.position.lerp(target, Math.min(1, delta * 1.5));

    // Aim roughly at the midpoint height of the stacks
    const midHeight = (((typical + invested) / 2) / 25000) * 10;
    const lookY = Math.max(2, midHeight + 1);
    camera.lookAt(0, lookY, 0);
  });

  return null;
}

// 3D Text labels
function SceneText({ text, position, size = 1 }: { text: string; position: [number, number, number]; size?: number }) {
  return (
    <Text
      position={position}
      fontSize={size}
      color="white"
      anchorX="center"
      anchorY="middle"
    >
      {text}
    </Text>
  );
}

// Main 3D Scene
function Scene() {
  const { typical, invested, step } = useTimeline();
  const typicalHeight = (typical / 25000) * 10;
  const investedHeight = (invested / 25000) * 10;
  
  return (
    <>
      {/* Lighting */}
      {/* Brighter key light */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1.6} castShadow />
      <spotLight position={[10, 12, 0]} angle={0.5} penumbra={0.8} intensity={1.5} />
      <spotLight position={[-8, 8, -6]} angle={0.4} penumbra={0.6} intensity={0.9} color="#4f46e5" />
      
      {/* Money stacks */}
      <MoneyStack height={typicalHeight} color="#9ca3af" position={[-3, 0, 0]} />
      <MoneyStack height={investedHeight} color="#22c55e" position={[3, 0, 0]} />
      
      {/* Reflective floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[50, 50]} />
        <MeshReflectorMaterial
          blur={[200, 80]}
          resolution={1024}
          mixBlur={0.8}
          mixStrength={25}
          roughness={0.8}
          depthScale={1.0}
          minDepthThreshold={0.3}
          maxDepthThreshold={1.2}
          color="#0a0a0a"
          metalness={0.4}
        />
      </mesh>
      
      {/* Labels floating above stacks */}
      <SceneText text="CASH SAVINGS" position={[-3, typicalHeight + 1.5, 0]} size={0.5} />
      <SceneText text={`$${typical.toLocaleString()}`} position={[-3, typicalHeight + 0.8, 0]} size={0.3} />
      
      <SceneText text="INVESTED (EXAMPLE)" position={[3, investedHeight + 1.5, 0]} size={0.5} />
      <SceneText text={`$${invested.toLocaleString()}`} position={[3, investedHeight + 0.8, 0]} size={0.3} />
      
      <CinematicCamera />
    </>
  );
}

export default function MoneyDemoPage() {
  const { step, playing, setStep, setPlaying, setAmounts } = useTimeline();
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Prevent scrolling on this page and hide any global headers/backgrounds
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    const headers = Array.from(document.querySelectorAll('header')) as HTMLElement[];
    const prevDisplays = headers.map(h => h.style.display);
    headers.forEach(h => (h.style.display = 'none'));
    const patterns = Array.from(document.querySelectorAll('.bg-pattern')) as HTMLElement[];
    const prevPatternDisplays = patterns.map(p => p.style.display);
    patterns.forEach(p => (p.style.display = 'none'));
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      headers.forEach((h, i) => (h.style.display = prevDisplays[i] ?? ''));
      patterns.forEach((p, i) => (p.style.display = prevPatternDisplays[i] ?? ''));
    };
  }, []);
  
  const timeline = useMemo(() => [
    {
      year: "YEAR 1",
      subtitle: "Example: $100/mo (7% annualized)",
      typical: 1200,       // cash savings (no growth)
      invested: 1240,      // approx FV of $100/mo after 12 months @ 7%
      facts: [
        "Balance ≈ $1,240",
        "Contrib $1,200 • Growth ≈ $40",
        "Illustration only — not investment advice"
      ],
    },
    {
      year: "YEAR 3",
      subtitle: "$100/mo (7% annualized)",
      typical: 3600,
      invested: 3990,      // approx FV after 36 months
      facts: [
        "Balance ≈ $3,990",
        "Contrib $3,600 • Growth ≈ $390",
        "Rounded; actual outcomes vary"
      ],
    },
    {
      year: "YEAR 5",
      subtitle: "$100/mo (7% annualized)",
      typical: 6000,
      invested: 7160,      // approx FV after 60 months
      facts: [
        "Balance ≈ $7,160",
        "Contrib $6,000 • Growth ≈ $1,160",
        "For illustration; replace with your own model"
      ],
    },
    {
      year: "YEAR 10",
      subtitle: "$100/mo (7% annualized)",
      typical: 12000,
      invested: 17330,     // approx FV after 120 months
      facts: [
        "Balance ≈ $17,330",
        "Contrib $12,000 • Growth ≈ $5,330",
        "Long-term compounding example"
      ],
    },
  ], []);
  
  // Auto-advance handled by StepAdvancer inside the Canvas render loop
  
  // Update amounts when step changes
  useEffect(() => {
    const current = timeline[step];
    if (!current) return; // Guard against undefined
    setAmounts(current.typical, current.invested);
    
    // Confetti on final step
    if (step === timeline.length - 1) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 100);
    }
  }, [step, setAmounts, timeline]);
  
  // Trigger confetti
  useEffect(() => {
    if (showConfetti) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#4f46e5', '#ffffff'],
      });
    }
  }, [showConfetti]);
  
  const current = timeline[step] || timeline[0]; // Fallback to first item
  
  return (
    <div className="demo-page fixed inset-0 bg-black overflow-hidden z-[60]">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [10, 6, 12], fov: 50 }}
        shadows
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor('#000000');
          // Brighten overall scene
          // @ts-ignore
          gl.toneMappingExposure = 1.25;
        }}
      >
        <Scene />
        <StepAdvancer length={timeline.length} duration={4} />
        <fog attach="fog" args={['#000000', 10, 50]} />
      </Canvas>
      
      {/* Text Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top text and promo */}
        <div className="absolute top-12 left-12 right-12 flex items-start justify-between gap-8">
          <div>
            <h1 className="text-6xl font-bold text-white mb-2">
              {current.year}
            </h1>
            <p className="text-2xl text-white/70">
              {current.subtitle}
            </p>
          </div>
          <div className="hidden md:block max-w-sm text-right">
            <div className="text-white/80 text-sm leading-relaxed">
              <div className="font-semibold text-white mb-1">InvestBuddy Beta Offer</div>
              <div>Get your first $100 matched when you invest $100 in a shared goal with a friend.</div>
              <div className="text-[11px] text-white/60 mt-1">Limited beta. Terms apply. Demo copy — replace with your actual promo.</div>
            </div>
            <a href="/goals/new?withFriend=1&promo=FIRST100" className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition pointer-events-auto">
              Start a shared goal →
            </a>
          </div>
        </div>
        
        {/* Bottom-right facts (concise, non-corny) */}
        <div className="absolute bottom-12 right-12 w-full max-w-sm">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 pointer-events-auto">
            <div className="text-white/90 text-sm mb-2">{current.subtitle}</div>
            <ul className="text-white/80 text-sm space-y-1">
              {(current.facts ?? []).map((f, i) => (
                <li key={i}>• {f}</li>
              ))}
            </ul>
            <div className="text-[11px] text-white/50 mt-2">Example only — replace with your own stats & citations.</div>
          </div>
        </div>
        
        {/* Progress dots */}
        <div className="absolute bottom-12 right-12 flex gap-2">
          {timeline.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-500 ${
                i === step ? 'bg-white w-8' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
      
      {/* Controls (hidden by default, press space to show) */}
      <div 
        className="absolute top-4 right-4 opacity-0 hover:opacity-100 transition-opacity pointer-events-auto"
      >
        <button
          onClick={() => setPlaying(!playing)}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm"
        >
          {playing ? 'Pause' : 'Play'}
        </button>
      </div>
    </div>
  );
}
