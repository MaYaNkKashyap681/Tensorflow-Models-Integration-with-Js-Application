import '@mediapipe/face_detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as bodySegmentation from '@tensorflow-models/body-segmentation';

// DOM elements
const videoObj = document.getElementById("videoElement");
const toggleStreamButton = document.getElementById("toggleStream");
const startRecordingButton = document.getElementById("startRecording");
const stopRecordingButton = document.getElementById("stopRecording");

// Variables
let stream = null;
let detector = null;

// Canvas elements
const canvas2d = document.getElementsByTagName("canvas")[0];
// const ctx = canvas2d.getContext("2d");

// Event listeners
toggleStreamButton.addEventListener("click", toggleStream);
startRecordingButton.addEventListener("click", startRecording);
stopRecordingButton.addEventListener("click", stopRecording);

// Constraints for video stream
const constraints = {
    video: {
        width: { min: 1024, ideal: 1280, max: 1920 },
        height: { min: 576, ideal: 720, max: 1080 },
    },
}

// Initialize face detection model
async function initializeBodySegmentationDetector() {
    try {
        const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;
        const detectorConfig = { runtime: 'tfjs' };
        detector = await bodySegmentation.createSegmenter(model, detectorConfig);
    } catch (error) {
        console.error('Error initializing face detector:', error);
    }
}
initializeBodySegmentationDetector();

// Function to toggle video stream
async function toggleStream() {
    if (stream) {
        stopStream();
    } else {
        try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            handleStream(stream);
            startRecordingButton.disabled = false;
            requestAnimationFrame(processVideoFrame); // Start processing frames
        } catch (error) {
            console.error('Error accessing the camera:', error);
        }
    }
}

// Function to handle video stream
function handleStream(stream) {
    videoObj.srcObject = stream;
}

// Function to stop video stream
function stopStream() {
    if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        videoObj.srcObject = null;
        stream = null;
        startRecordingButton.disabled = true;
        stopRecordingButton.disabled = true;
    }
}

// Function to process video frames for face detection
function processVideoFrame() {
    if (!stream) return; // Check if stream is available
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    // Ensure canvas dimensions are set correctly before drawing
    if (videoObj.videoWidth && videoObj.videoHeight) {
        canvas.width = videoObj.videoWidth;
        canvas.height = videoObj.videoHeight;
        context.drawImage(videoObj, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        detectorFunc(imageData); // Call detector function with image data
    }
    requestAnimationFrame(processVideoFrame); // Continuously process frames
}

// Function to detect faces in an image
async function detectorFunc(image) {
    if (!detector) {
        console.error('Segmentation detector is not initialized.');
        return;
    }
    const estimationConfig = { flipHorizontal: false };
    try {
        const segmentation = await detector.segmentPeople(image, estimationConfig);
        console.log(segmentation);
        drawSegmentation(segmentation); 
    } catch (error) {
        console.error('Error detecting faces:', error);
    }
}


function drawSegmentation(segmentation) {
    const ctx = canvas2d.getContext('2d');
    const mask = segmentation.segmentationMask;
    const width = segmentation.width;
    const height = segmentation.height;

    // Set canvas dimensions
    canvas2d.width = width;
    canvas2d.height = height;

    // Create a new ImageData object
    const segData = new ImageData(new Uint8ClampedArray(mask), width, height);

    // Draw the segmentation mask onto the canvas
    ctx.putImageData(segData, 0, 0);
}

// Function to draw detected faces on the canvas
function drawFaces(ctx, faces) {
    ctx.clearRect(0, 0, canvas2d.width, canvas2d.height); // Clear the canvas
    for (const face of faces) {
        ctx.strokeStyle = "red"; // Set stroke color
        ctx.lineWidth = 2; // Set line width
        // Draw the box
        ctx.beginPath();
        ctx.rect(face.box.xMin, face.box.yMin, face.box.width / 4, face.box.height / 4);
        ctx.stroke();
        ctx.closePath();
    }
}
