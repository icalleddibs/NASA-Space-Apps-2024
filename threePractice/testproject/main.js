import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // OrbitControls to move around with mouse
import * as THREE from 'three';
import Papa from 'papaparse';
import { ImprovedNoise } from 'https://unpkg.com/three/examples/jsm/math/ImprovedNoise.js';

import { getOrbitPosition, createOrbit, createOrbitParams } from '/planets/moveapi.js';

let celestialBodies = []; // To store celestial pbodydata

// Fetch celestial bodies data
fetch('/planets/celestialBodies.json')
    .then(response => response.json())
    .then(data => {
        celestialBodies = data; // Store the data in the global variable
    })
    .catch(error => console.error('Error fetching celestial bodies:', error));


// Scene setup
const scene = new THREE.Scene();
let sim_time = 0;

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
camera.position.setZ(600);

// Renderer setup
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// Add background
scene.background = new THREE.Color(0x000000);;

// Enable shadow rendering
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;  // You can use other types too

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


//Parse csv file
async function loadPlanetData() {
    try {
      //const response = await fetch('/data/planets.csv');
      const response = await fetch('/planets/planets.csv');
      if (!response.ok) {
          throw new Error('Network response was not ok');
      }
      const csvData = await response.text();
      const parsedData = Papa.parse(csvData, { header: true, skipEmptyLines: true }).data; // Parses the CSV into an array of objects
      console.log(parsedData);
      return parsedData; // Return the parsed planet data
  } catch (error) {
      console.error('Error fetching or parsing planet data:', error);
  }
}

// start planets -----------------------------------------------------------------------------------------------

//store main objects:
let planetDataArray = [];
let orbits = [];

//create planet labels
function createPlanetTag(planetName) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = '30px Arial';
    context.fillStyle = 'white';
    context.fillText(planetName, 10, 40);
  
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(50, 25, 1);
  
    return sprite;
  }

const planetMap = new Map();
//creating planets
const tagsMap = new Map(); // Initialize a new map to store planet tags

async function createPlanets(scene) {
    planetDataArray = await loadPlanetData(); // Load the CSV data
    console.log('Loaded planet data:', planetDataArray);
  
    planetDataArray.forEach(planetData => {
        // Generate orbital parameters
        const orbitParams = createOrbitParams(planetData);
        console.log(planetData);
  
        let pl_radius = 20;
        if (planetData.Planet == 'Mercury') pl_radius = 10;
        else if (planetData.Planet == 'Venus') pl_radius = 30;
        else if (planetData.Planet == 'Earth') pl_radius = 30;
        else if (planetData.Planet == 'Mars') pl_radius = 15;
        else if (planetData.Planet == 'Jupiter') pl_radius = 300;
        else if (planetData.Planet == 'Saturn') pl_radius = 282;
        else if (planetData.Planet == 'Uranus') pl_radius = 127;
        else if (planetData.Planet == 'Neptune') pl_radius = 120;

        // Create planet mesh
        const planetTexture = new THREE.TextureLoader().load(`textures/${planetData.Planet.toLowerCase()}.jpg`);
        const planet = new THREE.Mesh(
            new THREE.SphereGeometry(pl_radius, 32, 32),
            new THREE.MeshStandardMaterial({ map: planetTexture })
        );

        planet.name = planetData.Planet;
        planetMap.set(planetData.Planet, planet); // Store the planet in the map

        // Parse speed value
        const speed = parseFloat(planetData[" orb_velocity[km/s]"]) / 100 || 1; // Default speed if parsing fails
        planet.userData.speed = speed;

        // Create orbit for the planet
        const orbit = createOrbit(
            orbitParams.a,
            orbitParams.e,
            orbitParams.I,
            orbitParams.w,
            orbitParams.omega,
            orbitParams.T
        );
        orbits.push(orbit);
  
        // Set planet's initial position
        const { X, Y, Z } = getOrbitPosition(
            orbitParams.a, orbitParams.e, orbitParams.I,
            orbitParams.L, orbitParams.w, orbitParams.omega, 0, orbitParams.T
        );
        planet.position.set(X, Y, Z);
        planet.rotation.x = 90;

        // Create tag for the planet and store it in tagsMap
        const tag = createPlanetTag(planet.name);
        tag.position.set(X, Y + 60, Z); // Offset the tag above the planet
        planet.userData.tag = tag; // Store the tag in userData
        tagsMap.set(planetData.Planet, tag); // Store the tag in the tagsMap
        scene.add(tag); // Add the tag to the scene

        // Add planet and orbit to the scene
        scene.add(orbit);
        scene.add(planet);
    });
}

  
createPlanets(scene);

// Create the Moon sphere
const moon = new THREE.Mesh(
    new THREE.SphereGeometry(5, 32, 32),
    new THREE.MeshStandardMaterial({ map: moonTexture })
);
moon.castShadow = true;  // Enable shadow casting for Moon
moon.receiveShadow = true;  // Enable Moon to receive shadows
scene.add(moon);

// Create the Sun sphere
// corona simulation found from: https://github.com/bobbyroe/solar-system/blob/main/src/getSun.js
const sun_radius = 50;
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
    new THREE.SphereGeometry(sun_radius, 40, 40),
    new THREE.MeshStandardMaterial({emissive: 0xff0000, map: sunTexture })
  );
  let radiation = 5
  const coronaMesh = getCorona(radiation);
  sun.add(coronaMesh);
  scene.add(sun);
  
  // Orbital parameters
  let emRadius = 50;
  let moonangle = 0;
  let moonspeed = 0.03;
  
  // Animate the scene
  let dt = 60*60; // 1 hour timestep

//animate here

// end planets ---------------------------------------------------------------------------------------------------------------------






// solar wind ----------------------------------------------------------------------------------------------------------------------




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


// end solar wind ----------------------------------------------------------------------------------------------------------------------







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


// Create Hitboxes for Celestial Bodies ---------------------------------------------------------------------

const sunHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(125, 125, 125),  // Adjust size as needed
    new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5, visible: false}) // Red for visibility
);
sunHitbox.name = "Sun";
scene.add(sunHitbox);

// Mercury Hitbox
const mercuryHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(50, 50, 50), // Adjust size based on Mercury's defined radius
    new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5, visible: false })
);
mercuryHitbox.name = "Mercury";
scene.add(mercuryHitbox);

// Venus Hitbox
const venusHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(90, 90, 90), // Adjust size based on Venus's defined radius
    new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true, opacity: 0.5, visible: false })
);
venusHitbox.name = "Venus";
scene.add(venusHitbox);

// Earth Hitbox
const earthHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(90, 90, 90), // Adjust size based on Earth's defined radius
    new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5, visible: false })
);
earthHitbox.name = "Earth";
scene.add(earthHitbox);

// Mars Hitbox
const marsHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(60, 60, 60), // Adjust size based on Mars's defined radius
    new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5, visible: false })
);
marsHitbox.name = "Mars";
scene.add(marsHitbox);

// Jupiter Hitbox
const jupiterHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(630, 630, 630), // Adjust size based on Jupiter's defined radius
    new THREE.MeshBasicMaterial({ color: 0x8b4513, transparent: true, opacity: 0.5, visible: false })
);
jupiterHitbox.name = "Jupiter";
scene.add(jupiterHitbox);

// Saturn Hitbox
const saturnHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(594, 594, 594), // Adjust size based on Saturn's defined radius
    new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.5, visible: false })
);
saturnHitbox.name = "Saturn";
scene.add(saturnHitbox);

// Uranus Hitbox
const uranusHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(284, 284, 284), // Adjust size based on Uranus's defined radius
    new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.5, visible: false })
);
uranusHitbox.name = "Uranus";
scene.add(uranusHitbox);

// Neptune Hitbox
const neptuneHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(270, 270, 270), // Adjust size based on Neptune's defined radius
    new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.5, visible: false })
);
neptuneHitbox.name = "Neptune";
scene.add(neptuneHitbox);

// Sidebar and Planet Info ------------------------------------------------------------------------------------

const rightSidebar = document.getElementById('right-sidebar');
const closeSidebarButton = document.getElementById('close-sidebar');

// Add hitboxes to the scene
celestialBodies.forEach(pbody => {
    scene.add(pbody.hitbox); // Add the hitbox to the scene
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
    document.getElementById('distance-value').textContent = `${body.distanceFromSun} km`;
    document.getElementById('orbit-value').textContent = `${body.orbitalPeriod} days`;
    document.getElementById("day-value").textContent = `${body.dayLength} hours`; 
    document.getElementById('temperature-value').textContent = `${body.temperature} °C`;
    document.getElementById('moons-value').textContent = `${body.moons}`;
    document.getElementById('planet-blurb').textContent = body.blurb;
    document.getElementById('diameter-value').textContent = `${body.diameter} km`; 
    document.getElementById('mass-value').textContent = `${body.mass} x 10²⁴ kg`;
    document.getElementById('type-value').textContent = body.typeOfPlanet; 
    document.getElementById('rings-value').textContent = `${body.rings}`; 
    document.getElementById('gravity-value').textContent = `${body.gravity} m/s²`; 
    document.getElementById('atmosphere-value').textContent = body.atmosphere; 
    
    openSidebar();
}


// toggle buttons -------------------------------------------------------------------

const orbitLinesCheckbox = document.getElementById('orbit-lines-checkbox');
const planetNamesCheckbox = document.getElementById('planet-names-checkbox');
const solarWindCheckbox = document.getElementById('solar-wind-checkbox');
  

orbitLinesCheckbox.addEventListener('change', function() {
  if (orbitLinesCheckbox.checked) {
      orbits.forEach(orbit => {
          orbit.visible = true; 
      });
      console.log("Orbit lines checked");
  } else {
      orbits.forEach(orbit => {
          orbit.visible = false; 
      });
      console.log("Orbit lines unchecked");
  }
});

/*
planetNamesCheckbox.addEventListener('change', function() {
  const isChecked = planetNamesCheckbox.checked; // Store the checkbox state
    planetDataArray.forEach(planetData => {
        const planet = scene.getObjectByName(planetData.Planet); 
        if (planet && planet.userData.tag) {
            planet.userData.tag.visible = isChecked;  // Toggle label visibility based on checkbox state
            planet.userData.tagVisible = isChecked; // Update the flag
            console.log("is", isChecked)
        }
    });

    console.log(`Planet names ${isChecked ? 'checked' : 'unchecked'}`); // Log based on the checkbox state
});
*/
planetNamesCheckbox.addEventListener('change', function() {
    const isChecked = planetNamesCheckbox.checked; // Store the checkbox state
    tagsMap.forEach((tag) => {
        tag.visible = isChecked; // Toggle label visibility based on checkbox state
    });
    console.log(`Planet names ${isChecked ? 'checked' : 'unchecked'}`); // Log based on the checkbox state
});


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
 

// raycaster -------------------------------------------------------------------


// Raycaster for detecting clicks
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Raycasting logic
window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Use hitboxes for intersection checking
    const intersects = raycaster.intersectObjects([sunHitbox, mercuryHitbox, venusHitbox, earthHitbox, jupiterHitbox, saturnHitbox, uranusHitbox, neptuneHitbox]); // Check against specific hitboxes
    //console.log("TESTING:", hitboxes);
    //const intersects = raycaster.intersectObjects(hitboxes);
    //const intersects = raycaster.intersectObjects(scene.children); // Check against all scene children
    console.log("test this", intersects);
    console.log("name of object", intersects[0].object.name);


    if (intersects.length > 0) {
        const clickedHitbox = intersects[0].object; // Get the clicked hitbox
        const clickedBody = celestialBodies.find(pbody=> pbody.name === clickedHitbox.name);
        console.log(clickedBody);
        if (clickedBody) {
            updateSidebar(clickedBody);  // Show sidebar with clicked body's info
        }
    }
});


// Sync hitboxes with celestial bodies
function syncHitboxes() {
    sunHitbox.position.copy(sun.position);
    const mercury = planetMap.get('Mercury'); // Get Mercury from the map
    if (mercury) {
        mercuryHitbox.position.copy(mercury.position);
    }
    // Sync Venus Hitbox
    const venus = planetMap.get('Venus'); // Get Venus from the map
    if (venus) {
        venusHitbox.position.copy(venus.position);
    }

    // Sync Earth Hitbox
    const earth = planetMap.get('Earth'); // Get Earth from the map
    if (earth) {
        earthHitbox.position.copy(earth.position);
    }

    // Sync Mars Hitbox
    const mars = planetMap.get('Mars'); // Get Mars from the map
    if (mars) {
        marsHitbox.position.copy(mars.position);
    }

    // Sync Jupiter Hitbox
    const jupiter = planetMap.get('Jupiter'); // Get Jupiter from the map
    if (jupiter) {
        jupiterHitbox.position.copy(jupiter.position);
    }

    // Sync Saturn Hitbox
    const saturn = planetMap.get('Saturn'); // Get Saturn from the map
    if (saturn) {
        saturnHitbox.position.copy(saturn.position);
    }

    // Sync Uranus Hitbox
    const uranus = planetMap.get('Uranus'); // Get Uranus from the map
    if (uranus) {
        uranusHitbox.position.copy(uranus.position);
    }

    // Sync Neptune Hitbox
    const neptune = planetMap.get('Neptune'); // Get Neptune from the map
    if (neptune) {
        neptuneHitbox.position.copy(neptune.position);
    }
}


function animate() {
    requestAnimationFrame(animate);
    // Update corona noise effect over time
    const time = performance.now() * 0.001;  // Time variable
    coronaMesh.userData.update(time);

    // Update positions of all planets in the scene
    planetDataArray.forEach(planetData => {
        const orbitParams = createOrbitParams(planetData);
        const planet = planetMap.get(planetData.Planet); // Get the planet from the map

        if (planet) { // Ensure the planet exists before updating its position
            // Update the planet's position at the current time
            const speed = planet.userData.speed; // Get the speed from userData
            const adjustedSimTime = sim_time * speed;

            const { X, Y, Z } = getOrbitPosition(
                orbitParams.a, orbitParams.e, orbitParams.I,
                orbitParams.L, orbitParams.w, orbitParams.omega, adjustedSimTime, orbitParams.T
            );
            planet.position.set(X, Y, Z);
            planet.rotation.y += (2 * Math.PI) / (orbitParams.rotationPeriod * 60 * 60); // Rotate based on period
            const tag = planet.userData.tag;
            if (tag) {
                tag.position.set(X, Y + 60, Z); // Keep the tag above the planet
            }
        } else {
            console.warn(`Planet ${planetData.Planet} not found in the map.`);
        }
    });

    // Update time (you can make it move backward/forward based on user input)
    sim_time += dt;

    // Moon orbital motion around Earth
    const earth = planetMap.get('Earth'); // Access Earth from the map
    if (earth) {
        const X = earth.position.x;
        const Y = earth.position.y;
        moonangle += moonspeed;
        const moonX = X + emRadius * Math.cos(moonangle);
        const moonY = Y + emRadius * Math.sin(moonangle);
        moon.position.set(moonX, moonY, 0);
    } else {
        console.warn('Earth not found in the map.');
    }
    
    // Rotate the Sun
    sun.rotation.y += 0.001;
    syncHitboxes();

    controls.update();
    renderer.render(scene, camera);
}

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