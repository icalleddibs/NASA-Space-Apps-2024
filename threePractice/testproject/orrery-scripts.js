

// Get elements
const rightSidebar = document.getElementById('right-sidebar');
const closeSidebarButton = document.getElementById('close-sidebar');

// Sidebar content elements
const planetName = document.getElementById('planet-name');
const planetDistance = document.getElementById('planet-distance');
const planetOrbit = document.getElementById('planet-orbit');
const planetTemperature = document.getElementById('planet-temperature');
const planetMoons = document.getElementById('planet-moons');

// Function to open the right sidebar
function openSidebar() {
    rightSidebar.classList.add('active');
}

// Function to close the right sidebar
function closeSidebar() {
    rightSidebar.classList.remove('active');
}

// Event listener for the close button inside the right sidebar
closeSidebarButton.addEventListener('click', closeSidebar);

// Function to update sidebar with planet info
function updateSidebar(planet) {
    planetName.textContent = planet.name;
    planetDistance.textContent = `Distance from Sun: ${planet.distanceFromSun} km`;
    planetOrbit.textContent = `Orbital Period: ${planet.orbitalPeriod} days`;
    planetTemperature.textContent = `Temperature: ${planet.temperature} °C`;
    planetMoons.textContent = `Moons: ${planet.moons}`;
    openSidebar();
}

// THREE.js Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({canvas: document.getElementById('bg')});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Raycaster for detecting planet clicks
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Add your planets (dummy data)
const planets = [
    {name: "Earth", distanceFromSun: "149,600,000", orbitalPeriod: 365, temperature: 15, moons: 1, mesh: null},
    {name: "Mars", distanceFromSun: "227,900,000", orbitalPeriod: 687, temperature: -63, moons: 2, mesh: null}
];

// Add planets to the scene
planets.forEach((planet, index) => {
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshBasicMaterial({color: 0x00ff00});
    const planetMesh = new THREE.Mesh(geometry, material);
    
    planetMesh.position.x = index * 3;  // Position planets apart
    planet.mesh = planetMesh;
    scene.add(planetMesh);
});

camera.position.z = 10;

// Detect mouse clicks on planets
window.addEventListener('click', (event) => {
    // Update mouse vector
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Set raycaster to current mouse position and camera
    raycaster.setFromCamera(mouse, camera);

    // Check for intersections with planets
    const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));

    // Debugging: Log the number of intersections
    console.log('Intersects:', intersects);

    if (intersects.length > 0) {
        // Find the clicked planet by matching the intersected mesh
        const clickedPlanet = planets.find(p => p.mesh === intersects[0].object);
        
        if (clickedPlanet) {
            // Debugging: Log the clicked planet
            console.log('Clicked Planet:', clickedPlanet);
            
            // Show the sidebar with planet info
            updateSidebar(clickedPlanet);  
        }
    }
});

// Render loop
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
animate();
  
