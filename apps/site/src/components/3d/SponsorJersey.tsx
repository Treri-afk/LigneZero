import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Text, useCursor, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { PostFX } from './PostFX';
import { tokens } from '@/theme/tokens';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { PlacedSponsor, JerseyAnchor } from '@/lib/jerseyAnchors';

const JERSEY_MODEL_URL = '/models/jersey.glb';

interface SponsorJerseyProps {
  placed: PlacedSponsor[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  base?: string;
  accent?: string;
}

const FORWARD = new THREE.Vector3(0, 0, 1);
const HOME = { pos: new THREE.Vector3(0, 0.35, 5), target: new THREE.Vector3(0, 0, 0), isHome: true, key: 'home' };

/* ── Maillot réel (modèle .glb, textures PBR embarquées), front +z / dos -z ── */
function Jersey() {
  const { scene } = useGLTF(JERSEY_MODEL_URL);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  return <primitive object={model} />;
}

useGLTF.preload(JERSEY_MODEL_URL);

/* ── Patch sponsor cliquable, plaqué sur la surface, orienté vers la normale ── */
function SponsorPatch({
  placed,
  selected,
  onSelect,
}: {
  placed: PlacedSponsor;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const { sponsor, anchor } = placed;
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  const quat = useMemo(() => {
    const n = new THREE.Vector3(...anchor.normal).normalize();
    return new THREE.Quaternion().setFromUnitVectors(FORWARD, n);
  }, [anchor]);

  const color = sponsor.color ?? tokens.color.accent;
  const [w, h] = anchor.size;
  const active = selected;
  const scale = active ? 1.04 : hovered ? 1.06 : 1;

  return (
    <group position={anchor.position} quaternion={[quat.x, quat.y, quat.z, quat.w]}>
      <group
        scale={scale}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(sponsor.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        {/* cadre couleur marque (déborde le patch) */}
        <mesh position={[0, 0, -0.001]}>
          <planeGeometry args={[w + 0.05, h + 0.05]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
        {/* fond du patch */}
        <mesh position={[0, 0, 0.002]}>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial
            color={active ? color : tokens.color.ink}
            roughness={0.85}
            metalness={0.04}
            emissive={color}
            emissiveIntensity={active ? 0.4 : hovered ? 0.2 : 0.06}
          />
        </mesh>
        {/* nom (logo texte — pas de fichiers logo dans le projet) */}
        <Text
          position={[0, 0, 0.012]}
          fontSize={Math.min(h * 0.44, 0.16)}
          maxWidth={w * 0.92}
          color={active ? tokens.color.ink : color}
          anchorX="center"
          anchorY="middle"
          textAlign="center"
          letterSpacing={-0.02}
          outlineWidth={active ? 0 : 0.004}
          outlineColor={tokens.color.ink}
        >
          {sponsor.name}
        </Text>
      </group>
    </group>
  );
}

/* ── Pilotage caméra : amortit position + cible vers le focus courant ── */
function CameraRig({
  focus,
  controlsRef,
  reduced,
}: {
  focus: { pos: THREE.Vector3; target: THREE.Vector3; isHome: boolean; key: string };
  controlsRef: React.RefObject<OrbitControlsImpl>;
  reduced: boolean;
}) {
  const arrived = useRef(false);
  const lastKey = useRef<string | null>(null);

  useFrame((state, dt) => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (focus.key !== lastKey.current) {
      lastKey.current = focus.key;
      arrived.current = false;
    }

    if (!arrived.current) {
      const k = reduced ? 1 : 1 - Math.exp(-6 * dt);
      state.camera.position.lerp(focus.pos, k);
      controls.target.lerp(focus.target, k);
      controls.autoRotate = false;
      if (reduced || state.camera.position.distanceTo(focus.pos) < 0.03) {
        arrived.current = true;
      }
    } else {
      // arrivé : rotation douce seulement au repos (home), sinon orbite manuelle libre
      controls.autoRotate = focus.isHome && !reduced;
      controls.autoRotateSpeed = 0.5;
    }

    controls.update();
  });

  return null;
}

export default function SponsorJersey({
  placed,
  selectedId,
  onSelect,
  accent = tokens.color.accent,
}: SponsorJerseyProps) {
  const reduced = useReducedMotion();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const focus = useMemo(() => {
    const sel = placed.find((p) => p.sponsor.id === selectedId);
    if (!sel) return HOME;
    const a: JerseyAnchor = sel.anchor;
    const pos = new THREE.Vector3(...a.position);
    const target = pos.clone();
    const n = new THREE.Vector3(...a.normal).normalize();
    pos.addScaledVector(n, a.camDist).add(new THREE.Vector3(0, 0.06, 0));
    return { pos, target, isHome: false, key: sel.sponsor.id };
  }, [placed, selectedId]);

  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      camera={{ position: [0, 0.35, 5], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      onPointerMissed={() => onSelect(null)}
    >
      <ambientLight intensity={0.5} />
      <hemisphereLight args={['#cdd3da', '#1a1715', 0.7]} />
      <spotLight position={[4, 6, 5]} angle={0.5} penumbra={0.8} intensity={3} castShadow color="#fff4ec" />
      <directionalLight position={[0, 1, 6]} intensity={1.0} color="#cfd6e0" />
      <directionalLight position={[0, 1, -6]} intensity={0.8} color="#cfd6e0" />
      <pointLight position={[-4, 1, -3]} intensity={3} color={accent} />
      <pointLight position={[3, -2, -2]} intensity={1.1} color="#5566ff" />

      <Jersey />

      {placed.map((p) => (
        <SponsorPatch
          key={p.sponsor.id}
          placed={p}
          selected={p.sponsor.id === selectedId}
          onSelect={onSelect}
        />
      ))}

      <ContactShadows position={[0, -1.55, 0]} opacity={0.5} scale={8} blur={2.6} far={4} />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        enableZoom
        minDistance={0.9}
        maxDistance={8}
        minPolarAngle={Math.PI * 0.12}
        maxPolarAngle={Math.PI * 0.88}
      />

      <CameraRig focus={focus} controlsRef={controlsRef} reduced={reduced} />

      <PostFX />
    </Canvas>
  );
}
