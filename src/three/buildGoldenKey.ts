import * as THREE from 'three';

export interface GoldenKeyRig {
  group: THREE.Group;
  hitProxy: THREE.Mesh;
  dispose: () => void;
}

function createOrnateBowShape(): THREE.Shape {
  const outer = new THREE.Shape();
  outer.moveTo(0, -0.14);
  outer.bezierCurveTo(0.18, -0.02, 0.22, 0.16, 0.10, 0.20);
  outer.bezierCurveTo(0.03, 0.22, 0, 0.15, 0, 0.11);
  outer.bezierCurveTo(0, 0.15, -0.03, 0.22, -0.10, 0.20);
  outer.bezierCurveTo(-0.22, 0.16, -0.18, -0.02, 0, -0.14);

  const inner = new THREE.Path();
  inner.moveTo(0, -0.075);
  inner.bezierCurveTo(-0.10, -0.01, -0.12, 0.10, -0.055, 0.125);
  inner.bezierCurveTo(-0.02, 0.135, 0, 0.095, 0, 0.07);
  inner.bezierCurveTo(0, 0.095, 0.02, 0.135, 0.055, 0.125);
  inner.bezierCurveTo(0.12, 0.10, 0.10, -0.01, 0, -0.075);
  outer.holes.push(inner);
  return outer;
}

/**
 * Builds a detailed 3D metallic golden key oriented with its bow at +Z
 * and its shaft/tip pointing along -Z so it inserts naturally into the front lock.
 */
export function buildGoldenKey(): GoldenKeyRig {
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  const group = new THREE.Group();

  const keyGoldMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xf4cf70,
      metalness: 0.94,
      roughness: 0.16,
      clearcoat: 0.5,
      clearcoatRoughness: 0.12,
      emissive: 0x3b2606,
      emissiveIntensity: 0.28,
      envMapIntensity: 1.45,
    })
  );

  const jewelMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xffd2de,
      metalness: 0.08,
      roughness: 0.06,
      clearcoat: 1.0,
      ior: 1.75,
    })
  );

  // Ornate heart-filigree bow handle at +Z end
  const bowGeo = track(
    new THREE.ExtrudeGeometry(createOrnateBowShape(), {
      depth: 0.036,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.01,
      bevelSegments: 3,
    })
  );
  bowGeo.center();
  const bowMesh = new THREE.Mesh(bowGeo, keyGoldMat);
  bowMesh.rotation.x = Math.PI / 2;
  bowMesh.position.set(0, 0, 0.31);
  bowMesh.castShadow = true;
  group.add(bowMesh);

  // Subtle rose-crystal jewel embedded at top of bow
  const bowGem = new THREE.Mesh(
    track(new THREE.OctahedronGeometry(0.034, 1)),
    jewelMat
  );
  bowGem.position.set(0, 0.022, 0.39);
  bowGem.scale.set(1, 0.55, 1);
  group.add(bowGem);

  // Turned decorative collar rings
  const collarGeo = track(new THREE.TorusGeometry(0.036, 0.012, 10, 20));
  const collar1 = new THREE.Mesh(collarGeo, keyGoldMat);
  collar1.position.set(0, 0, 0.15);
  group.add(collar1);

  const collar2 = new THREE.Mesh(collarGeo, keyGoldMat);
  collar2.scale.setScalar(0.84);
  collar2.position.set(0, 0, 0.11);
  group.add(collar2);

  // Tapered cylindrical shaft along Z (-0.30 .. +0.16)
  const shaftGeo = track(new THREE.CylinderGeometry(0.022, 0.026, 0.46, 18));
  shaftGeo.rotateX(Math.PI / 2);
  const shaftMesh = new THREE.Mesh(shaftGeo, keyGoldMat);
  shaftMesh.position.set(0, 0, -0.07);
  shaftMesh.castShadow = true;
  group.add(shaftMesh);

  // Rounded tip finial
  const tipMesh = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.023, 12, 10)),
    keyGoldMat
  );
  tipMesh.position.set(0, 0, -0.30);
  group.add(tipMesh);

  // Classic stepped key bit teeth extending downward (-Y) near tip
  const bitBridge = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.018, 0.085, 0.11)),
    keyGoldMat
  );
  bitBridge.position.set(0, -0.048, -0.22);
  bitBridge.castShadow = true;
  group.add(bitBridge);

  const tooth1 = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.022, 0.036, 0.032)),
    keyGoldMat
  );
  tooth1.position.set(0, -0.095, -0.255);
  group.add(tooth1);

  const tooth2 = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.022, 0.026, 0.032)),
    keyGoldMat
  );
  tooth2.position.set(0, -0.09, -0.19);
  group.add(tooth2);

  // Generous invisible raycast proxy sphere for effortless desktop & mobile clicks
  const hitProxy = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.46, 12, 10)),
    track(new THREE.MeshBasicMaterial({ visible: false }))
  );
  hitProxy.position.set(0, 0, 0.06);
  hitProxy.layers.set(1);
  hitProxy.userData.isGoldenKey = true;
  group.add(hitProxy);

  const dispose = () => {
    disposables.forEach((d) => {
      try {
        d.dispose();
      } catch {
        // Ignore
      }
    });
  };

  return { group, hitProxy, dispose };
}
