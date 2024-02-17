import { handPoses } from './sampleObjHands';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection'

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
async function initializeHandPoseDetector() {
    try {
        const model = handPoseDetection.SupportedModels.MediaPipeHands;
        const detectorConfig = { runtime: 'tfjs' };
        detector = await handPoseDetection.createDetector(model, detectorConfig);
    } catch (error) {
        console.error('Error initializing hands detector:', error);
    }
}
initializeHandPoseDetector();

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


// Function to handle video stream
function handleStream(stream) {
    videoObj.srcObject = stream;
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
        console.error('Hands detector is not initialized.');
        return;
    }

    const estimationConfig = { flipHorizontal: false };
    try {
        const handPose = await detector.estimateHands(image, estimationConfig);
        const videoWidth = videoObj.videoWidth;
        const videoHeight = videoObj.videoHeight;
        const scaleFactorX = canvas2d.width / videoWidth;
        const scaleFactorY = canvas2d.height / videoHeight;

        console.log("Coming From Hand Pose", handPose);
        drawFaces(ctx, handPose, scaleFactorX, scaleFactorY);
    } catch (error) {
        console.error('Error detecting faces:', error);
    }
}

function drawFaces(ctx, handPoses, scaleFactorX, scaleFactorY) {
    console.log(scaleFactorX, scaleFactorY);
    ctx.clearRect(0, 0, canvas2d.width, canvas2d.height);
    handPoses.forEach(handPose => {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        handPose.keypoints.forEach(handPoint => {
            ctx.beginPath();
            ctx.arc(handPoint.x * scaleFactorX, handPoint.y * scaleFactorY, 1, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.closePath();
        });
    });
}

