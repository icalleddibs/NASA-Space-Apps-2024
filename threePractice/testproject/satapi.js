import * as satellite from 'satellite.js';

async function fetchTLEData(url) {
    try {
        // const response = await fetch(url);
        const response = await fetch("celestrak.txt");
        if (!response.ok) {
            throw new Error('Failed to fetch TLE data');
        }
        const tleData = await response.text(); // TLEs are in plain text format
        return tleData;
    } catch (error) {
        console.error('Error fetching TLE data:', error);
        return null;
    }
}

function parseTLE(tleData) {
    const tleLines = tleData.split('\n').filter(line => line.trim() !== '');
    const satellites = [];

    for (let i = 0; i < tleLines.length; i += 3) {
        const satellite = {
            name: tleLines[i].trim(),
            line1: tleLines[i + 1],
            line2: tleLines[i + 2],
        };
        satellites.push(satellite);
    }

    return satellites;
}


function getOrbit(tleLine1, tleLine2){
    const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
    
    // Get current time
    const now = new Date();

    // Propagate satellite position and velocity
    const positionAndVelocity = satellite.propagate(satrec, now);

    // Get ECI position (x, y, z in km) and velocity (km/s)
    const positionEci = positionAndVelocity.position;
    const velocityEci = positionAndVelocity.velocity;
    console.log('Position (ECI):', positionEci);
    console.log('Velocity (ECI):', velocityEci);

}
function getSatellitePosition(TLE1, TLE2, date, earthRadius) {
    const satrec = satellite.twoline2satrec(TLE1, TLE2);
    if (!satrec) {
        console.error("Failed to create satellite record from TLE:", TLE1, TLE2);
        return { x: 0, y: 0, z: 0 }; // Handle invalid satellite record
    }

    const positionAndVelocity = satellite.propagate(satrec, date);

    const positionEci = positionAndVelocity.position;

    // Convert ECI to ECEF
    const ecef = satellite.eciToEcf(positionEci, date);

    // Check ECEF values for validity
    if (isNaN(ecef.x) || isNaN(ecef.y) || isNaN(ecef.z)) {
        console.error("Invalid ECEF position:", ecef);
        return { x: 0, y: 0, z: 0 };
    }

    // Scale ECEF position to fit your Three.js scene
    return {
        x: ecef.x / (earthRadius) *4,
        y: ecef.y / (earthRadius)*4,
        z: ecef.z / (earthRadius)*4
    };
}


export {fetchTLEData, parseTLE, getSatellitePosition};
