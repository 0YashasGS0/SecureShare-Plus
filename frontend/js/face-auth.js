/**
 * FACE-AUTH.JS
 * Wrapper for face-api.js to handle facial recognition tasks
 */

const FACE_MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

// State
let modelsLoaded = false;
let faceMatcher = null;

function isModelsLoaded() { return modelsLoaded; }

/**
 * Load necessary Face API models using a CDN-hosted version of face-api.js
 * We assume the script tag for face-api.js is added to the HTML
 */
async function loadFaceModels() {
    if (modelsLoaded) return true;

    try {
        console.log('🧠 Loading Face API models...');
        // Load the tiny model for performance on mobile/client
        await faceapi.nets.tinyFaceDetector.loadFromUri(FACE_MODEL_URL);
        await faceapi.nets.faceLandmark68TinyNet.loadFromUri(FACE_MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(FACE_MODEL_URL);

        modelsLoaded = true;
        console.log('✅ Face API models loaded');
        return true;
    } catch (error) {
        console.error('❌ Failed to load face models:', error);
        throw new Error('Failed to initialize face recognition system');
    }
}

/**
 * Start camera stream on a video element
 */
async function startCamera(videoElement) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported/allowed');
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
            }
        });
        videoElement.srcObject = stream;

        return new Promise((resolve) => {
            videoElement.onloadedmetadata = () => {
                videoElement.play();
                resolve(true);
            };
        });
    } catch (error) {
        console.error('Camera error:', error);
        throw new Error('Could not access camera. Please allow permissions.');
    }
}

/**
 * Stop camera stream
 */
function stopCamera(videoElement) {
    if (videoElement && videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
    }
}

/**
 * Detect face and return 128-d descriptor (Float32Array)
 */
async function captureFaceDescriptor(videoElement) {
    if (!modelsLoaded) await loadFaceModels();

    // Detect face
    // Use TinyFaceDetectorOptions for speed with smaller input size (default is 416, 224/320 is faster)
    // withFaceLandmarks(true) tells it to use the tiny landmark model if loaded
    const detections = await faceapi.detectSingleFace(
        videoElement,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
    ).withFaceLandmarks(true).withFaceDescriptor();

    if (!detections) {
        throw new Error('No face detected. Please position your face clearly in the frame.');
    }

    return detections.descriptor; // Float32Array(128)
}

/**
 * Compute Cosine Similarity between two descriptors (0 to 1)
 * Higher is more similar.
 */
function computeInformationMatch(descriptor1, descriptor2) {
    const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
    // FaceAPI typically uses Euclidean distance. 
    // < 0.6 is usually a match. 
    // Let's invert it roughly for a "score" or just return distance and check threshold.
    return distance;
}

/**
 * Convert Float32Array to Base64 JSON string for storage/url
 */
function descriptorToString(descriptor) {
    return JSON.stringify(Array.from(descriptor));
}

/**
 * Convert Base64 JSON string back to Float32Array
 */
function stringToDescriptor(str) {
    return new Float32Array(JSON.parse(str));
}
