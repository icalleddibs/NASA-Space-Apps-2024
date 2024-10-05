import * as THREE from 'three';
// Function to reset the camera view to a full view of the solar system
function resetCameraView(camera, controls) {
    camera.position.set(0, 500, 1000);  // Adjust these values for the desired full view
    controls.target.set(0, 0, 0); // Focus on the center of the solar system
    controls.update();
}