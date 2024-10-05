import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // OrbitControls to move around with mouse
import * as THREE from 'three'

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

// Add background
const spaceTexture = new THREE.TextureLoader().load('back.jpg');
scene.background = spaceTexture;

// Lighting
const pointLight = new THREE.PointLight(0xffffff, 200);
pointLight.position.set(0, 0, 0);
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
const moonTexture = new THREE.TextureLoader().load('moon.jpg');
const earthTexture = new THREE.TextureLoader().load('earth.jpg');
const sunTexture = new THREE.TextureLoader().load('sun.png');

// Create the Earth sphere
const earth = new THREE.Mesh(
  new THREE.SphereGeometry(20, 32, 32),
  new THREE.MeshStandardMaterial({ map: earthTexture })
);
scene.add(earth);

// Create the Moon sphere
const moon = new THREE.Mesh(
  new THREE.SphereGeometry(5, 32, 32),
  new THREE.MeshStandardMaterial({ map: moonTexture })
);
scene.add(moon);

// Create the Sun sphere
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(50, 32, 32),
  new THREE.MeshStandardMaterial({ map: sunTexture })
);
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
