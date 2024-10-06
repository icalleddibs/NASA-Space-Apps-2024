import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // OrbitControls to move around with mouse
import * as THREE from 'three';
import { fetchTLEData, parseTLE, getSatellitePosition } from './satapi';

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

// Create the earth
const planetTexture = new THREE.TextureLoader().load(`textures/earth.jpg`);
const earth_radius = 100;
const earth = new THREE.Mesh(
    new THREE.SphereGeometry(earth_radius, 32, 32),
    new THREE.MeshStandardMaterial({ map: planetTexture })
);
earth.position.set(0, 0, 0);  // Center Earth at (0, 0, 0)
// Apply axial tilt (23.5 degrees)
earth.rotation.x = THREE.MathUtils.degToRad(23.5);
scene.add(earth);

// Satellite control flags
let leo = false;
let meo = false;
let geo = false;
let iss = false;

// Satellite storage
let satelliteMeshes = [];
let filteredSatellites = [];

// Add event listeners for checkbox toggles
document.getElementById('leo-checkbox').addEventListener('change', (event) => {
    leo = event.target.checked;
    updateSatelliteVisibility();
});
document.getElementById('meo-checkbox').addEventListener('change', (event) => {
    meo = event.target.checked;
    updateSatelliteVisibility();
});
document.getElementById('geo-checkbox').addEventListener('change', (event) => {
    geo = event.target.checked;
    updateSatelliteVisibility();
});
document.getElementById('ISS-checkbox').addEventListener('change', (event) => {
    iss = event.target.checked;
    updateSatelliteVisibility();
});

// Function to create satellite meshes
function createSatelliteMesh(size = 2, color = 0xdef2ff) {
    const satelliteGeometry = new THREE.SphereGeometry(size, 16, 16); // Create a small sphere for the satellite
    const satelliteMaterial = new THREE.MeshStandardMaterial({ color: color }); // Color for visibility
    return new THREE.Mesh(satelliteGeometry, satelliteMaterial);
}

// Fetch TLE data
const tleURL = "https://raw.githubusercontent.com/icalleddibs/NASA-Space-Apps-2024/refs/heads/master/threePractice/testproject/celestrak_active.txt"; // Replace with your TLE source
fetchTLEData(tleURL).then(tleData => {
    if (tleData) {
        const now = new Date();
        satellites = parseTLE(tleData, now);
        console.log(satellites); // Output parsed TLE data
        updateSatelliteVisibility();
    }
});

// Function to update satellite visibility based on current settings
function updateSatelliteVisibility() {
  // Clear previous meshes
  satelliteMeshes.forEach(mesh => scene.remove(mesh));
  satelliteMeshes = [];
  filteredSatellites = [];

  const now = new Date();
  satellites.forEach(satrec => {
      let satMesh;

      // Check each satellite type and assign color accordingly
      if (satrec.orbit === "ISS" && iss) {
          satMesh = createSatelliteMesh(5, 0xFF0000); // Color for ISS (light yellow)
      } 
      else if (satrec.orbit === "LEO" && leo) {
          satMesh = createSatelliteMesh(); // Default color for LEO satellites
      } 
      else if (satrec.orbit === "MEO" && meo) {
          satMesh = createSatelliteMesh(5, 0xd595f8); // Default color for MEO satellites
      } 
      else if (satrec.orbit === "GEO" && geo) {
          satMesh = createSatelliteMesh(5, 0x96d8bc); // Default color for GEO satellites
      } 
      else {
          return; // Skip if not relevant
      }

      const position = getSatellitePosition(satrec, now, earth_radius);
      satMesh.position.set(position.x, position.y, position.z); // Set position
      scene.add(satMesh); // Add satellite mesh to the scene
      satelliteMeshes.push(satMesh); // Store the mesh for later updates
      filteredSatellites.push(satrec); // Store the corresponding satellite data
  });
}

// Animate the scene
let sim_time = 0;
let dt = 1000 / 60; // 60 FPS
var sat_time = new Date();
const earthAngularVelocity = 7.2921159e-5;  // radians per second

function animate() {
    // Update time
    sat_time.setMilliseconds(sat_time.getMilliseconds() + dt);

    // Rotate the Earth
    earth.rotation.y += earthAngularVelocity * dt / 1000;

    // Update satellite positions
    satelliteMeshes.forEach((satMesh, index) => {
        const satrec = filteredSatellites[index];
        const position = getSatellitePosition(satrec, sat_time, earth_radius);
        satMesh.position.set(position.x, position.y, position.z); // Update position
    });

    // Continue the animation loop
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
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
