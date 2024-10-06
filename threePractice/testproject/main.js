//Saurn ring creation inspired by https://codepen.io/prisoner849/pen/zYOgroW?editors=0010
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // OrbitControls to move around with mouse
import Papa from 'papaparse';
import * as THREE from 'three'
import { ImprovedNoise } from 'https://unpkg.com/three/examples/jsm/math/ImprovedNoise.js';
import { createAsteroidOrbitParams, createAndPlotAsteroid } from './asteroids.js';
import { getOrbitPosition, createOrbit, createOrbitParams } from './moveapi.js';

// Scene setup
const scene = new THREE.Scene();
let sim_time = 0;

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
camera.position.set(0, 500, 1000);

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
scene.background = new THREE.Color(0x000000);;

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
const orbitLinesCheckbox = document.querySelector('#orbit-lines-checkbox');
const planetNamesCheckbox = document.querySelector('#label-checkbox');
const hazardousCheckbox = document.getElementById('#hazardous-asteroids-checkbox');
const nonHazardousCheckbox = document.getElementById('#non-hazardous-asteroids-checkbox');


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
      const response = await fetch('https://raw.githubusercontent.com/icalleddibs/NASA-Space-Apps-2024/refs/heads/planets/data/planets.csv');
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

async function loadAsteroidData() {
  try {
      const response = await fetch('https://raw.githubusercontent.com/icalleddibs/NASA-Space-Apps-2024/refs/heads/planets/data/NEO.csv');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const csvData = await response.text();
      const parsedData = Papa.parse(csvData, { header: true, skipEmptyLines: true }).data;
      return parsedData; // Return parsed asteroid data
  } catch (error) {
      console.error('Error fetching or parsing asteroid data:', error);
  }
}

//store main objects:
let planetDataArray = [];
let orbits = [];
let asteroids = [];
let hazardousAsteroids = [];
let non_hazardousAsteroids = [];


//creating planet labels
function createPlanetTag(planetName, planetRadius) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const fontSize = Math.max(30, planetRadius * 0.2); // Adjust font size based on planet radius
  context.font = `${fontSize}px Arial`;
  context.fillStyle = 'white';
  context.fillText(planetName, 10, 40);
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(300, 150, 1); // Adjust the size to fit your scene

  return sprite;
}

async function createAsteroids(scene) {
  asteroids = await loadAsteroidData(); // Load the CSV data for asteroids
  asteroids.forEach(asteroidData => {
      createAndPlotAsteroid(asteroidData, scene); // Create and plot each asteroid as a point
      if (asteroidData.pha == "Y") {
          hazardousAsteroids.push(asteroidData);
      } else if (asteroidData.pha == "N") {
          non_hazardousAsteroids.push(asteroidData);
      }
  });
  console.log('Loaded asteroid data:', asteroids);
  console.log('Hazardous asteroids:', hazardousAsteroids);
  console.log('Non-hazardous asteroids:', non_hazardousAsteroids);
}
createAsteroids(scene);

//creating planets
async function createPlanets(scene) {
  planetDataArray = await loadPlanetData(); // Load the CSV data
  console.log('Loaded planet data:', planetDataArray);

  planetDataArray.forEach(planetData => {
      const orbitParams = createOrbitParams(planetData);

      
      let pl_radius = 20;
      if (planetData.Planet == 'Mercury') {
        pl_radius = 10;
      } else if (planetData.Planet == 'Venus') {
        pl_radius = 30;
      } else if (planetData.Planet == 'Earth') {
        pl_radius = 30;
      } else if (planetData.Planet == 'Mars') {
        pl_radius = 15;
      } else if (planetData.Planet == 'Jupiter') {
        pl_radius = 300;
      } else if (planetData.Planet == 'Saturn') {
        pl_radius = 282;
      } else if (planetData.Planet == 'Uranus') {
        pl_radius = 127;
      } else if (planetData.Planet == 'Neptune') {
        pl_radius = 120;
      } 

      // Create planet mesh (you may want to adjust sizes for each planet)
      const planetTexture = new THREE.TextureLoader().load(`textures/${planetData.Planet.toLowerCase()}.jpg`);
      const planet = new THREE.Mesh(
          new THREE.SphereGeometry(pl_radius, 32, 32), // Adjust size
          new THREE.MeshStandardMaterial({ map: planetTexture })
      );
      planet.userData.radius = pl_radius;
      planet.name = planetData.Planet;
      // Parse speed value
      const speed = parseFloat(planetData[" orb_velocity[km/s]"]) /100 || 1; // Default speed if parsing fails
        
      // Store speed in userData for later use
      planet.userData.speed = speed;

      //console.warn(planet.name);
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

      // Add planet and its orbit to the scene
      scene.add(orbit);
      scene.add(planet);

      // Set planet's initial position (can be animated later)
      const { X, Y, Z } = getOrbitPosition(
          orbitParams.a, orbitParams.e, orbitParams.I, // orbitParams.e instead of 0
          orbitParams.L, orbitParams.w, orbitParams.omega, 0, orbitParams.T
      );
      planet.position.set(X, Y, Z);
      if (planetData.Planet == 'Saturn') {
        const ringGeo = new THREE.RingGeometry(1.5 * pl_radius, 2.0 * pl_radius, 64);
        const ringTex = new THREE.TextureLoader().load("https://firebasestorage.googleapis.com/v0/b/farpoint-js.appspot.com/o/saturn%2Fsaturn-ring.webp?alt=media&token=76117245-5be7-4c23-aee1-f33696f0d256");
        const ringMat = new THREE.MeshStandardMaterial({
            map: ringTex,
            side: THREE.DoubleSide,
            transparent: true,
        });
  
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI; // Rotate the ring to lay flat
        ringMesh.position.set(X, Y, Z); // Set the initial position of the ring
        planet.userData.ringMesh = ringMesh; // Store the ring mesh in userData
        scene.add(ringMesh);
      }
      //Apply rotation to fix planet
      planet.rotation.x = 90;

      //add tag to the planet
      const tag = createPlanetTag(planet.name, planet.userData.radius);
        tag.position.set(X, Y, Z+ planet.userData.radius + Math.log(planet.userData.radius)); // Offset the tag above the planet
        planet.userData.tag = tag; // Store the tag in the planet's userData
        
        scene.add(tag);
  });
}

// Call the createPlanets function when setting up the scene
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
// sun
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
  
function animate() {
  requestAnimationFrame(animate);
  // Update corona noise effect over time
  const time = performance.now() * 0.001;  // Time variable
  coronaMesh.userData.update(time);
 
    // Update positions of all planets in the scene
    planetDataArray.forEach(planetData => {
      const orbitParams = createOrbitParams(planetData);
      const planet = scene.getObjectByName(planetData.Planet); // Attempt to retrieve the planet

      if (planet) { // Ensure planet exists before updating its position
          const speed = planet.userData.speed; // Get the speed from userData
          //console.warn(speed);
          const adjustedSimTime = sim_time * speed;

          const { X, Y, Z } = getOrbitPosition(
              orbitParams.a, orbitParams.e, orbitParams.I, //orbitParams.e
              orbitParams.L, orbitParams.w, orbitParams.omega, adjustedSimTime, orbitParams.T
          );
          planet.position.set(X, Y, Z);
          planet.rotation.y += (2*60 * Math.PI) / (orbitParams.rotationPeriod * 60 * 60); // Rotate based on period
          // Update ring mesh position if the planet is Saturn
          if (planetData.Planet === 'Saturn') {
            const ringMesh = planet.userData.ringMesh; // Access the ring mesh from userData
            if (ringMesh) {
                ringMesh.position.set(X, Y, Z); // Update ring mesh position
            }
        }
          const tag = planet.userData.tag;
            if (tag) {
              tag.position.set(X, Y, Z+ planet.userData.radius + Math.log(planet.userData.radius)); // Keep the tag above the planet
            }
      } else {
          console.warn(`Planet ${planetData.Planet} not found in the scene.`);
      }
      
  });

  asteroids.forEach(asteroidData => {
    const asteroid = scene.getObjectByName(asteroidData.full_name);
    if (asteroid) {
      const asteroidParams = createAsteroidOrbitParams(asteroidData);
      const adjustedSimTime = sim_time; // Use simulation time directly or apply a speed factor if necessary

      const { X, Y, Z } = getOrbitPosition(
        asteroidParams.a, asteroidParams.e, asteroidParams.I,
        asteroidParams.L, asteroidParams.w, asteroidParams.omega, adjustedSimTime, asteroidParams.T
      );
      
      asteroid.position.set(X, Y, Z); // Update asteroid position
    }
  });
  
  // Update time (you can make it move backward/forward based on user input)
  sim_time += dt;

  // Moon orbital motion around Earth
  const earth = scene.getObjectByName('Earth');
  if (earth) {
      const X = earth.position.x;
      const Y = earth.position.y;
      moonangle += moonspeed;
      const moonX = X + emRadius * Math.cos(moonangle);
      const moonY = Y + emRadius * Math.sin(moonangle);
      moon.position.set(moonX, moonY, 0);
  } else {
      console.warn('Earth not found in the scene.');
  }

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
/*
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


planetNamesCheckbox.addEventListener('change', function() {
  const isChecked = planetNamesCheckbox.checked; // Store the checkbox state
    planetDataArray.forEach(planetData => {
        const planet = scene.getObjectByName(planetData.Planet); 
        if (planet && planet.userData.tag) {
            planet.userData.tag.visible = isChecked;  // Toggle label visibility based on checkbox state
        }
    });

    console.log(`Planet names ${isChecked ? 'checked' : 'unchecked'}`); // Log based on the checkbox state
});

hazardousCheckbox.addEventListener('change', function() {
  if (hazardousCheckbox.checked) {
    hazardousAsteroids.forEach(asteroid => {
        asteroid.visible = true; 
    });
    console.log("hazardous asteroids checked");
} else {
    hazardousAsteroids.forEach(asteroid => {
      asteroid.visible = false; 
    });
    console.log("hazardous asteroids unchecked");
}
});

nonHazardousCheckbox.addEventListener('change', function() {
  if (hazardousCheckbox.checked) {
    non_hazardousAsteroids.forEach(asteroid => {
        asteroid.visible = true; 
    });
    console.log("non-hazardous asteroids checked");
} else {
    non_hazardousAsteroids.forEach(asteroid => {
      asteroid.visible = false; 
    });
    console.log("non-hazardous asteroids unchecked");
}
});
*/

animate();
