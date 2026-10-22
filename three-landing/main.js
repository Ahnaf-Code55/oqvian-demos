import * as THREE from 'three';

const stage = document.querySelector('#lamp-stage');
const canvas = document.querySelector('#lamp-canvas');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const tones = {
  warm: { hex: 0xffc47a, css: '#ffc47a', rgb: '255,196,122' },
  neutral: { hex: 0xffedcf, css: '#ffedcf', rgb: '255,237,207' },
  cool: { hex: 0x9bc7eb, css: '#9bc7eb', rgb: '155,199,235' },
  rose: { hex: 0xed9b9e, css: '#ed9b9e', rgb: '237,155,158' },
};

let renderer;
let scene;
let camera;
let lamp;
let beam;
let glow;
let spot;
let pointerX = 0;
let pointerY = 0;
let frameId;
let previousTime = 0;

function cylinderBetween(a, b, radius, material, segments = 40) {
  const direction = new THREE.Vector3().subVectors(b, a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), segments), material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function buildLamp() {
  const copper = new THREE.MeshStandardMaterial({ color: 0x9e5837, metalness: 0.78, roughness: 0.27 });
  const trim = new THREE.MeshStandardMaterial({ color: 0xd28c5f, metalness: 0.83, roughness: 0.22 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x28221e, metalness: 0.52, roughness: 0.31 });
  const porcelain = new THREE.MeshStandardMaterial({ color: 0xeee3d5, metalness: 0.12, roughness: 0.34 });
  const group = new THREE.Group();

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.73, 0.79, 0.15, 64), dark);
  base.position.y = 0.09;
  base.castShadow = true;
  group.add(base);
  const baseInset = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.63, 0.055, 64), trim);
  baseInset.position.y = 0.19;
  group.add(baseInset);

  const lower = new THREE.Vector3(-0.08, 0.22, 0);
  const elbow = new THREE.Vector3(-0.2, 1.72, 0);
  const end = new THREE.Vector3(0.92, 2.13, 0);
  group.add(cylinderBetween(lower, elbow, 0.075, copper));
  group.add(cylinderBetween(elbow, end, 0.067, copper));
  for (const [point, radius] of [[elbow, 0.18], [end, 0.12]]) {
    const joint = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 24), trim);
    joint.position.copy(point);
    joint.castShadow = true;
    group.add(joint);
  }
  const pivotCap = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.17, 32), dark);
  pivotCap.rotation.x = Math.PI / 2;
  pivotCap.position.copy(elbow);
  pivotCap.position.z = 0.1;
  group.add(pivotCap);

  const head = new THREE.Group();
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.43, 0.48, 56, 1, true), porcelain);
  shade.position.y = 0.02;
  shade.castShadow = true;
  head.add(shade);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.025, 12, 56), trim);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = -0.22;
  head.add(rim);
  const inner = new THREE.Mesh(new THREE.CircleGeometry(0.28, 48), new THREE.MeshBasicMaterial({ color: 0xffdfaa, side: THREE.DoubleSide }));
  inner.rotation.x = Math.PI / 2;
  inner.position.y = -0.19;
  head.add(inner);
  head.position.copy(end);
  head.rotation.z = -0.52;
  group.add(head);

  beam = new THREE.Mesh(
    new THREE.ConeGeometry(0.72, 1.75, 48, 1, true),
    new THREE.MeshBasicMaterial({ color: tones.warm.hex, transparent: true, opacity: 0.105, depthWrite: false, side: THREE.DoubleSide }),
  );
  beam.position.set(0.77, 1.1, 0);
  beam.rotation.z = Math.PI - 0.52;
  group.add(beam);
  glow = new THREE.Mesh(
    new THREE.CircleGeometry(0.73, 56),
    new THREE.MeshBasicMaterial({ color: tones.warm.hex, transparent: true, opacity: 0.15, depthWrite: false, side: THREE.DoubleSide }),
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.set(0.48, 0.018, 0);
  group.add(glow);
  group.traverse((object) => { if (object.isMesh) object.material.side = THREE.DoubleSide; });
  return group;
}

function resize() {
  if (!renderer || !camera) return;
  const { width, height } = stage.getBoundingClientRect();
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  camera.aspect = width / height;
  camera.position.z = width < 520 ? 6.7 : 5.7;
  camera.updateProjectionMatrix();
}

function render(time) {
  frameId = undefined;
  if (document.hidden || !renderer) return;
  const delta = Math.min((time - previousTime) / 1000 || 0, 0.05);
  previousTime = time;
  if (!reducedMotion) lamp.rotation.y += delta * 0.12;
  lamp.rotation.x += (pointerY * 0.045 - lamp.rotation.x) * 0.035;
  lamp.rotation.z += (pointerX * -0.055 - lamp.rotation.z) * 0.035;
  renderer.render(scene, camera);
  frameId = window.requestAnimationFrame(render);
}

function start() {
  if (!document.hidden && renderer && frameId === undefined) {
    previousTime = 0;
    frameId = window.requestAnimationFrame(render);
  }
}

function setTone(name) {
  const tone = tones[name];
  if (!tone) return;
  stage.dataset.tone = name;
  stage.style.setProperty('--tone', tone.css);
  stage.style.setProperty('--tone-rgb', tone.rgb);
  if (beam && glow && spot) {
    beam.material.color.setHex(tone.hex);
    glow.material.color.setHex(tone.hex);
    spot.color.setHex(tone.hex);
  }
  document.querySelectorAll('.swatch').forEach((button) => {
    const selected = button.dataset.tone === name;
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}

try {
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
  camera.position.set(0.05, 1.14, 5.7);
  camera.lookAt(0.12, 1.05, 0);
  scene.add(new THREE.HemisphereLight(0xc5ad96, 0x171310, 1.4));
  const key = new THREE.DirectionalLight(0xffdfbd, 3.2);
  key.position.set(-3, 5, 4);
  scene.add(key);
  lamp = buildLamp();
  scene.add(lamp);
  const target = new THREE.Object3D();
  target.position.set(0.2, 0.02, 0);
  scene.add(target);
  spot = new THREE.SpotLight(tones.warm.hex, 18, 5.5, 0.44, 0.55, 1.3);
  spot.position.set(0.78, 1.88, 0.03);
  spot.target = target;
  scene.add(spot);
  scene.add(spot.target);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(1.08, 64), new THREE.MeshBasicMaterial({ color: 0x241a14, transparent: true, opacity: 0.55 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0.08, -0.006, 0);
  scene.add(floor);
  resize();
  stage.classList.add('webgl-ready');
  window.addEventListener('resize', resize, { passive: true });
  start();
} catch (error) {
  canvas.hidden = true;
  stage.classList.add('webgl-fallback');
  console.info('Lumen is showing its static lamp illustration because WebGL is unavailable.');
}

document.querySelectorAll('.swatch').forEach((button) => {
  button.addEventListener('click', () => setTone(button.dataset.tone));
});
stage.addEventListener('pointermove', (event) => {
  if (reducedMotion || !renderer) return;
  const rect = stage.getBoundingClientRect();
  pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
  pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
});
stage.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (frameId !== undefined) window.cancelAnimationFrame(frameId);
    frameId = undefined;
  } else start();
});

const revealObserver = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 })
  : null;
document.querySelectorAll('.reveal').forEach((element) => {
  if (revealObserver) revealObserver.observe(element);
  else element.classList.add('is-visible');
});

document.querySelector('#reserve-form').addEventListener('submit', (event) => {
  event.preventDefault();
  document.querySelector('#form-message').textContent = 'Demo only, nothing was sent.';
});
