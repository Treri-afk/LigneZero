import { EffectComposer, Bloom, Vignette, Noise, ChromaticAberration, Scanline } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Vector2 } from 'three';

/**
 * Post-traitement accordé à la DA brutalist : bloom RETENU (juste un halo
 * léger sur le rouge), aberration chromatique SUBTILE (bords des lentilles),
 * scanlines discrètes (cockpit), vignette marquée, grain film. Pas de néon.
 */
export function PostFX() {
  return (
    <EffectComposer>
      <Bloom intensity={0.35} luminanceThreshold={0.82} luminanceSmoothing={0.2} mipmapBlur />
      <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={new Vector2(0.0008, 0.0008)} radialModulation={false} modulationOffset={0} />
      <Scanline blendFunction={BlendFunction.OVERLAY} density={1.15} opacity={0.06} />
      <Vignette eskil={false} offset={0.25} darkness={0.85} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.35} />
    </EffectComposer>
  );
}
