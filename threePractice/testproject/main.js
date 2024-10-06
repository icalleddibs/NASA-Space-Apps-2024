import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // OrbitControls to move around with mouse
import * as THREE from 'three';


let celestialBodies = []; // To store celestial body data

// Fetch celestial bodies data
fetch('celestialBodies.json')
    .then(response => response.json())
    .then(data => {
        celestialBodies = data; // Store the data in the global variable
    })
    .catch(error => console.error('Error fetching celestial bodies:', error));


// Scene setup
const scene = new THREE.Scene();

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.setZ(600);

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

// Solar Wind - Fetch Data Functionality
async function fetchPlasmaData() {
    try {
        const response = await fetch('https://services.swpc.noaa.gov/products/solar-wind/plasma-7-day.json');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json(); // Parse JSON instead of text
        console.log(data); // Log the fetched data for inspection

        // Extract relevant information
        const latestData = data[data.length - 1]; // Get the most recent entry

        return {
            timestamp: latestData[0],  // Timestamp of the data
            density: latestData[1],     // Solar wind speed (km/s)
            speed: latestData[2],       // Proton density (protons/cm³)
            temperature: latestData[3]  // Temperature
        };
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

// Create solar wind particles
function createSolarWindParticles(solarWindData) {
    console.log('Density:', solarWindData.density); // Log the density
    const particleCount = Math.max(0, Math.floor(solarWindData.density * 100)); // Ensure it’s a positive integer
    console.log('Particle Count:', particleCount); // Log particle count
    const particles = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i++) {
        particlePositions[i] = (Math.random() - 0.5) * 200;  // Randomize initial positions
    }

    particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMaterial = new THREE.PointsMaterial({
        color: 0x00ff00,  // Green particles for the solar wind
        size: 1,
        transparent: true,
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);

    return { particleSystem, particlePositions, particleCount };
}

// Update the positions of solar wind particles
function updateSolarWindParticles(particleSystem, particlePositions, solarWindData) {
    const newRadius = solarWindData.speed * 0.016;  // Adjust for elapsed time (approx. 60 FPS)
    for (let i = 0; i < particlePositions.length; i += 3) {
        particlePositions[i] += (Math.random() - 0.5) * newRadius;  // Update X
        particlePositions[i + 1] += (Math.random() - 0.5) * newRadius;  // Update Y
        particlePositions[i + 2] += (Math.random() - 0.5) * newRadius;  // Update Z
    }
    particleSystem.geometry.attributes.position.needsUpdate = true;  // Notify Three.js to update particles
}

// Main solar wind simulation function
let solarWindSimulationRunning = false; // Flag to track simulation state
let particleSystem; // Declare the particleSystem variable globally
let particlePositions; // Ensure this is defined in the right scope

async function simulateSolarWind() {
    if (solarWindSimulationRunning) return; // Prevent starting a new simulation if one is already running
    solarWindSimulationRunning = true; // Set the flag to true

    let solarWindData = await fetchPlasmaData();
    console.log('Fetched Solar Wind Data:', solarWindData);

    const particleData = createSolarWindParticles(solarWindData);
    particleSystem = particleData.particleSystem; // Correct variable name
    particlePositions = particleData.particlePositions; // Make sure to assign particle positions
    console.log('Number of Particles:', particleData.particleCount); // Log to see how many particles are created

    scene.add(particleSystem); // Add the particle system to the scene

    const intervalId = setInterval(async () => {
        solarWindData = await fetchPlasmaData();
        updateSolarWindParticles(particleSystem, particlePositions, solarWindData); // Update visualization
    }, 60000); // 60 seconds

    // Animation loop
    function animate() {
        if (!solarWindSimulationRunning) { // Check if the simulation should continue
            clearInterval(intervalId); // Stop the interval when the simulation is not running
            scene.remove(particleSystem); // Remove the particle system from the scene
            return;
        }

        requestAnimationFrame(animate); // Request the next frame
        updateSolarWindParticles(particleSystem, particlePositions, solarWindData); // Update particles
        renderer.render(scene, camera); // Render the scene
    }
    animate(); // Start the animation
}

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
console.log(moon.geometry.parameters.radius);

// Create hitboxes for Sun, Earth, and Moon using cube geometries
const sunHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(120, 120, 120),  // Adjust size as needed
    new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5, visible: false}) // Red for visibility
);
sunHitbox.name = "Sun";
scene.add(sunHitbox);

const earthHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(60, 60, 60),  // Adjust size as needed
    new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5, visible: false }) // Green for visibility
);
earthHitbox.name = "Earth";
scene.add(earthHitbox);

const moonHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(30, 30, 30),  // Adjust size as needed
    new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.5, visible: false }) // Blue for visibility
);
moonHitbox.name = "Moon";
scene.add(moonHitbox);

// Orbital parameters
let orbitRadius = 300; // Distance from the Sun to Earth
let orbitRadius2 = 50; // Distance from Earth to Moon
let angle = 0;         // Earth rotation angle
let angle2 = 0;        // Moon rotation angle
let speed = 0.001;      // Speed of Earth's rotation around the Sun
let speed2 = 0.01;     // Speed of Moon's rotation around the Earth

// Sidebar and planet info elements
const rightSidebar = document.getElementById('right-sidebar');
const closeSidebarButton = document.getElementById('close-sidebar');

// Add hitboxes to the scene
celestialBodies.forEach(body => {
    scene.add(body.hitbox); // Add the hitbox to the scene
});


// Function to open the right sidebar
function openSidebar() {
    rightSidebar.classList.add('active');
}

// Function to close the right sidebar
function closeSidebar() {
    rightSidebar.classList.remove('active');
}

closeSidebarButton.addEventListener('click', closeSidebar);


// Function to update sidebar with planet info
function updateSidebar(body) {
    document.getElementById('planet-name').textContent = body.name;
    
    // Update the values for each field using textContent
    document.getElementById('distance-value').textContent = `${body.distanceFromSun} km`;
    document.getElementById('orbit-value').textContent = `${body.orbitalPeriod} days`;
    document.getElementById("day-value").textContent = `${body.dayLength} hours`; // Added day length
    document.getElementById('temperature-value').textContent = `${body.temperature} °C`;
    document.getElementById('moons-value').textContent = `${body.moons}`;
    document.getElementById('planet-blurb').textContent = body.blurb; // Added blurb
    document.getElementById('diameter-value').textContent = `${body.diameter} km`; // Added diameter
    document.getElementById('mass-value').textContent = `${body.mass} x 10²⁴ kg`; // Added mass
    document.getElementById('type-value').textContent = body.typeOfPlanet; // Added type of planet
    document.getElementById('rings-value').textContent = `${body.rings}`; // Added rings
    document.getElementById('gravity-value').textContent = `${body.gravity} m/s²`; // Added gravity
    document.getElementById('atmosphere-value').textContent = body.atmosphere; // Added atmosphere
    
    openSidebar();
    
}

// toggle buttons -------------------------------------------------------------------

const orbitLinesCheckbox = document.getElementById('orbit-lines-checkbox');
const planetNamesCheckbox = document.getElementById('planet-names-checkbox');
const solarWindCheckbox = document.getElementById('solar-wind-checkbox');
  
orbitLinesCheckbox.addEventListener('change', function() {
  if (orbitLinesCheckbox.checked) {
      // condition to show orbit lines
      console.log("Orbit lines checked");
    } else {
      // condition to hide orbit lines 
      console.log("Orbit lines unchecked");
    }
}); 

planetNamesCheckbox.addEventListener('change', function() {
  if (planetNamesCheckbox.checked) {
    // condition to show the planet names
    console.log("Planet names checked");
  } else {
    // condition to hide the planet names 
    console.log("Planet names unchecked");
  }
}); 

// solarWindCheckbox.addEventListener('change', function() {
//   if (solarWindCheckbox.checked) {
//     // condition to show solar wind
//     console.log("Solar wind checked");
//     simulateSolarWind();

//   } else {
//     // condition to hide solar wind
//     console.log("Solar wind unchecked");
//   }
// });

solarWindCheckbox.addEventListener('change', function() {
    if (solarWindCheckbox.checked) {
        // Condition to show solar wind
        console.log("Solar wind checked");
        simulateSolarWind(); // Start the simulation
    } else {
        // Condition to hide solar wind
        console.log("Solar wind unchecked");
        solarWindSimulationRunning = false; // Set the flag to false
    }
});

// toggle buttons -------------------------------------------------------------------

// Raycaster for detecting clicks
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Raycasting logic
window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Use hitboxes for intersection checking
    const intersects = raycaster.intersectObjects([sunHitbox, earthHitbox, moonHitbox]); // Check against specific hitboxes
    //console.log("TESTING:", hitboxes);
    //const intersects = raycaster.intersectObjects(hitboxes);
    //const intersects = raycaster.intersectObjects(scene.children); // Check against all scene children
    console.log(intersects);
    console.log(intersects[0].object.name);


    if (intersects.length > 0) {
        const clickedHitbox = intersects[0].object; // Get the clicked hitbox
        const clickedBody = celestialBodies.find(body => body.name === clickedHitbox.name);
        console.log(clickedBody);
        if (clickedBody) {
            updateSidebar(clickedBody);  // Show sidebar with clicked body's info
        }
    }
});


// Sync hitboxes with celestial bodies
function syncHitboxes() {
    sunHitbox.position.copy(sun.position);
    earthHitbox.position.copy(earth.position);
    moonHitbox.position.copy(moon.position);
}

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

    // Sync hitboxes with celestial bodies
    syncHitboxes();

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

// Function to reset camera view
function resetCameraView(camera, controls) {
    camera.position.set(0, 0, 600); // Reset camera position
    controls.target.set(0, 0, 0); // Focus on the center of the solar system
    controls.update();
}

document.getElementById('reset-camera').addEventListener('click', function() {
    resetCameraView(camera, controls);
});