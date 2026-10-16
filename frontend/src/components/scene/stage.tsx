"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ContactShadows } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { scrollProgress, studioCue } from "@/components/scene/scroll";
import { useScreen } from "@/components/scene/screen-context";

const screenEye = new THREE.Vector3(-0.35, 1.18, 0.82);
const screenLook = new THREE.Vector3(-0.35, 1.18, -0.09);
const portraitEye = new THREE.Vector3();
const portraitLook = new THREE.Vector3(-0.35, 1.14, -0.13);
const monitorCenter = new THREE.Vector3(-0.35, 1.16, -0.13);
const screenCorners = [
  new THREE.Vector3(-0.74, 0.95, -0.09),
  new THREE.Vector3(0.04, 0.95, -0.09),
  new THREE.Vector3(-0.74, 1.41, -0.09),
  new THREE.Vector3(0.04, 1.41, -0.09),
];

const eyePath = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(-0.2, 1.38, 2.72),
    new THREE.Vector3(0.15, 1.48, 2.55),
    new THREE.Vector3(0.85, 1.4, 1.85),
    new THREE.Vector3(1.35, 1.52, 2.35),
    new THREE.Vector3(-0.2, 1.62, 3.7),
  ],
  false,
  "catmullrom",
  0.25,
);

const lookPath = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(-0.15, 1.08, 0.05),
    new THREE.Vector3(0.25, 1.18, 0.05),
    new THREE.Vector3(0.9, 1.25, -0.05),
    new THREE.Vector3(1.7, 1.55, -0.15),
    new THREE.Vector3(0.2, 1.2, 0.05),
  ],
  false,
  "catmullrom",
  0.25,
);

const skyVertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragment = `
  varying vec2 vUv;
  void main() {
    vec3 dusk = vec3(0.96, 0.62, 0.42);
    vec3 peach = vec3(0.98, 0.78, 0.62);
    vec3 violet = vec3(0.55, 0.38, 0.72);
    vec3 color = mix(peach, dusk, smoothstep(0.15, 0.55, vUv.y));
    color = mix(color, violet, smoothstep(0.45, 1.0, vUv.y));
    gl_FragColor = vec4(color, 1.0);
  }
`;

export function Stage() {
  const { open, setOpen } = useScreen();

  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={[1, 1.6]}
      camera={{ fov: 32, near: 0.1, far: 30, position: [-0.2, 1.38, 2.72] }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onCreated={({ gl }) => gl.setClearColor("#f0d2c4")}
      onPointerMissed={() => {
        if (open) setOpen(false);
      }}
    >
      <color attach="background" args={["#f0d2c4"]} />
      <fog attach="fog" args={["#f0d2c4", 7.5, 14]} />
      <Rig />
      <ScreenFrame />
      <Room />
    </Canvas>
  );
}

function ScreenFrame() {
  const { open, setRect } = useScreen();
  const openRef = useRef(open);
  const projected = useRef(new THREE.Vector3());
  const last = useRef({ left: 0, top: 0, width: 0, height: 0 });

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useFrame(({ camera, size }) => {
    if (!openRef.current) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const corner of screenCorners) {
      projected.current.copy(corner).project(camera);
      const x = (projected.current.x * 0.5 + 0.5) * size.width;
      const y = (-projected.current.y * 0.5 + 0.5) * size.height;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    const next = { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
    const prev = last.current;
    if (
      Math.abs(prev.left - next.left) < 0.5 &&
      Math.abs(prev.top - next.top) < 0.5 &&
      Math.abs(prev.width - next.width) < 0.5 &&
      Math.abs(prev.height - next.height) < 0.5
    ) {
      return;
    }
    last.current = next;
    setRect(next);
  });

  return null;
}

function Rig() {
  const { open } = useScreen();
  const openRef = useRef(open);
  const reduced = useRef(false);
  const reveal = useRef(0);
  const lookAt = useRef(new THREE.Vector3(-0.15, 1.08, 0.05));
  const desired = useRef(new THREE.Vector3());
  const target = useRef(new THREE.Vector3());

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useFrame((state, delta) => {
    if (reduced.current || !studioCue.open) {
      reveal.current = reduced.current ? 1 : reveal.current;
    } else {
      reveal.current = Math.min(1, reveal.current + delta * 0.45);
    }

    const viewing = openRef.current;
    const camera = state.camera as THREE.PerspectiveCamera;
    const aspect = state.size.width / Math.max(state.size.height, 1);
    const narrow = !viewing && aspect < 0.95;
    const nextFov = narrow ? 64 : 32;
    if (Math.abs(camera.fov - nextFov) > 0.1) {
      camera.fov = nextFov;
      camera.updateProjectionMatrix();
    }

    if (viewing) {
      desired.current.copy(screenEye);
      target.current.copy(screenLook);
    } else {
      const progress = reduced.current ? 0 : scrollProgress.current * (studioCue.open ? reveal.current : 0);
      eyePath.getPointAt(progress, desired.current);
      lookPath.getPointAt(progress, target.current);
      if (aspect < 0.95) {
        const vfov = (64 * Math.PI) / 180;
        const distance = 1.28 / (2 * Math.tan(vfov / 2) * Math.max(aspect, 0.32));
        portraitEye.set(monitorCenter.x, 1.28, monitorCenter.z + distance);
        const tightness = Math.min(1, (0.95 - aspect) / 0.4);
        desired.current.lerp(portraitEye, tightness);
        target.current.lerp(portraitLook, tightness);
      }
    }

    const alpha = 1 - Math.exp(-delta * (viewing ? 2.4 : 1.05));
    state.camera.position.lerp(desired.current, alpha);
    lookAt.current.lerp(target.current, alpha);
    state.camera.lookAt(lookAt.current);
  });

  return null;
}

function Room() {
  const lights = useMemo(() => {
    return Array.from({ length: 9 }, (_, index) => {
      const t = index / 8;
      return new THREE.Vector3(-0.15 + t * 2.5, 2.35 + Math.sin(index * 0.9) * 0.06, -1.55);
    });
  }, []);

  return (
    <>
      <hemisphereLight args={["#ffe7d4", "#c9a07a", 0.7]} />
      <ambientLight intensity={0.28} color="#ffe0cc" />
      <directionalLight position={[4.2, 5.2, 2.2]} intensity={1.35} color="#ffd0b0" castShadow />
      <pointLight position={[2.4, 1.8, -0.3]} intensity={22} color="#ffb27a" distance={8} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 7]} />
        <meshStandardMaterial color="#c4a06a" roughness={0.72} metalness={0.04} />
      </mesh>
      <mesh position={[0, 1.55, -2.45]} receiveShadow>
        <boxGeometry args={[7.2, 3.1, 0.12]} />
        <meshStandardMaterial color="#f3d5c6" roughness={0.9} />
      </mesh>
      <mesh position={[-3.5, 1.55, 0]} receiveShadow>
        <boxGeometry args={[0.12, 3.1, 6.2]} />
        <meshStandardMaterial color="#f6ddd0" roughness={0.9} />
      </mesh>
      <mesh position={[3.5, 1.55, 0]} receiveShadow>
        <boxGeometry args={[0.12, 3.1, 6.2]} />
        <meshStandardMaterial color="#f6ddd0" roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.08, 0]}>
        <boxGeometry args={[7.2, 0.08, 6.2]} />
        <meshStandardMaterial color="#f8e4da" roughness={1} />
      </mesh>

      <group position={[2.55, 1.72, -0.35]}>
        <mesh rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[1.7, 1.85]} />
          <shaderMaterial vertexShader={skyVertex} fragmentShader={skyFragment} />
        </mesh>
        <Frame />
      </group>

      <FairyLights points={lights} />
      <ContactShadows position={[0, 0.002, 0.2]} opacity={0.28} scale={7} blur={2.2} far={1.6} color="#8a5a3a" />

      <Desk />
    </>
  );
}

function Frame() {
  return (
    <group rotation={[0, -Math.PI / 2, 0]}>
      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[1.86, 0.06, 0.05]} />
        <meshStandardMaterial color="#efe6dc" />
      </mesh>
      <mesh position={[0, 0.95, 0.01]}>
        <boxGeometry args={[1.86, 0.06, 0.05]} />
        <meshStandardMaterial color="#efe6dc" />
      </mesh>
      <mesh position={[0, -0.95, 0.01]}>
        <boxGeometry args={[1.86, 0.06, 0.05]} />
        <meshStandardMaterial color="#efe6dc" />
      </mesh>
      <mesh position={[0.9, 0, 0.01]}>
        <boxGeometry args={[0.06, 1.9, 0.05]} />
        <meshStandardMaterial color="#efe6dc" />
      </mesh>
      <mesh position={[-0.9, 0, 0.01]}>
        <boxGeometry args={[0.06, 1.9, 0.05]} />
        <meshStandardMaterial color="#efe6dc" />
      </mesh>
    </group>
  );
}

function paintScreen(context: CanvasRenderingContext2D, blink: boolean, hot: boolean) {
  context.fillStyle = "#1c2430";
  context.fillRect(0, 0, 512, 320);
  context.fillStyle = "#8dffb0";
  context.font = "22px monospace";
  context.fillText("satish@studio", 36, 72);
  context.fillStyle = "#e7eef4";
  context.font = "18px monospace";
  context.fillText("software developer", 36, 118);
  context.fillStyle = hot ? "#e9fff2" : "#9fb0c0";
  const line = hot ? ">  open profile" : ">  click to open";
  context.fillText(line, 36, 188);
  if (blink) {
    context.fillRect(36 + context.measureText(line).width + 8, 172, 11, 20);
  }
}

function FairyLights({ points }: { points: THREE.Vector3[] }) {
  const materials = useRef<Array<THREE.MeshStandardMaterial | null>>([]);

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    materials.current.forEach((material, index) => {
      if (!material) return;
      material.emissiveIntensity = 1.5 + Math.sin(time * 1.8 + index * 0.85) * 0.85;
    });
  });

  return (
    <>
      {points.map((point, index) => (
        <mesh key={index} position={point}>
          <sphereGeometry args={[0.038, 12, 12]} />
          <meshStandardMaterial
            ref={(material) => {
              materials.current[index] = material;
            }}
            color="#fff6e4"
            emissive="#ffd7a4"
            emissiveIntensity={2}
          />
        </mesh>
      ))}
    </>
  );
}

function Desk() {
  const { open, setOpen } = useScreen();
  const [hot, setHot] = useState(false);
  const plant = useRef<THREE.Group>(null);
  const lampShade = useRef<THREE.MeshStandardMaterial>(null);
  const lamp = useRef<THREE.SpotLight>(null);
  const lampTarget = useRef<THREE.Object3D>(null);
  const painted = useRef({ blink: true, hot: false, at: 0 });
  const screen = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 320;
    const context = canvas.getContext("2d");
    if (context) paintScreen(context, true, false);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return { texture, context };
  }, []);

  useEffect(() => {
    if (lamp.current && lampTarget.current) lamp.current.target = lampTarget.current;
  }, []);

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    if (plant.current) plant.current.rotation.z = Math.sin(time * 0.7) * 0.035;
    if (lampShade.current) lampShade.current.emissiveIntensity = 0.28 + Math.sin(time * 1.3) * 0.08;

    const blink = Math.floor(time * 2) % 2 === 0;
    if (!screen.context) return;
    if (painted.current.blink === blink && painted.current.hot === hot) return;
    painted.current = { blink, hot, at: time };
    paintScreen(screen.context, blink, hot);
    screen.texture.needsUpdate = true;
  });

  return (
    <group position={[-0.15, 0, 0.15]}>
      <spotLight ref={lamp} position={[-1.02, 1.28, 0.05]} angle={0.62} penumbra={0.85} intensity={28} color="#ffe1b8" distance={3.2} castShadow />
      <object3D ref={lampTarget} position={[-0.35, 0.78, 0.12]} />
      <pointLight position={[-0.2, 1.16, 0.15]} intensity={hot ? 7 : 2.4} color="#b7ffd4" distance={1.7} />

      <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.7, 0.08, 1.25]} />
        <meshStandardMaterial color="#e0b87e" roughness={0.42} metalness={0.04} />
      </mesh>
      {[
        [-1.2, 0.36, -0.5],
        [1.2, 0.36, -0.5],
        [-1.2, 0.36, 0.5],
        [1.2, 0.36, 0.5],
      ].map((position) => (
        <mesh key={position.join("-")} position={position as [number, number, number]} castShadow>
          <boxGeometry args={[0.08, 0.72, 0.08]} />
          <meshStandardMaterial color="#b88858" roughness={0.6} />
        </mesh>
      ))}

      <group
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          document.body.style.cursor = "pointer";
          setHot(true);
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
          setHot(false);
        }}
      >
        <mesh position={[-0.2, 1.18, -0.28]} castShadow>
          <boxGeometry args={[0.92, 0.58, 0.06]} />
          <meshStandardMaterial color={hot ? "#fffaf4" : "#f4efe8"} roughness={0.4} emissive={hot ? "#ffd8b0" : "#000000"} emissiveIntensity={hot ? 0.18 : 0} />
        </mesh>
        <mesh position={[-0.2, 1.18, -0.24]}>
          <planeGeometry args={[0.78, 0.46]} />
          <meshBasicMaterial
            key={open ? "screen-open" : "screen-idle"}
            map={open ? undefined : screen.texture}
            color={open ? "#101614" : "#ffffff"}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[-0.2, 0.86, -0.4]}>
          <boxGeometry args={[0.1, 0.18, 0.06]} />
          <meshStandardMaterial color="#d9d3cb" />
        </mesh>
      </group>

      <mesh position={[-0.15, 0.8, 0.22]} receiveShadow>
        <boxGeometry args={[0.72, 0.03, 0.24]} />
        <meshStandardMaterial color="#f7f4ef" />
      </mesh>
      <mesh position={[0.55, 0.8, 0.28]}>
        <boxGeometry args={[0.12, 0.03, 0.18]} />
        <meshStandardMaterial color="#f7f4ef" />
      </mesh>

      <mesh position={[-0.95, 0.86, 0.18]} castShadow>
        <cylinderGeometry args={[0.07, 0.08, 0.12, 20]} />
        <meshStandardMaterial color="#e15a32" roughness={0.4} />
      </mesh>

      <group ref={plant} position={[0.95, 0.78, 0.05]}>
        <mesh position={[0, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.1, 0.16, 16]} />
          <meshStandardMaterial color="#f6f1ea" />
        </mesh>
        <mesh position={[0, 0.34, 0]}>
          <sphereGeometry args={[0.05, 10, 10]} />
          <meshStandardMaterial color="#2f7d49" />
        </mesh>
        {[0.4, -0.5, 1.1, 2.2].map((turn) => (
          <mesh key={turn} position={[Math.sin(turn) * 0.12, 0.32, Math.cos(turn) * 0.1]} rotation={[0.4, turn, 0.6]}>
            <planeGeometry args={[0.22, 0.12]} />
            <meshStandardMaterial color="#3f9a5c" side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>

      <group position={[-1.15, 0.78, -0.15]}>
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.44, 8]} />
          <meshStandardMaterial color="#5c534c" />
        </mesh>
        <mesh position={[0.08, 0.42, 0]} rotation={[0, 0, 0.4]}>
          <coneGeometry args={[0.12, 0.1, 12, 1, true]} />
          <meshStandardMaterial ref={lampShade} color="#f3eadf" emissive="#ffd7a8" emissiveIntensity={0.35} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}
