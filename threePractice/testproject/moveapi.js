import * as THREE from 'three';
//COORDINATES:
function createOrbitParams(planetData) {
  //console.warn(planetData["long.node.  [deg]"]);
  //console.log(Object.keys(planetData));
    return {
        a: parseFloat(planetData["a [au]"]) * 400, // Convert AU to scene units
        e: parseFloat(planetData["e [rad]"]),      // Access 'e [rad]' correctly
        I: parseFloat(planetData["I [deg]"]),      // Access 'I [deg]'
        L: parseFloat(planetData["L [deg]"]),      // Access 'L [deg]'
        w: parseFloat(planetData["long.peri.  [deg]"]), // Access 'long.peri. [deg]'
        omega: parseFloat(planetData["long.node.  [deg]"]), // Access 'long.node. [deg]'
        T: 365.25 * 24 * 3600 // Approximate year (can be adjusted per planet)
    };
}
// Helper functions to convert degrees to radians
function degToRad(degrees) {
    return degrees * (Math.PI / 180);
  }

// Solve Kepler's equation iteratively
function solveKepler(e, M) {
    let E = M;
    let delta = 1;
    while (Math.abs(delta) > 1e-6) {
      delta = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
      E -= delta;
    }
    return E;
  }
  
// Calculate the position of a body in its orbit
function getOrbitPosition(a, e, I, L, w, omega, t, T) {
    const n = 2 * Math.PI / T; // Mean motion (rad/s)
    const M = n * t; // Mean anomaly
    const E = solveKepler(e, M); // Eccentric anomaly
  
    // True anomaly
    const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
  
    // Distance from the focus (sun) to the object
    const r = a * (1 - e * Math.cos(E));
  
    // Position in the orbital plane (before rotation)
    let x = r * Math.cos(nu);
    let y = r * Math.sin(nu);
  
    // Convert to 3D space by rotating according to the orbital elements
    const cosOmega = Math.cos(degToRad(omega));
    const sinOmega = Math.sin(degToRad(omega));
    const cosI = Math.cos(degToRad(I));
    const sinI = Math.sin(degToRad(I));
    const cosW = Math.cos(degToRad(w));
    const sinW = Math.sin(degToRad(w));
  
    // Apply the 3D transformations using the rotation matrix
    const X = (cosOmega * cosW - sinOmega * sinW * cosI) * x + (-cosOmega * sinW - sinOmega * cosW * cosI) * y;
    const Y = (sinOmega * cosW + cosOmega * sinW * cosI) * x + (-sinOmega * sinW + cosOmega * cosW * cosI) * y;
    const Z = (sinW * sinI) * x + (cosW * sinI) * y;
  
    return { X, Y, Z };
}

// Orbit plotting function
function createOrbit(a, e, I, w, omega, T, numPoints = 100) {
    const points = [];
    for (let i = 0; i < numPoints; i++) {
        const t = (i / numPoints) * T; // Time in seconds
        const { X, Y, Z } = getOrbitPosition(a, e, I, 0, w, omega, t, T); // L is usually set to 0 for orbit plotting
        points.push(new THREE.Vector3(X, Y, Z)); // Adjust for scene scaling
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0xffffff });
    const orbitLine = new THREE.Line(geometry, material);
    
    return orbitLine;
}


export {getOrbitPosition};
export {createOrbitParams};
export {createOrbit};
