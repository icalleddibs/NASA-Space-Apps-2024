import * as THREE from 'three';
import { degToRad, solveKepler } from './moveapi.js';
import { getOrbitPosition } from './moveapi.js';

const SECONDS_IN_YEAR = 365.25 * 24 * 3600; 

// Function to extract asteroid orbit parameters from the parsed data
function createAsteroidOrbitParams(asteroidData) {
    //console.log('Asteroid Data Keys:', Object.keys(asteroidData)); // Debugging statement

    const a = parseFloat(asteroidData["a [au]"]) * 400; // Convert AU to scene units
    const periodInYears = parseFloat(asteroidData["per_y"]); // Orbital period in Earth years

    return {
        full_name: asteroidData["full_name"], // Unique name for the asteroid
        pha: asteroidData["pha"], // Potentially hazardous asteroid flag
        a: a, // Semi-major axis in scene units
        e: parseFloat(asteroidData["e [rad]"]), // Eccentricity
        I: parseFloat(asteroidData["I [deg]"]), // Inclination in degrees
        L: parseFloat(asteroidData["L [deg]"]), // Mean longitude in degrees
        w: parseFloat(asteroidData["long.peri.  [deg]"]), // Longitude of perihelion
        omega: parseFloat(asteroidData["long.node.  [deg]"]), // Longitude of ascending node
        n: parseFloat(asteroidData["n"]), // Mean motion deg/day
        T: periodInYears * SECONDS_IN_YEAR // Convert period from years to seconds
    };
}

// Function to create an asteroid and add it to the scene
function createAndPlotAsteroid(asteroidData, scene) {
    const asteroidParams = createAsteroidOrbitParams(asteroidData);
    console.log('Asteroid Params:', asteroidParams); // Debugging statement
    // If asteroidParams is invalid, return early
    if (!asteroidParams) {
        console.error('Invalid asteroid params:', asteroidData);
        return;
    }

    const { X, Y, Z } = getOrbitPosition(
        asteroidParams.a, asteroidParams.e, asteroidParams.I, 
        asteroidParams.L, asteroidParams.w, asteroidParams.omega, 0, asteroidParams.T
    );

    // Debugging: Ensure the position values are valid numbers
    if (isNaN(X) || isNaN(Y) || isNaN(Z)) {
        console.error('Invalid position calculated:', X, Y, Z);
        return;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([X, Y, Z], 3));
    let ast_color = 0xffffff;

    if (asteroidParams.pha == "Y") {
        console.log('Potentially hazardous asteroid:', asteroidParams.full_name);
        ast_color= 0xff0000
    } else if (asteroidParams.pha == "N") {
        console.log('Safe asteroid:', asteroidParams.full_name);
        ast_color = 0xffffff;
    }

    const material = new THREE.PointsMaterial({
        color: ast_color,
        size: 3,
        sizeAttenuation: true
    });

    const asteroidPoint = new THREE.Points(geometry, material);
    asteroidPoint.name = asteroidData.full_name;  // Ensure the asteroid has a unique name
    scene.add(asteroidPoint);
}

export { createAndPlotAsteroid, createAsteroidOrbitParams };