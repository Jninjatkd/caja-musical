import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const BRIDE_GLB_URL = encodeURI('/models/bunny plush 3d model.glb');
export const GROOM_GLB_URL = encodeURI('/models/plush bunny 3d model.glb');

export interface TernurinDeformUniforms {
  uTorsoSway: { value: number };
  uTorsoPitch: { value: number };
  uHeadTurn: { value: number };
  uHeadTilt: { value: number };
  uLeftArmRaise: { value: number };
  uRightArmRaise: { value: number };
  uInnerReachZ: { value: number };
  uInnerSideSign: { value: number }; // +1 for bride (right arm is inner), -1 for groom (left arm is inner)
  uStepLiftLeft: { value: number };
  uStepLiftRight: { value: number };
  uSkirtSwish: { value: number };
}

export interface LoadedTernurin {
  group: THREE.Group;
  uniforms: TernurinDeformUniforms;
  hasSkeleton: boolean;
  builtInClipsCount: number;
  dispose: () => void;
}

function attachSoftArticulationShader(
  material: THREE.Material,
  uniforms: TernurinDeformUniforms,
  cacheKey: string
): void {
  material.customProgramCacheKey = () => cacheKey;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader =
      `
      uniform float uTorsoSway;
      uniform float uTorsoPitch;
      uniform float uHeadTurn;
      uniform float uHeadTilt;
      uniform float uLeftArmRaise;
      uniform float uRightArmRaise;
      uniform float uInnerReachZ;
      uniform float uInnerSideSign;
      uniform float uStepLiftLeft;
      uniform float uStepLiftRight;
      uniform float uSkirtSwish;

      mat2 rot2(float a) {
        float c = cos(a);
        float s = sin(a);
        return mat2(c, -s, s, c);
      }
      ` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>

      // Original GLB coordinates are normalized around y in [0..1], x in [-0.29..0.29]
      float ny = clamp(transformed.y, 0.0, 1.0);
      float ax = abs(transformed.x);

      // 1. Alternating dance step lift & lower dress/leg swish (y < 0.36)
      float footWeight = 1.0 - smoothstep(0.05, 0.34, ny);
      float leftWeight = smoothstep(-0.02, -0.10, transformed.x);
      float rightWeight = smoothstep(0.02, 0.10, transformed.x);
      transformed.y += footWeight * (leftWeight * uStepLiftLeft + rightWeight * uStepLiftRight);

      float skirtWeight = (1.0 - smoothstep(0.18, 0.42, ny)) * smoothstep(0.0, 0.12, ny);
      transformed.x += skirtWeight * uSkirtSwish;
      transformed.z += skirtWeight * abs(uSkirtSwish) * 0.25;

      // 2. Arm articulation around shoulders (|x| > 0.14, y in 0.32..0.60)
      float armBandY = smoothstep(0.30, 0.40, ny) * (1.0 - smoothstep(0.55, 0.64, ny));
      float leftArmW = smoothstep(-0.12, -0.20, transformed.x) * armBandY;
      float rightArmW = smoothstep(0.12, 0.20, transformed.x) * armBandY;

      if (leftArmW > 0.001) {
        vec3 lp = transformed - vec3(-0.15, 0.51, 0.0);
        lp.xy = rot2(-uLeftArmRaise * leftArmW) * lp.xy;
        if (uInnerSideSign < 0.0) {
          lp.yz = rot2(-uInnerReachZ * leftArmW) * lp.yz;
        }
        transformed = lp + vec3(-0.15, 0.51, 0.0);
      }

      if (rightArmW > 0.001) {
        vec3 rp = transformed - vec3(0.15, 0.51, 0.0);
        rp.xy = rot2(uRightArmRaise * rightArmW) * rp.xy;
        if (uInnerSideSign > 0.0) {
          rp.yz = rot2(-uInnerReachZ * rightArmW) * rp.yz;
        }
        transformed = rp + vec3(0.15, 0.51, 0.0);
      }

      // 3. Head gaze turn & affectionate tilt around neck pivot (y > 0.56)
      float headW = smoothstep(0.52, 0.64, ny);
      if (headW > 0.001) {
        vec3 hp = transformed - vec3(0.0, 0.56, 0.0);
        hp.xz = rot2(-uHeadTurn * headW) * hp.xz;
        hp.xy = rot2(uHeadTilt * headW) * hp.xy;
        transformed = hp + vec3(0.0, 0.56, 0.0);
      }

      // 4. Upper torso waltz sway & forward bow around waist pivot (y > 0.35)
      float torsoW = smoothstep(0.32, 0.50, ny);
      if (torsoW > 0.001) {
        vec3 tp = transformed - vec3(0.0, 0.35, 0.0);
        tp.xy = rot2(uTorsoSway * torsoW) * tp.xy;
        tp.yz = rot2(uTorsoPitch * torsoW) * tp.yz;
        transformed = tp + vec3(0.0, 0.35, 0.0);
      }
      `
    );
  };
  material.needsUpdate = true;
}

async function loadSingleTernurin(
  loader: GLTFLoader,
  url: string,
  targetHeight: number,
  innerSideSign: number,
  cacheKey: string
): Promise<LoadedTernurin> {
  const gltf = await new Promise<{
    scene: THREE.Group;
    animations: THREE.AnimationClip[];
  }>((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });

  const model = gltf.scene;

  // Inspect for skeleton / built-in animations truthfully
  let hasSkeleton = false;
  const disposables: Array<{ dispose: () => void }> = [];

  const uniforms: TernurinDeformUniforms = {
    uTorsoSway: { value: 0 },
    uTorsoPitch: { value: 0 },
    uHeadTurn: { value: 0 },
    uHeadTilt: { value: 0 },
    uLeftArmRaise: { value: 0 },
    uRightArmRaise: { value: 0 },
    uInnerReachZ: { value: 0 },
    uInnerSideSign: { value: innerSideSign },
    uStepLiftLeft: { value: 0 },
    uStepLiftRight: { value: 0 },
    uSkirtSwish: { value: 0 },
  };

  model.traverse((child) => {
    if ((child as THREE.SkinnedMesh).isSkinnedMesh || (child as THREE.Bone).isBone) {
      hasSkeleton = true;
    }

    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (mesh.geometry) disposables.push(mesh.geometry);

      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mat) => {
        if (!mat) return;
        disposables.push(mat);

        const std = mat as THREE.MeshStandardMaterial;
        if (std.map) {
          std.map.colorSpace = THREE.SRGBColorSpace;
          std.map.needsUpdate = true;
          disposables.push(std.map);
        }
        if (std.normalMap) disposables.push(std.normalMap);
        if (std.roughnessMap) disposables.push(std.roughnessMap);
        if (std.metalnessMap) disposables.push(std.metalnessMap);

        if (std.isMeshStandardMaterial) {
          // Soft plush & fabric response under warm studio lighting
          std.envMapIntensity = 0.72;
          std.roughness = Math.max(0.68, std.roughness || 0.78);
          std.metalness = Math.min(0.08, std.metalness || 0.0);
        }

        // Apply soft vertex articulation when no rigged skeleton exists
        if (!hasSkeleton) {
          attachSoftArticulationShader(mat, uniforms, cacheKey);
        }
      });
    }
  });

  // Compute bounding box and normalize to sit flush on y=0 with desired height
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const scale = size.y > 0.001 ? targetHeight / size.y : 1;

  model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
  model.scale.setScalar(scale);

  const wrapper = new THREE.Group();
  wrapper.add(model);

  const dispose = () => {
    disposables.forEach((d) => {
      try {
        d.dispose();
      } catch {
        // Ignore
      }
    });
  };

  return {
    group: wrapper,
    uniforms,
    hasSkeleton,
    builtInClipsCount: gltf.animations?.length ?? 0,
    dispose,
  };
}

export interface LoadedCoupleModels {
  bride: LoadedTernurin;
  groom: LoadedTernurin;
  dispose: () => void;
}

export async function loadCoupleTernurines(
  onProgress?: (fraction: number) => void
): Promise<LoadedCoupleModels> {
  const manager = new THREE.LoadingManager();
  if (onProgress) {
    manager.onProgress = (_url, loaded, total) => {
      if (total > 0) onProgress(Math.min(1, loaded / total));
    };
  }

  const loader = new GLTFLoader(manager);
  const TARGET_HEIGHT = 1.16;

  // Load both distinct GLB models simultaneously
  const [bride, groom] = await Promise.all([
    loadSingleTernurin(loader, BRIDE_GLB_URL, TARGET_HEIGHT, 1.0, 'ternurin-bride-v1'),
    loadSingleTernurin(loader, GROOM_GLB_URL, TARGET_HEIGHT, -1.0, 'ternurin-groom-v1'),
  ]);

  return {
    bride,
    groom,
    dispose: () => {
      bride.dispose();
      groom.dispose();
    },
  };
}
