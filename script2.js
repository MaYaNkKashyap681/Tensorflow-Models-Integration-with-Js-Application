import '@mediapipe/face_detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as faceDetection from '@tensorflow-models/face-detection';
import { input } from './sampleObj';

// DOM elements
const videoObj = document.getElementById("videoElement");
const toggleStreamButton = document.getElementById("toggleStream");
const startRecordingButton = document.getElementById("startRecording");
const stopRecordingButton = document.getElementById("stopRecording");

// Variables
let stream = null;
let mediaRecorder = null;
let recordedChunks = [];
let detector = null;

// Canvas elements
const canvas2d = document.getElementsByTagName("canvas")[0];
const ctx = canvas2d.getContext("2d");

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
async function initializeFaceDetector() {
    try {
        const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
        const detectorConfig = { runtime: 'tfjs' };
        detector = await faceDetection.createDetector(model, detectorConfig);
    } catch (error) {
        console.error('Error initializing face detector:', error);
    }
}
initializeFaceDetector();

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
        if (mediaRecorder) {
            mediaRecorder.stop();
            mediaRecorder = null;
        }
    }
}

// Function to start recording
function startRecording() {
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start();
    startRecordingButton.disabled = true;
    stopRecordingButton.disabled = false;
}

// Function to handle recorded data
function handleDataAvailable(event) {
    recordedChunks.push(event.data);
}

// Function to stop recording
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        startRecordingButton.disabled = false;
        stopRecordingButton.disabled = true;
        saveRecording();
    }
}

// Function to save recording
function saveRecording() {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recorded-video.webm';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
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
        console.error('Face detector is not initialized.');
        return;
    }

    const estimationConfig = { flipHorizontal: false };
    try {
        const faces = await detector.estimateFaces(image, estimationConfig);
        // Adjust detected faces coordinates to match the video feed position and size
        const videoWidth = videoObj.videoWidth;
        const videoHeight = videoObj.videoHeight;
        const scaleFactorX = canvas2d.width / videoWidth;
        const scaleFactorY = canvas2d.height / videoHeight;
        for (const face of faces) {
            face.box.xMin *= scaleFactorX;
            face.box.xMax *= scaleFactorX;
            face.box.yMin *= scaleFactorY;
            face.box.yMax *= scaleFactorY;
        }
        console.log(faces);
        // Draw the detected faces on the canvas
        drawFaces(ctx, faces);
    } catch (error) {
        console.error('Error detecting faces:', error);
    }
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
