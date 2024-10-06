import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // OrbitControls to move around with mouse
import * as THREE from 'three';

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

// Main simulation function
async function simulateSolarWind() {
    let solarWindData = await fetchPlasmaData();
    console.log('Fetched Solar Wind Data:', solarWindData);

    const { particleSystem, particlePositions, particleCount } = createSolarWindParticles(solarWindData);
    console.log('Number of Particles:', particleCount); // Log to see how many particles are created

    setInterval(async () => {
        solarWindData = await fetchPlasmaData();
        updateSolarWindParticles(particleSystem, particlePositions, solarWindData);  // Update visualization
    }, 60000);  // 60 seconds

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        updateSolarWindParticles(particleSystem, particlePositions, solarWindData);
        renderer.render(scene, camera);
    }
    animate();
}

simulateSolarWind();

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

// Create hitboxes for Sun, Earth, and Moon using cube geometries
const sunHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(100, 100, 100),  // Adjust size as needed
    new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 }) // Red for visibility
);
scene.add(sunHitbox);

const earthHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(40, 40, 40),  // Adjust size as needed
    new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 }) // Green for visibility
);
scene.add(earthHitbox);

const moonHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(10, 10, 10),  // Adjust size as needed
    new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.5 }) // Blue for visibility
);
scene.add(moonHitbox);

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

// Orbital parameters
let orbitRadius = 300; // Distance from the Sun to Earth
let orbitRadius2 = 50; // Distance from Earth to Moon
let angle = 0;         // Earth rotation angle
let angle2 = 0;        // Moon rotation angle
let speed = 0.01;      // Speed of Earth's rotation around the Sun
let speed2 = 0.05;     // Speed of Moon's rotation around the Earth

// Sidebar and planet info elements
const rightSidebar = document.getElementById('right-sidebar');
const closeSidebarButton = document.getElementById('close-sidebar');

// Sidebar content elements
const planetName = document.getElementById('planet-name');
const planetDistance = document.getElementById('planet-distance');
const planetOrbit = document.getElementById('planet-orbit');
const planetTemperature = document.getElementById('planet-temperature');
const planetMoons = document.getElementById('planet-moons');

// Celestial bodies information
const celestialBodies = [
    {
        name: "Sun",
        distanceFromSun: 0,
        orbitalPeriod: 0,
        temperature: 5505,
        moons: 0,
        mesh: sun
    },
    {
        name: "Earth",
        distanceFromSun: "149,600,000",
        orbitalPeriod: 365,
        temperature: 15,
        moons: 1,
        mesh: earth
    },
    {
        name: "Moon",
        distanceFromSun: "384,400", // Distance from Earth
        orbitalPeriod: 27,
        temperature: -20,
        moons: 0,
        mesh: moon
    }
];

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
    planetName.textContent = body.name;
    planetDistance.textContent = `Distance from Sun: ${body.distanceFromSun} km`;
    planetOrbit.textContent = `Orbital Period: ${body.orbitalPeriod} days`;
    planetTemperature.textContent = `Temperature: ${body.temperature} °C`;
    planetMoons.textContent = `Moons: ${body.moons}`;
    openSidebar();
}

// Raycaster for detecting clicks
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Detect mouse clicks on celestial bodies
window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(celestialBodies.map(body => body.mesh));

    if (intersects.length > 0) {
        const clickedBody = celestialBodies.find(body => body.mesh === intersects[0].object);
        if (clickedBody) {
            updateSidebar(clickedBody);  
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
