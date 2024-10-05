import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // OrbitControls to move around with mouse
import * as THREE from 'three'
import { ImprovedNoise } from 'https://unpkg.com/three/examples/jsm/math/ImprovedNoise.js';


// Scene setup
const scene = new THREE.Scene();

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.setZ(500);

// Renderer setup
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// Enable shadow rendering
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;  // You can use other types too


// Add background
const spaceTexture = new THREE.TextureLoader().load('textures\\back.jpg');
scene.background = spaceTexture;

// Lighting
const pointLight = new THREE.PointLight(0xffffff, 500000);
pointLight.position.set(0, 0, 0);
pointLight.castShadow = true;  // Enable shadow casting for the light
pointLight.shadow.mapSize.width = 2048;  // Adjust for higher quality shadows
pointLight.shadow.mapSize.height = 2048;
scene.add(pointLight);

const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(ambientLight);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);

// Stars
function addStar() {
  const geometry = new THREE.SphereGeometry(1, 24, 24);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const star = new THREE.Mesh(geometry, material);

  const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(1000));

  star.position.set(x, y, z);
  scene.add(star);
}
Array(300).fill().forEach(addStar);

// Textures
const moonTexture = new THREE.TextureLoader().load('textures\\moon.jpg');
const earthTexture = new THREE.TextureLoader().load('textures\\earth.jpg');
const sunTexture = new THREE.TextureLoader().load('textures\\sun.png');
const mercuryTexture = new THREE.TextureLoader().load('textures\\mercury.png');
const venusTexture = new THREE.TextureLoader().load('textures\\venus.png');
const marsTexture = new THREE.TextureLoader().load('textures\\mars.png');
const jupiterTexture = new THREE.TextureLoader().load('textures\\jupiter.png');
const saturnTexture = new THREE.TextureLoader().load('textures\\saturn.png');
const uranusTexture = new THREE.TextureLoader().load('textures\\uranus.png');
const neptuneTexture = new THREE.TextureLoader().load('textures\\neptune.png');


// Create the Earth sphere
const earth = new THREE.Mesh(
  new THREE.SphereGeometry(20, 32, 32),
  new THREE.MeshStandardMaterial({ map: earthTexture })
);
earth.castShadow = true;  // Enable shadow casting for Earth
earth.receiveShadow = true;  // Enable Earth to receive shadows
scene.add(earth);

// Create the Moon sphere
const moon = new THREE.Mesh(
  new THREE.SphereGeometry(5, 32, 32),
  new THREE.MeshStandardMaterial({ map: moonTexture })
);
moon.castShadow = true;  // Enable shadow casting for Moon
moon.receiveShadow = true;  // Enable Moon to receive shadows
scene.add(moon);

// Create the Sun sphere
// sun
// corona simulation found from: https://github.com/bobbyroe/solar-system/blob/main/src/getSun.js
function getCorona(radiation) {
  const radius = 51;
  const material = new THREE.MeshBasicMaterial({
    color: 0xffbb73,
    side: THREE.BackSide,
});
  const geo = new THREE.IcosahedronGeometry(radius, 30);
  const mesh = new THREE.Mesh(geo, material);
  const noise = new ImprovedNoise();

  let v3 = new THREE.Vector3();
  let p = new THREE.Vector3();
  let pos = geo.attributes.position;
  pos.usage = THREE.DynamicDrawUsage;
  const len = pos.count;

  function update(t) {
      for (let i = 0; i < len; i += 1) {
          p.fromBufferAttribute(pos, i).normalize();
          v3.copy(p).multiplyScalar(30.0);
          let ns = noise.noise(v3.x + Math.cos(t), v3.y + Math.sin(t), v3.z + t);
          v3.copy(p)
              .setLength(radius)
              .addScaledVector(p, ns * radiation);
          pos.setXYZ(i, v3.x, v3.y, v3.z);
      }
      pos.needsUpdate = true;
  }
  mesh.userData.update = update;
  return mesh;
}


const sun = new THREE.Mesh(
  new THREE.SphereGeometry(50, 32, 32),
  new THREE.MeshStandardMaterial({emissive: 0xff0000, map: sunTexture })
);
let radiation = 5
const coronaMesh = getCorona(radiation);
sun.add(coronaMesh);
scene.add(sun);

// Orbital parameters
let orbitRadius = 300;
let orbitRadius2 = 50;
let angle = 0;
let angle2 = 0;
let speed = 0.01;
let speed2 = 0.03;

// Animate the scene
function animate() {
  requestAnimationFrame(animate);
  // Update corona noise effect over time
  const time = performance.now() * 0.001;  // Time variable
  coronaMesh.userData.update(time);

  // Earth orbital motion
  const earthX = orbitRadius * Math.cos(angle);
  const earthY = orbitRadius * Math.sin(angle);
  earth.position.set(earthX, earthY, 0);
  
  // Moon orbital motion around Earth
  const moonX = earthX + orbitRadius2 * Math.cos(angle2);
  const moonY = earthY + orbitRadius2 * Math.sin(angle2);
  moon.position.set(moonX, moonY, 0);
  
  // Increment angles for orbital motion
  angle += speed;
  angle2 += speed2;

  // Rotate the Sun
  sun.rotation.y += 0.001;

  controls.update();
  renderer.render(scene, camera);
}

// Resize handler
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});

// Start the animation
animate();
