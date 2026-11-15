import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildGoldenKey } from '../three/buildGoldenKey';
import { buildMusicBox } from '../three/buildMusicBox';
import { LoadedCoupleModels, loadCoupleTernurines } from '../three/loadTernurines';
import { ExperiencePhase } from '../types/musicBox';
import { playLockClickSound, playMusicBoxChime } from '../utils/soundEffects';

interface MusicBoxCanvas3DProps {
  phase: ExperiencePhase;
  isMusicPlaying: boolean;
  allowSilentDance: boolean;
  onPickUpKey: () => void;
  onUnlockComplete: () => void;
  onModelsReady: (info: { loaded: boolean; error?: string; loadProgress: number }) => void;
}

const _vec2 = new THREE.Vector2();
const _targetCamPos = new THREE.Vector3();
const _targetCamLook = new THREE.Vector3();

function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeInOutCubic(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

export const MusicBoxCanvas3D: React.FC<MusicBoxCanvas3DProps> = ({
  phase,
  isMusicPlaying,
  allowSilentDance,
  onPickUpKey,
  onUnlockComplete,
  onModelsReady,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Mutable state refs read inside the WebGL animation loop so React re-renders never recreate the scene
  const phaseRef = useRef<ExperiencePhase>(phase);
  const isMusicPlayingRef = useRef(isMusicPlaying);
  const allowSilentDanceRef = useRef(allowSilentDance);
  const onPickUpKeyRef = useRef(onPickUpKey);
  const onUnlockCompleteRef = useRef(onUnlockComplete);
  const onModelsReadyRef = useRef(onModelsReady);
  const cameraAutoFollowRef = useRef(true);
  const prevPhaseRef = useRef<ExperiencePhase>(phase);

  phaseRef.current = phase;
  isMusicPlayingRef.current = isMusicPlaying;
  allowSilentDanceRef.current = allowSilentDance;
  onPickUpKeyRef.current = onPickUpKey;
  onUnlockCompleteRef.current = onUnlockComplete;
  onModelsReadyRef.current = onModelsReady;

  // Re-enable gentle camera framing whenever phase transitions automatically
  useEffect(() => {
    if (prevPhaseRef.current !== phase) {
      cameraAutoFollowRef.current = true;
      prevPhaseRef.current = phase;
    }
  }, [phase]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    // Studio reflection environment for gold, crystal, and pearl PBR materials
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const aspect = (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight);
    const camera = new THREE.PerspectiveCamera(36, aspect, 0.1, 40);
    camera.position.set(2.35, 2.85, 4.95);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 3.4;
    controls.maxDistance = 8.4;
    controls.minPolarAngle = 0.35;
    controls.maxPolarAngle = Math.PI / 2 - 0.08;
    controls.target.set(0, 0.72, 0);
    controls.update();

    controls.addEventListener('start', () => {
      cameraAutoFollowRef.current = false;
    });

    // Warm 3-Point Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xfff5f0, 0xe8c8d2, 1.05);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff0df, 1.9);
    keyLight.position.set(3.8, 6.2, 4.4);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 16;
    keyLight.shadow.camera.left = -4;
    keyLight.shadow.camera.right = 4;
    keyLight.shadow.camera.top = 4;
    keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffdce8, 0.85);
    rimLight.position.set(-4.2, 3.6, -3.5);
    scene.add(rimLight);

    // Build 3D Music Box & Golden Key
    const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const musicBox = buildMusicBox(maxAnisotropy);
    scene.add(musicBox.root);

    const goldenKey = buildGoldenKey();
    goldenKey.group.visible = false;
    scene.add(goldenKey.group);

    // Couple root standing inside the music box on the turntable disc
    const dancersRoot = new THREE.Group();
    dancersRoot.position.set(0, musicBox.turntableTopY, 0);
    dancersRoot.visible = false;
    musicBox.root.add(dancersRoot);

    let coupleModels: LoadedCoupleModels | null = null;
    let isDisposed = false;

    loadCoupleTernurines((progress) => {
      if (!isDisposed) {
        onModelsReadyRef.current({ loaded: false, loadProgress: progress });
      }
    })
      .then((models) => {
        if (isDisposed) {
          models.dispose();
          return;
        }
        coupleModels = models;
        models.bride.group.position.set(-0.42, 0, 0);
        models.groom.group.position.set(0.42, 0, 0);
        dancersRoot.add(models.bride.group);
        dancersRoot.add(models.groom.group);
        onModelsReadyRef.current({ loaded: true, loadProgress: 1 });
      })
      .catch((err) => {
        if (!isDisposed) {
          onModelsReadyRef.current({
            loaded: false,
            loadProgress: 0,
            error: err instanceof Error ? err.message : 'Error al cargar los modelos GLB.',
          });
        }
      });

    // Raycasting for picking up the 3D Golden Key
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);

    const updatePointerNdc = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      _vec2.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      _vec2.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (phaseRef.current !== 'key-ready' || !goldenKey.group.visible) {
        renderer.domElement.style.cursor = 'grab';
        return;
      }
      updatePointerNdc(e.clientX, e.clientY);
      raycaster.setFromCamera(_vec2, camera);
      const hits = raycaster.intersectObject(goldenKey.hitProxy, false);
      renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (phaseRef.current !== 'key-ready' || !goldenKey.group.visible) return;
      updatePointerNdc(e.clientX, e.clientY);
      raycaster.setFromCamera(_vec2, camera);
      const hits = raycaster.intersectObject(goldenKey.hitProxy, false);
      if (hits.length > 0) {
        renderer.domElement.style.cursor = 'default';
        onPickUpKeyRef.current();
      }
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // Resize handling
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation state variables
    let frameId = 0;
    let lastTs = performance.now();
    let idleClock = 0;
    let danceClock = 0;
    let danceSpeed = 0;
    let unlockClock = 0;
    let unlockClickPlayed = false;
    let unlockChimePlayed = false;
    let unlockDoneSignaled = false;
    let endClock = 0;

    // Software WebGL safe pacing helper
    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      if (!sync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const poll = () => {
        const st = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (st === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const animate = (now: number) => {
      if (isDisposed) return;
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;
      idleClock += dt;

      const currentPhase = phaseRef.current;

      // Reset unlock sequence trackers when returning to locked/key-ready
      if (currentPhase === 'locked' || currentPhase === 'key-ready') {
        unlockClock = 0;
        unlockClickPlayed = false;
        unlockChimePlayed = false;
        unlockDoneSignaled = false;
        danceClock = 0;
        danceSpeed = 0;
        endClock = 0;
        musicBox.lockLatch.rotation.z = THREE.MathUtils.damp(musicBox.lockLatch.rotation.z, 0, 8, dt);
        musicBox.lockGlowMaterial.emissive.setHex(0x000000);
        musicBox.lockGlowMaterial.emissiveIntensity = 0;
      }

      // ==================== 1. GOLDEN KEY STATE MACHINE ====================
      if (currentPhase === 'key-ready') {
        goldenKey.group.visible = true;
        goldenKey.group.scale.setScalar(
          THREE.MathUtils.damp(goldenKey.group.scale.x || 0.01, 1.0, 5, dt)
        );
        goldenKey.group.position.set(
          1.15,
          1.78 + Math.sin(idleClock * 2.4) * 0.07,
          2.05
        );
        goldenKey.group.rotation.set(
          -0.24,
          -0.45 + Math.sin(idleClock * 1.4) * 0.28,
          Math.sin(idleClock * 2.0) * 0.08
        );
      } else if (currentPhase === 'unlocking') {
        goldenKey.group.visible = true;
        unlockClock += dt;
        const kPos = musicBox.keyholeLocalPos;

        if (unlockClock < 0.9) {
          // Steps 1–3: Travel toward lock and align axially with keyhole
          const p = easeInOutCubic(unlockClock / 0.9);
          goldenKey.group.position.set(
            lerp(1.15, kPos.x, p),
            lerp(1.78, kPos.y, p),
            lerp(2.05, kPos.z + 0.42, p)
          );
          goldenKey.group.rotation.set(
            lerp(-0.24, 0, p),
            lerp(-0.45, 0, p),
            lerp(0.08, 0, p)
          );
          goldenKey.group.scale.setScalar(1);
        } else if (unlockClock < 1.55) {
          // Step 4: Slide physically into the keyhole (-Z)
          const p = easeInOutCubic((unlockClock - 0.9) / 0.65);
          goldenKey.group.position.set(kPos.x, kPos.y, lerp(kPos.z + 0.42, kPos.z + 0.14, p));
          goldenKey.group.rotation.set(0, 0, 0);
        } else if (unlockClock < 2.35) {
          // Steps 5–7: Turn slowly 90°, click sound, unlatch & glow lock!
          const p = easeInOutCubic((unlockClock - 1.55) / 0.8);
          goldenKey.group.position.set(kPos.x, kPos.y, kPos.z + 0.14);
          goldenKey.group.rotation.set(0, 0, -p * (Math.PI / 2));

          if (p > 0.25 && !unlockClickPlayed) {
            unlockClickPlayed = true;
            playLockClickSound();
          }
          if (p > 0.35) {
            const unlatchP = Math.min(1, (p - 0.35) / 0.65);
            musicBox.lockLatch.rotation.z = -unlatchP * 0.72;
            musicBox.lockGlowMaterial.emissive.setHex(0xe89ab0);
            musicBox.lockGlowMaterial.emissiveIntensity = unlatchP * 0.55;
          }
        } else if (unlockClock < 3.05) {
          // Step 8: Withdraw key cleanly and dissolve scale
          const p = easeInOutCubic((unlockClock - 2.35) / 0.7);
          goldenKey.group.position.set(
            kPos.x,
            lerp(kPos.y, kPos.y + 0.28, p),
            lerp(kPos.z + 0.14, kPos.z + 0.85, p)
          );
          goldenKey.group.rotation.set(0, 0, -Math.PI / 2);
          goldenKey.group.scale.setScalar(Math.max(0.001, 1 - p));
        } else {
          // Step 9: Key hidden, play soft music-box chime & signal opening!
          goldenKey.group.visible = false;
          if (!unlockChimePlayed) {
            unlockChimePlayed = true;
            playMusicBoxChime();
          }
          if (!unlockDoneSignaled && unlockClock > 3.25) {
            unlockDoneSignaled = true;
            onUnlockCompleteRef.current();
          }
        }
      } else {
        goldenKey.group.visible = false;
      }

      // ==================== 2. HINGED LID & STAGE LIGHTING ====================
      const isOpenState =
        currentPhase === 'opening' ||
        currentPhase === 'playing' ||
        currentPhase === 'paused';

      const targetLidRot = isOpenState ? -Math.PI * 0.58 : 0;
      musicBox.lidPivot.rotation.x = THREE.MathUtils.damp(
        musicBox.lidPivot.rotation.x,
        targetLidRot,
        currentPhase === 'ending' ? 1.8 : 2.6,
        dt
      );

      const targetSpot = isOpenState ? 2.6 : 0;
      musicBox.stageSpotlight.intensity = THREE.MathUtils.damp(
        musicBox.stageSpotlight.intensity,
        targetSpot,
        3.5,
        dt
      );

      // Show couple only once lid begins lifting so nothing clips through closed lid
      const lidLiftFraction = Math.min(1, Math.abs(musicBox.lidPivot.rotation.x) / 0.45);
      dancersRoot.visible = lidLiftFraction > 0.12 && currentPhase !== 'finale';

      // Fade/float whole music box down gently near end of closing sequence
      if (currentPhase === 'ending') {
        endClock += dt;
        const fadeOutStart = Math.max(0, (endClock - 2.1) / 1.4);
        const boxScale = Math.max(0.01, 1 - easeInOutCubic(fadeOutStart) * 0.18);
        musicBox.root.scale.setScalar(boxScale);
        musicBox.root.position.y = -easeInOutCubic(fadeOutStart) * 0.55;
      } else if (currentPhase === 'finale') {
        musicBox.root.visible = false;
      } else {
        musicBox.root.visible = true;
        musicBox.root.scale.setScalar(1);
        musicBox.root.position.y = 0;
      }

      // ==================== 3. TURNTABLE, KEY & COUPLE WALTZ CHOREOGRAPHY ====================
      const activelyDancing =
        currentPhase === 'opening' ||
        (currentPhase === 'playing' && (isMusicPlayingRef.current || allowSilentDanceRef.current));

      const targetSpeed =
        currentPhase === 'playing' && (isMusicPlayingRef.current || allowSilentDanceRef.current)
          ? 1
          : currentPhase === 'opening'
            ? 0.42
            : 0;

      const rampRate =
        currentPhase === 'paused' ? 8.0 : currentPhase === 'ending' ? 1.5 : 3.0;
      danceSpeed = lerp(danceSpeed, targetSpeed, 1 - Math.exp(-rampRate * dt));

      if (activelyDancing || danceSpeed > 0.004) {
        danceClock += dt * danceSpeed;
        musicBox.turntableGroup.rotation.y += dt * 0.42 * danceSpeed;
        musicBox.windKeyGroup.rotation.x += dt * 1.45 * danceSpeed;
      }

      const endBlend =
        currentPhase === 'ending' || currentPhase === 'finale'
          ? Math.min(1, endClock / 2.0)
          : 0;
      const endFade = 1 - endBlend;

      if (coupleModels) {
        const t = danceClock;
        const waltzBeat = t * 2.15;
        const stepBeat = t * 4.3;

        // Approach & separate gracefully
        const closeness = 0.5 + 0.5 * Math.sin(t * 0.52);
        const halfGap = lerp(lerp(0.46, 0.36, closeness), 0.35, endBlend);

        // Romantic gaze moment ("mirarse de frente")
        const gazeWave = Math.max(0, Math.sin(t * 0.42 - 0.55));
        const gazeBlend = Math.pow(gazeWave, 2.0);

        // Periodic coordinated 360° couple waltz orbit ("giros de pareja")
        const spinCycle = t % 13.5;
        let coupleOrbitRad = 0;
        let spinPeak = 0;
        if (spinCycle > 7.4 && spinCycle < 11.9) {
          const sn = (spinCycle - 7.4) / 4.5;
          coupleOrbitRad = easeInOutCubic(sn) * Math.PI * 2;
          spinPeak = Math.sin(sn * Math.PI);
        }

        // Elliptical waltz travel inside the disc
        const centerX = Math.sin(t * 0.62) * 0.14 * endFade;
        const centerZ = Math.cos(t * 0.62) * 0.12 * endFade;

        const cosO = Math.cos(coupleOrbitRad);
        const sinO = Math.sin(coupleOrbitRad);

        // Couple orbits together around shared center (never spinning independently)
        const brideX = centerX - halfGap * cosO;
        const brideZ = centerZ + halfGap * sinO;
        const groomX = centerX + halfGap * cosO;
        const groomZ = centerZ - halfGap * sinO;

        const stepBounceB = Math.abs(Math.sin(stepBeat)) * 0.032 * endFade;
        const stepBounceG = Math.abs(Math.sin(stepBeat + 0.28)) * 0.03 * endFade;

        coupleModels.bride.group.position.set(brideX, stepBounceB, brideZ);
        coupleModels.groom.group.position.set(groomX, stepBounceG, groomZ);

        // Coupled inward facing + shared orbit rotation
        const inwardTurn = lerp(0.28 + 0.45 * gazeBlend, 0.62, endBlend);
        const idleTurn = Math.sin(waltzBeat * 0.5) * 0.12 * endFade;
        coupleModels.bride.group.rotation.y = coupleOrbitRad + inwardTurn + idleTurn;
        coupleModels.groom.group.rotation.y = coupleOrbitRad - inwardTurn + idleTurn;

        // GPU vertex-shader soft articulation (torso sway, head tilt/gaze, arm hand-hold, leg steps)
        const sway = Math.sin(waltzBeat) * 0.085 * endFade;
        const stepL = Math.max(0, Math.sin(stepBeat)) * 0.045 * endFade;
        const stepR = Math.max(0, -Math.sin(stepBeat)) * 0.045 * endFade;
        const holdIntensity = lerp(0.55 + 0.45 * closeness, 1.0, Math.max(gazeBlend, endBlend));

        // Bride shader uniforms (right arm is inner arm toward Groom)
        const bu = coupleModels.bride.uniforms;
        bu.uTorsoSway.value = sway + gazeBlend * 0.04 + endBlend * 0.05;
        bu.uTorsoPitch.value = Math.sin(stepBeat) * 0.035 * endFade + endBlend * 0.04;
        bu.uHeadTurn.value = lerp(0.16 + gazeBlend * 0.24, 0.28, endBlend);
        bu.uHeadTilt.value = lerp(Math.sin(waltzBeat) * 0.06 + gazeBlend * 0.08, 0.11, endBlend);
        bu.uLeftArmRaise.value = 0.12 + Math.sin(waltzBeat + 0.5) * 0.14 * endFade + spinPeak * 0.18;
        bu.uRightArmRaise.value = 0.22 * holdIntensity + spinPeak * 0.16;
        bu.uInnerReachZ.value = 0.24 * holdIntensity;
        bu.uStepLiftLeft.value = stepL * 0.4;
        bu.uStepLiftRight.value = stepR * 0.4;
        bu.uSkirtSwish.value = Math.sin(waltzBeat - 0.5) * 0.035 * endFade;

        // Groom shader uniforms (left arm is inner arm toward Bride)
        const gu = coupleModels.groom.uniforms;
        gu.uTorsoSway.value = sway - gazeBlend * 0.04 - endBlend * 0.05;
        gu.uTorsoPitch.value = Math.sin(stepBeat + 0.25) * 0.032 * endFade + endBlend * 0.04;
        gu.uHeadTurn.value = -lerp(0.16 + gazeBlend * 0.24, 0.28, endBlend);
        gu.uHeadTilt.value = -lerp(Math.sin(waltzBeat) * 0.06 + gazeBlend * 0.08, 0.11, endBlend);
        gu.uLeftArmRaise.value = 0.22 * holdIntensity + spinPeak * 0.16;
        gu.uRightArmRaise.value = 0.12 + Math.sin(waltzBeat + 0.5) * 0.14 * endFade + spinPeak * 0.18;
        gu.uInnerReachZ.value = 0.24 * holdIntensity;
        gu.uStepLiftLeft.value = stepL;
        gu.uStepLiftRight.value = stepR;
        gu.uSkirtSwish.value = Math.sin(waltzBeat - 0.4) * 0.014 * endFade;
      }

      // ==================== 4. SMOOTH CAMERA CHOREOGRAPHY ====================
      if (cameraAutoFollowRef.current) {
        if (currentPhase === 'locked') {
          _targetCamPos.set(2.25, 2.85, 4.95);
          _targetCamLook.set(0, 0.68, 0);
        } else if (currentPhase === 'key-ready' || currentPhase === 'unlocking') {
          _targetCamPos.set(0.85, 2.25, 4.85);
          _targetCamLook.set(0.15, 0.86, 0.45);
        } else if (isOpenState) {
          _targetCamPos.set(0.28, 2.95, 4.45);
          _targetCamLook.set(0, 1.12, 0.04);
        } else {
          _targetCamPos.set(1.4, 2.6, 5.1);
          _targetCamLook.set(0, 0.72, 0);
        }

        camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetCamPos.x, 3.2, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetCamPos.y, 3.2, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetCamPos.z, 3.2, dt);

        controls.target.x = THREE.MathUtils.damp(controls.target.x, _targetCamLook.x, 3.2, dt);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, _targetCamLook.y, 3.2, dt);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, _targetCamLook.z, 3.2, dt);
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(() => {
          if (!isDisposed) animate(performance.now());
        });
      } else {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    if (isSoftwareGl) {
      animate(performance.now());
    } else {
      frameId = window.requestAnimationFrame(animate);
    }

    return () => {
      isDisposed = true;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);

      controls.dispose();
      musicBox.dispose();
      goldenKey.dispose();
      coupleModels?.dispose();
      envTarget.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 z-10 w-full h-full touch-none"
      aria-label="Escena 3D de la caja musical y los ternurines"
    />
  );
};
