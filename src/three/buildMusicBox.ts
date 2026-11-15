import * as THREE from 'three';
import {
  LID_REFERENCE_TEX_URL,
  PANEL_REFERENCE_TEX_URL,
  createContactShadowTexture,
  createLidPlaqueTexture,
  createTurntableTexture,
  createTuftedVelvetTexture,
  loadReferenceReliefTexture,
} from './proceduralTextures';

export interface MusicBoxRig {
  root: THREE.Group;
  lidPivot: THREE.Group;
  turntableGroup: THREE.Group;
  windKeyGroup: THREE.Group;
  lockEscutcheon: THREE.Group;
  lockLatch: THREE.Group;
  lockGlowMaterial: THREE.MeshStandardMaterial;
  stageSpotlight: THREE.SpotLight;
  /** World-aligned target point inside root where the key inserts along -Z */
  keyholeLocalPos: THREE.Vector3;
  turntableTopY: number;
  dispose: () => void;
}

function createHeartShape(scale = 1): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, -0.36 * scale);
  s.bezierCurveTo(
    0.42 * scale, -0.05 * scale,
    0.46 * scale, 0.30 * scale,
    0.20 * scale, 0.36 * scale
  );
  s.bezierCurveTo(
    0.07 * scale, 0.39 * scale,
    0, 0.27 * scale,
    0, 0.21 * scale
  );
  s.bezierCurveTo(
    0, 0.27 * scale,
    -0.07 * scale, 0.39 * scale,
    -0.20 * scale, 0.36 * scale
  );
  s.bezierCurveTo(
    -0.46 * scale, 0.30 * scale,
    -0.42 * scale, -0.05 * scale,
    0, -0.36 * scale
  );
  return s;
}

function createOvalFrameShape(rx: number, ry: number, border: number): THREE.Shape {
  const outer = new THREE.Shape();
  outer.absellipse(0, 0, rx, ry, 0, Math.PI * 2, false, 0);
  const inner = new THREE.Path();
  inner.absellipse(0, 0, rx - border, ry - border, 0, Math.PI * 2, true, 0);
  outer.holes.push(inner);
  return outer;
}

function buildSculptedRose(
  petalMat: THREE.Material,
  leafMat: THREE.Material,
  scale = 1
): THREE.Group {
  const rose = new THREE.Group();
  const coreGeo = new THREE.SphereGeometry(0.055 * scale, 14, 12);
  const core = new THREE.Mesh(coreGeo, petalMat);
  core.position.y = 0.03 * scale;
  rose.add(core);

  // Layered spiral petals
  const petalGeo = new THREE.SphereGeometry(0.058 * scale, 12, 10);
  petalGeo.scale(1.15, 0.72, 0.45);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const petal = new THREE.Mesh(petalGeo, petalMat);
    petal.position.set(Math.cos(a) * 0.055 * scale, 0.024 * scale, Math.sin(a) * 0.055 * scale);
    petal.rotation.y = -a + Math.PI / 2;
    petal.rotation.x = 0.48;
    rose.add(petal);
  }

  // Olive-sage leaves underneath
  const leafGeo = new THREE.SphereGeometry(0.065 * scale, 10, 8);
  leafGeo.scale(1.4, 0.25, 0.7);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(Math.cos(a) * 0.11 * scale, 0.005 * scale, Math.sin(a) * 0.11 * scale);
    leaf.rotation.y = -a;
    rose.add(leaf);
  }

  return rose;
}

export function buildMusicBox(maxAnisotropy: number): MusicBoxRig {
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  const root = new THREE.Group();

  // Dimensions
  const W = 3.6;
  const D = 2.45;
  const H = 1.12;
  const WALL = 0.16;
  const CAVITY_FLOOR_Y = 0.56;
  const TURNTABLE_HEIGHT = 0.08;
  const TURNTABLE_TOP_Y = CAVITY_FLOOR_Y + TURNTABLE_HEIGHT;

  // Textures
  const velvetTex = track(createTuftedVelvetTexture(maxAnisotropy));
  const turntableTex = track(createTurntableTexture(maxAnisotropy));
  const plaqueTex = track(createLidPlaqueTexture(maxAnisotropy));
  const shadowTex = track(createContactShadowTexture());
  const lidRefTex = track(loadReferenceReliefTexture(LID_REFERENCE_TEX_URL, maxAnisotropy));
  const panelRefTex = track(loadReferenceReliefTexture(PANEL_REFERENCE_TEX_URL, maxAnisotropy));

  // Shared PBR Materials
  const pinkEnamelMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xf4c7cb,
      roughness: 0.26,
      metalness: 0.04,
      clearcoat: 0.65,
      clearcoatRoughness: 0.18,
    })
  );

  const creamEnamelMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xfbf3ec,
      roughness: 0.24,
      metalness: 0.02,
      clearcoat: 0.55,
      clearcoatRoughness: 0.2,
    })
  );

  const goldMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xe4bc68,
      metalness: 0.9,
      roughness: 0.22,
      envMapIntensity: 1.25,
    })
  );

  const pearlMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xfff8f1,
      roughness: 0.16,
      metalness: 0.05,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
      sheen: 0.4,
      sheenColor: new THREE.Color(0xffeaf0),
    })
  );

  const crystalMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.05,
      clearcoat: 1.0,
      ior: 1.8,
      envMapIntensity: 1.6,
    })
  );

  const rosePinkMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xf0b2bb,
      roughness: 0.55,
      metalness: 0.02,
    })
  );

  const roseCreamMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xfcf2e4,
      roughness: 0.52,
      metalness: 0.02,
    })
  );

  const leafMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x8fa16e,
      roughness: 0.62,
      metalness: 0.05,
    })
  );

  const velvetMat = track(
    new THREE.MeshStandardMaterial({
      map: velvetTex,
      roughness: 0.88,
      metalness: 0.0,
    })
  );

  const panelReliefMat = track(
    new THREE.MeshPhysicalMaterial({
      map: panelRefTex,
      roughness: 0.32,
      metalness: 0.12,
      clearcoat: 0.4,
    })
  );

  const lidReliefMat = track(
    new THREE.MeshPhysicalMaterial({
      map: lidRefTex,
      roughness: 0.3,
      metalness: 0.14,
      clearcoat: 0.45,
    })
  );

  // ==================== GROUND CONTACT SHADOW ====================
  const shadowPlane = new THREE.Mesh(
    track(new THREE.PlaneGeometry(5.2, 3.8)),
    track(
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.62,
      })
    )
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.004;
  root.add(shadowPlane);

  // ==================== HOLLOW BOX BASE ====================
  const baseGroup = new THREE.Group();
  root.add(baseGroup);

  // Bottom slab
  const bottomSlab = new THREE.Mesh(
    track(new THREE.BoxGeometry(W, CAVITY_FLOOR_Y, D)),
    pinkEnamelMat
  );
  bottomSlab.position.y = CAVITY_FLOOR_Y / 2;
  bottomSlab.castShadow = true;
  bottomSlab.receiveShadow = true;
  baseGroup.add(bottomSlab);

  // Stepped golden foot molding around the base
  const baseTrim = new THREE.Mesh(
    track(new THREE.BoxGeometry(W + 0.1, 0.11, D + 0.1)),
    goldMat
  );
  baseTrim.position.y = 0.065;
  baseTrim.castShadow = true;
  baseTrim.receiveShadow = true;
  baseGroup.add(baseTrim);

  // Four corner rounded brass feet
  const footGeo = track(new THREE.CylinderGeometry(0.11, 0.08, 0.06, 16));
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const foot = new THREE.Mesh(footGeo, goldMat);
      foot.position.set(sx * (W / 2 - 0.16), 0.03, sz * (D / 2 - 0.16));
      foot.castShadow = true;
      baseGroup.add(foot);
    }
  }

  // Four hollow upper walls (leaving cavity open above CAVITY_FLOOR_Y)
  const wallH = H - CAVITY_FLOOR_Y;
  const wallY = CAVITY_FLOOR_Y + wallH / 2;

  const frontWall = new THREE.Mesh(
    track(new THREE.BoxGeometry(W, wallH, WALL)),
    pinkEnamelMat
  );
  frontWall.position.set(0, wallY, D / 2 - WALL / 2);
  frontWall.castShadow = true;
  frontWall.receiveShadow = true;
  baseGroup.add(frontWall);

  const backWall = new THREE.Mesh(
    track(new THREE.BoxGeometry(W, wallH, WALL)),
    pinkEnamelMat
  );
  backWall.position.set(0, wallY, -D / 2 + WALL / 2);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  baseGroup.add(backWall);

  const sideWallLen = D - WALL * 2;
  const leftWall = new THREE.Mesh(
    track(new THREE.BoxGeometry(WALL, wallH, sideWallLen)),
    pinkEnamelMat
  );
  leftWall.position.set(-W / 2 + WALL / 2, wallY, 0);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  baseGroup.add(leftWall);

  const rightWall = new THREE.Mesh(
    track(new THREE.BoxGeometry(WALL, wallH, sideWallLen)),
    pinkEnamelMat
  );
  rightWall.position.set(W / 2 - WALL / 2, wallY, 0);
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  baseGroup.add(rightWall);

  // Upper gold rim molding along the base cavity top
  const rimFrameOuter = new THREE.Shape();
  rimFrameOuter.moveTo(-W / 2 - 0.03, -D / 2 - 0.03);
  rimFrameOuter.lineTo(W / 2 + 0.03, -D / 2 - 0.03);
  rimFrameOuter.lineTo(W / 2 + 0.03, D / 2 + 0.03);
  rimFrameOuter.lineTo(-W / 2 - 0.03, D / 2 + 0.03);
  rimFrameOuter.closePath();

  const rimHole = new THREE.Path();
  rimHole.moveTo(-(W / 2 - WALL), -(D / 2 - WALL));
  rimHole.lineTo(W / 2 - WALL, -(D / 2 - WALL));
  rimHole.lineTo(W / 2 - WALL, D / 2 - WALL);
  rimHole.lineTo(-(W / 2 - WALL), D / 2 - WALL);
  rimHole.closePath();
  rimFrameOuter.holes.push(rimHole);

  const rimGeo = track(
    new THREE.ExtrudeGeometry(rimFrameOuter, {
      depth: 0.055,
      bevelEnabled: true,
      bevelThickness: 0.014,
      bevelSize: 0.014,
      bevelSegments: 2,
    })
  );
  const rimMesh = new THREE.Mesh(rimGeo, goldMat);
  rimMesh.rotation.x = Math.PI / 2;
  rimMesh.position.y = H + 0.025;
  baseGroup.add(rimMesh);

  // ==================== ORNATE FRONT & SIDE PANEL RELIEFS ====================
  // Front relief plaque echoing image_1cec9686.png + 3D oval cameo & heart
  const frontPanelMesh = new THREE.Mesh(
    track(new THREE.PlaneGeometry(W - 0.34, H - 0.24)),
    panelReliefMat
  );
  frontPanelMesh.position.set(0, H / 2 + 0.02, D / 2 + 0.004);
  baseGroup.add(frontPanelMesh);

  // Front raised 3D oval cameo + golden heart
  const ovalBorderGeo = track(
    new THREE.ExtrudeGeometry(createOvalFrameShape(0.62, 0.34, 0.065), {
      depth: 0.035,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 2,
    })
  );
  const frontOvalFrame = new THREE.Mesh(ovalBorderGeo, goldMat);
  frontOvalFrame.position.set(0, 0.52, D / 2 + 0.008);
  baseGroup.add(frontOvalFrame);

  const cameoInnerGeo = track(new THREE.CircleGeometry(0.55, 32));
  cameoInnerGeo.scale(1, 0.275 / 0.55, 1);
  const frontCameo = new THREE.Mesh(cameoInnerGeo, creamEnamelMat);
  frontCameo.position.set(0, 0.52, D / 2 + 0.022);
  baseGroup.add(frontCameo);

  const frontHeartGeo = track(
    new THREE.ExtrudeGeometry(createHeartShape(0.46), {
      depth: 0.04,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.015,
      bevelSegments: 3,
    })
  );
  const frontHeart = new THREE.Mesh(frontHeartGeo, goldMat);
  frontHeart.position.set(0, 0.52, D / 2 + 0.025);
  baseGroup.add(frontHeart);

  // Side reliefs (left & right faces)
  for (const sx of [-1, 1]) {
    const sidePlaque = new THREE.Mesh(
      track(new THREE.PlaneGeometry(D - 0.34, H - 0.24)),
      panelReliefMat
    );
    sidePlaque.position.set(sx * (W / 2 + 0.004), H / 2 + 0.02, 0);
    sidePlaque.rotation.y = sx * (Math.PI / 2);
    baseGroup.add(sidePlaque);

    const sideFrame = new THREE.Mesh(ovalBorderGeo, goldMat);
    sideFrame.position.set(sx * (W / 2 + 0.008), 0.52, 0);
    sideFrame.rotation.y = sx * (Math.PI / 2);
    sideFrame.scale.set(0.8, 0.8, 1);
    baseGroup.add(sideFrame);
  }

  // Front & side corner 3D roses
  const frontRoseSpots: Array<[number, number, number, boolean]> = [
    [-1.42, 0.86, D / 2 + 0.02, true],
    [1.42, 0.86, D / 2 + 0.02, false],
    [-1.42, 0.26, D / 2 + 0.02, false],
    [1.42, 0.26, D / 2 + 0.02, true],
  ];
  frontRoseSpots.forEach(([rx, ry, rz, pink]) => {
    const r = buildSculptedRose(pink ? rosePinkMat : roseCreamMat, leafMat, 0.82);
    r.position.set(rx, ry, rz);
    r.rotation.x = Math.PI / 2;
    baseGroup.add(r);
  });

  // Instanced pearl trim along the front face top & bottom
  const pearlGeo = track(new THREE.SphereGeometry(0.026, 12, 10));
  const frontPearlPositions: THREE.Vector3[] = [];
  for (let i = -14; i <= 14; i++) {
    if (Math.abs(i) <= 1) continue; // leave space for lock clasp at center top
    frontPearlPositions.push(new THREE.Vector3(i * 0.115, H - 0.075, D / 2 + 0.015));
  }
  for (let i = -14; i <= 14; i++) {
    frontPearlPositions.push(new THREE.Vector3(i * 0.115, 0.145, D / 2 + 0.015));
  }
  const frontPearls = new THREE.InstancedMesh(
    pearlGeo,
    pearlMat,
    frontPearlPositions.length
  );
  const dummy = new THREE.Object3D();
  frontPearlPositions.forEach((p, idx) => {
    dummy.position.copy(p);
    dummy.updateMatrix();
    frontPearls.setMatrixAt(idx, dummy.matrix);
  });
  frontPearls.instanceMatrix.needsUpdate = true;
  frontPearls.computeBoundingSphere();
  baseGroup.add(frontPearls);

  // ==================== MECHANICAL FRONT LOCK (CERRADURA) ====================
  const lockEscutcheon = new THREE.Group();
  lockEscutcheon.position.set(0, 0.96, D / 2 + 0.026);
  baseGroup.add(lockEscutcheon);

  const lockGlowMaterial = track(
    new THREE.MeshStandardMaterial({
      color: 0xf4c87a,
      emissive: 0x000000,
      emissiveIntensity: 0,
      metalness: 0.85,
      roughness: 0.22,
    })
  );

  // Heart-shaped brass lock bezel
  const lockPlateGeo = track(
    new THREE.ExtrudeGeometry(createHeartShape(0.42), {
      depth: 0.036,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 2,
    })
  );
  const lockPlate = new THREE.Mesh(lockPlateGeo, lockGlowMaterial);
  lockEscutcheon.add(lockPlate);

  // Dark keyhole recess (vertical slot + top circular bore)
  const darkSlotMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x1a0e12,
      roughness: 0.85,
      metalness: 0.2,
    })
  );
  const boreMesh = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.032, 0.032, 0.03, 16)),
    darkSlotMat
  );
  boreMesh.rotation.x = Math.PI / 2;
  boreMesh.position.set(0, 0.018, 0.036);
  lockEscutcheon.add(boreMesh);

  const slotMesh = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.022, 0.068, 0.03)),
    darkSlotMat
  );
  slotMesh.position.set(0, -0.022, 0.036);
  lockEscutcheon.add(slotMesh);

  // Rotating brass latch tongue bridging base & lid
  const lockLatch = new THREE.Group();
  lockLatch.position.set(0, 0.14, 0.02);
  lockEscutcheon.add(lockLatch);

  const latchTongue = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.14, 0.16, 0.03)),
    goldMat
  );
  latchTongue.position.y = 0.04;
  lockLatch.add(latchTongue);

  const latchGem = new THREE.Mesh(
    track(new THREE.OctahedronGeometry(0.038, 1)),
    crystalMat
  );
  latchGem.position.set(0, 0.05, 0.025);
  lockLatch.add(latchGem);

  const keyholeLocalPos = new THREE.Vector3(0, 0.978, D / 2 + 0.065);

  // ==================== SIDE WIND-UP KEY ====================
  const windKeyGroup = new THREE.Group();
  windKeyGroup.position.set(W / 2 + 0.02, 0.56, 0);
  baseGroup.add(windKeyGroup);

  const keyEscutcheon = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.12, 0.13, 0.03, 20)),
    goldMat
  );
  keyEscutcheon.rotation.z = Math.PI / 2;
  windKeyGroup.add(keyEscutcheon);

  const keyShaft = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.032, 0.032, 0.18, 14)),
    goldMat
  );
  keyShaft.rotation.z = Math.PI / 2;
  keyShaft.position.x = 0.09;
  windKeyGroup.add(keyShaft);

  const wingGeo = track(new THREE.TorusGeometry(0.085, 0.022, 10, 22));
  const wingTop = new THREE.Mesh(wingGeo, goldMat);
  wingTop.position.set(0.18, 0.08, 0);
  wingTop.rotation.y = Math.PI / 2;
  windKeyGroup.add(wingTop);

  const wingBot = new THREE.Mesh(wingGeo, goldMat);
  wingBot.position.set(0.18, -0.08, 0);
  wingBot.rotation.y = Math.PI / 2;
  windKeyGroup.add(wingBot);

  // ==================== INTERIOR VELVET CAVITY & TURNTABLE ====================
  const cavityFloor = new THREE.Mesh(
    track(new THREE.PlaneGeometry(W - WALL * 2, D - WALL * 2)),
    velvetMat
  );
  cavityFloor.rotation.x = -Math.PI / 2;
  cavityFloor.position.y = CAVITY_FLOOR_Y + 0.005;
  cavityFloor.receiveShadow = true;
  baseGroup.add(cavityFloor);

  // Inner velvet side walls
  const innerWallH = wallH - 0.02;
  const innerWallY = CAVITY_FLOOR_Y + innerWallH / 2;
  const innerFront = new THREE.Mesh(
    track(new THREE.PlaneGeometry(W - WALL * 2, innerWallH)),
    velvetMat
  );
  innerFront.position.set(0, innerWallY, D / 2 - WALL - 0.003);
  innerFront.rotation.y = Math.PI;
  baseGroup.add(innerFront);

  const innerBack = new THREE.Mesh(
    track(new THREE.PlaneGeometry(W - WALL * 2, innerWallH)),
    velvetMat
  );
  innerBack.position.set(0, innerWallY, -D / 2 + WALL + 0.003);
  baseGroup.add(innerBack);

  for (const sx of [-1, 1]) {
    const innerSide = new THREE.Mesh(
      track(new THREE.PlaneGeometry(D - WALL * 2, innerWallH)),
      velvetMat
    );
    innerSide.position.set(sx * (W / 2 - WALL - 0.003), innerWallY, 0);
    innerSide.rotation.y = -sx * (Math.PI / 2);
    baseGroup.add(innerSide);
  }

  // Spinning Turntable Disc inside cavity
  const turntableGroup = new THREE.Group();
  turntableGroup.position.set(0, CAVITY_FLOOR_Y + 0.01, 0);
  baseGroup.add(turntableGroup);

  const turntableMat = track(
    new THREE.MeshStandardMaterial({
      map: turntableTex,
      roughness: 0.34,
      metalness: 0.18,
    })
  );
  const discCylinder = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.92, 0.95, TURNTABLE_HEIGHT, 48)),
    [goldMat, turntableMat, goldMat]
  );
  discCylinder.position.y = TURNTABLE_HEIGHT / 2;
  discCylinder.receiveShadow = true;
  discCylinder.castShadow = true;
  turntableGroup.add(discCylinder);

  const discBezel = new THREE.Mesh(
    track(new THREE.TorusGeometry(0.92, 0.022, 12, 48)),
    goldMat
  );
  discBezel.rotation.x = Math.PI / 2;
  discBezel.position.y = TURNTABLE_HEIGHT;
  turntableGroup.add(discBezel);

  // Four delicate silk roses tucked into the velvet corners
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const cornerRose = buildSculptedRose(rosePinkMat, leafMat, 0.95);
      cornerRose.position.set(sx * 1.32, CAVITY_FLOOR_Y + 0.02, sz * 0.78);
      baseGroup.add(cornerRose);
    }
  }

  // ==================== HINGED LID (pivots along back edge y=H, z=-D/2) ====================
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, H, -D / 2);
  root.add(lidPivot);

  // Brass hinges on back edge
  for (const hx of [-1.05, 1.05]) {
    const hinge = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.045, 0.045, 0.28, 16)),
      goldMat
    );
    hinge.rotation.z = Math.PI / 2;
    hinge.position.set(hx, 0, 0);
    lidPivot.add(hinge);
  }

  // Lid body sits forward from z = 0..D and up y = 0..0.24
  const LID_H = 0.24;
  const lidBody = new THREE.Group();
  lidBody.position.set(0, 0, D / 2);
  lidPivot.add(lidBody);

  const lidSlab = new THREE.Mesh(
    track(new THREE.BoxGeometry(W + 0.04, LID_H, D + 0.04)),
    pinkEnamelMat
  );
  lidSlab.position.y = LID_H / 2;
  lidSlab.castShadow = true;
  lidSlab.receiveShadow = true;
  lidBody.add(lidSlab);

  // Lid gold edge molding
  const lidTrim = new THREE.Mesh(
    track(new THREE.BoxGeometry(W + 0.08, 0.055, D + 0.08)),
    goldMat
  );
  lidTrim.position.y = 0.03;
  lidBody.add(lidTrim);

  // Top ornate reference relief surface (matching image_1620d903.png)
  const lidTopPanel = new THREE.Mesh(
    track(new THREE.PlaneGeometry(W - 0.16, D - 0.16)),
    lidReliefMat
  );
  lidTopPanel.rotation.x = -Math.PI / 2;
  lidTopPanel.position.y = LID_H + 0.004;
  lidTopPanel.receiveShadow = true;
  lidBody.add(lidTopPanel);

  // 3D Sculpted Gold Frame & Pearl Border on Lid Top
  const lidPearlPositions: THREE.Vector3[] = [];
  for (let i = -14; i <= 14; i++) {
    lidPearlPositions.push(new THREE.Vector3(i * 0.115, LID_H + 0.022, D / 2 - 0.15));
    lidPearlPositions.push(new THREE.Vector3(i * 0.115, LID_H + 0.022, -D / 2 + 0.15));
  }
  for (let k = -8; k <= 8; k++) {
    lidPearlPositions.push(new THREE.Vector3(-W / 2 + 0.15, LID_H + 0.022, k * 0.112));
    lidPearlPositions.push(new THREE.Vector3(W / 2 - 0.15, LID_H + 0.022, k * 0.112));
  }
  // Heart-shaped pearl ring framing the central golden heart
  for (let i = 0; i < 28; i++) {
    const t = (i / 28) * Math.PI * 2;
    const hx = 16 * Math.pow(Math.sin(t), 3) * 0.029;
    const hz =
      -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) *
      0.029;
    lidPearlPositions.push(new THREE.Vector3(hx, LID_H + 0.038, hz - 0.06));
  }

  const lidPearls = new THREE.InstancedMesh(pearlGeo, pearlMat, lidPearlPositions.length);
  lidPearlPositions.forEach((p, idx) => {
    dummy.position.copy(p);
    dummy.updateMatrix();
    lidPearls.setMatrixAt(idx, dummy.matrix);
  });
  lidPearls.instanceMatrix.needsUpdate = true;
  lidPearls.computeBoundingSphere();
  lidBody.add(lidPearls);

  // Central Puffed 3D Golden Heart on Lid Top
  const centerHeartGeo = track(
    new THREE.ExtrudeGeometry(createHeartShape(0.88), {
      depth: 0.065,
      bevelEnabled: true,
      bevelThickness: 0.032,
      bevelSize: 0.028,
      bevelSegments: 4,
    })
  );
  const lidCenterHeart = new THREE.Mesh(centerHeartGeo, goldMat);
  lidCenterHeart.rotation.x = -Math.PI / 2;
  lidCenterHeart.position.set(0, LID_H + 0.018, -0.06);
  lidCenterHeart.castShadow = true;
  lidBody.add(lidCenterHeart);

  // Two Intertwined 3D Wedding Rings beneath the heart (from image_1620d903.png!)
  const ringGeo = track(new THREE.TorusGeometry(0.15, 0.024, 14, 36));
  const ringLeft = new THREE.Mesh(ringGeo, goldMat);
  ringLeft.rotation.x = -Math.PI / 2 + 0.18;
  ringLeft.position.set(-0.085, LID_H + 0.032, 0.48);
  lidBody.add(ringLeft);

  const ringRight = new THREE.Mesh(ringGeo, goldMat);
  ringRight.rotation.x = -Math.PI / 2 - 0.16;
  ringRight.position.set(0.085, LID_H + 0.036, 0.48);
  lidBody.add(ringRight);

  // Corner 3D Floral Rosettes + Crystal Gems on Lid Top
  const crystalGeo = track(new THREE.OctahedronGeometry(0.065, 1));
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const gem = new THREE.Mesh(crystalGeo, crystalMat);
      gem.position.set(sx * (W / 2 - 0.22), LID_H + 0.038, sz * (D / 2 - 0.22));
      gem.scale.set(1, 0.55, 1);
      lidBody.add(gem);

      const cornerRose = buildSculptedRose(rosePinkMat, leafMat, 1.05);
      cornerRose.position.set(sx * 0.92, LID_H + 0.015, sz * 0.62);
      lidBody.add(cornerRose);

      const companionRose = buildSculptedRose(roseCreamMat, leafMat, 0.85);
      companionRose.position.set(sx * 0.68, LID_H + 0.015, sz * 0.78);
      lidBody.add(companionRose);
    }
  }

  // ==================== LID UNDERSIDE VELVET LINING & OVAL MEDALLION ====================
  const innerLidVelvet = new THREE.Mesh(
    track(new THREE.PlaneGeometry(W - 0.26, D - 0.26)),
    velvetMat
  );
  innerLidVelvet.rotation.x = Math.PI / 2;
  innerLidVelvet.position.y = -0.004;
  lidBody.add(innerLidVelvet);

  // Gold-framed oval cameo inside the lid ("Para siempre juntos")
  const innerOvalFrame = new THREE.Mesh(
    track(new THREE.ExtrudeGeometry(createOvalFrameShape(0.88, 0.54, 0.055), {
      depth: 0.025,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 2,
    })),
    goldMat
  );
  innerOvalFrame.rotation.x = Math.PI / 2;
  innerOvalFrame.position.y = -0.006;
  lidBody.add(innerOvalFrame);

  const innerPlaqueGeo = track(new THREE.CircleGeometry(0.84, 36));
  innerPlaqueGeo.scale(1, 0.50 / 0.84, 1);
  const innerPlaque = new THREE.Mesh(
    innerPlaqueGeo,
    track(
      new THREE.MeshStandardMaterial({
        map: plaqueTex,
        roughness: 0.35,
        metalness: 0.05,
      })
    )
  );
  innerPlaque.rotation.x = Math.PI / 2;
  innerPlaque.position.y = -0.014;
  lidBody.add(innerPlaque);

  // ==================== WARM INTERIOR STAGE SPOTLIGHT ====================
  const stageSpotlight = new THREE.SpotLight(0xffe9d6, 0, 8, Math.PI / 4, 0.65, 1.5);
  stageSpotlight.position.set(0, 3.6, 1.1);
  stageSpotlight.target.position.set(0, TURNTABLE_TOP_Y + 0.4, 0);
  root.add(stageSpotlight);
  root.add(stageSpotlight.target);

  const dispose = () => {
    disposables.forEach((d) => {
      try {
        d.dispose();
      } catch {
        // Ignore double-dispose
      }
    });
  };

  return {
    root,
    lidPivot,
    turntableGroup,
    windKeyGroup,
    lockEscutcheon,
    lockLatch,
    lockGlowMaterial,
    stageSpotlight,
    keyholeLocalPos,
    turntableTopY: TURNTABLE_TOP_Y,
    dispose,
  };
}
