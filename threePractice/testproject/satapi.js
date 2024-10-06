import * as satellite from 'satellite.js';

async function fetchTLEData(url) {
    try {
        const response = await fetch(url);
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



function getSatellitePosition(TLE1, TLE2, date, earthRadius) {
    const satrec = satellite.twoline2satrec(TLE1, TLE2);
    // console.log(satrec)
    if (!satrec) {
        console.error("Failed to create satellite record from TLE:", TLE1, TLE2);
        return { x: 0, y: 0, z: 0 }; // Handle invalid satellite record
    }

    const positionAndVelocity = satellite.propagate(satrec, date);
    // console.log(positionAndVelocity)
    const positionEci = positionAndVelocity.position;
    // console.log(positionEci)

    
    return{
        x : positionEci.x/(earthRadius/2),
        y : positionEci.y/(earthRadius/2),
        z : positionEci.z/(earthRadius/2),


    }
}


export {fetchTLEData, parseTLE, getSatellitePosition};
