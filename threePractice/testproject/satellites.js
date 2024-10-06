import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // OrbitControls to move around with mouse
import * as THREE from 'three'
import * as satellite from 'satellite.js';
import {fetchTLEData, parseTLE, getSatellitePosition} from './satapi';

// Scene setup
const scene = new THREE.Scene();
let satellites = []; // Declare it in a broader scope

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
camera.position.setZ(500);

// Renderer setup
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#sats'),
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// Enable shadow rendering
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;  // You can use other types too

// Add background
// const spaceTexture = new THREE.TextureLoader().load('textures\\back.jpg');
// scene.background = spaceTexture;
scene.background = new THREE.Color(0x000000);

// Lighting
const pointLight = new THREE.PointLight(0xffffff, 1);  // Lower intensity
pointLight.position.set(0, 0, 0);
pointLight.castShadow = true;  // Enable shadow casting for the light
pointLight.shadow.mapSize.width = 2048;  // Adjust for higher quality shadows
pointLight.shadow.mapSize.height = 2048;
scene.add(pointLight);

const ambientLight = new THREE.AmbientLight(0xffffff); 
scene.add(ambientLight);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);

// Define the earth radius
const earth_radius = 100;

// Create the earth
const planetTexture = new THREE.TextureLoader().load(`textures/earth.jpg`);
const earth = new THREE.Mesh(
  new THREE.SphereGeometry(earth_radius, 32, 32),
  new THREE.MeshStandardMaterial({map: planetTexture })
);
scene.add(earth);



// add satellites
const now = new Date();


function createSatelliteMesh() {
  const satelliteGeometry = new THREE.SphereGeometry(3, 16, 16); // Create a small sphere for the satellite
  const satelliteMaterial = new THREE.MeshStandardMaterial({ color: 0xdef2ff }); // Red color for visibility
  const satelliteMesh = new THREE.Mesh(satelliteGeometry, satelliteMaterial);
  return satelliteMesh;
}

// Example URL for active satellites TLE data
const tleURL = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle';
let satelliteMeshes = [];

fetchTLEData(tleURL).then(tleData => {
    if (tleData) {
        satellites = parseTLE(tleData);
        console.log(satellites); // Output parsed TLE data
        
        satellites.forEach(sat => {
            const satMesh = createSatelliteMesh();
            // Position the satellite based on the initial TLE data
            const position = getSatellitePosition(sat.line1, sat.line2, now, earth_radius);
            satMesh.position.set(position.x, position.y, position.z); // Set position
            scene.add(satMesh); // Add satellite mesh to the scene
            satelliteMeshes.push(satMesh); // Store the mesh for later updates
        });
    }
});


// Animate the scene
let sim_time = 0;
let dt = 0 // 1 second timestep
var sat_time = new Date(now.getTime());
  
function animate() {
  requestAnimationFrame(animate);

  // Update time
  sim_time += dt;
  sat_time.setSeconds(sat_time.getSeconds() + dt);
  console.log("Current Simulation Time:", sat_time);

  // Rotate the earth
  earth.rotation.y += 0.001;

  // Update satellite positions
  satelliteMeshes.forEach((satMesh, index) => {
      const sat = satellites[index]; // Retrieve the corresponding satellite
      const position = getSatellitePosition(sat.line1, sat.line2, sat_time, earth_radius); // Update with simulation time
      // console.log(position);
      satMesh.position.set(position.x, position.y, position.z); // Update position
  });

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
