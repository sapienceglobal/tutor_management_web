'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';

const DETECTION_INTERVAL_MS = 2500; // Normal monitoring interval
const LOOK_AWAY_THRESHOLD   = 0.35; // Head movement tolerance
const LOOK_DOWN_THRESHOLD   = 0.55; // 🚀 Naya feature: Niche dekhna track karne ke liye

let faceApiLoaded = false;
let faceApi       = null;

async function loadFaceApi() {
    if (faceApiLoaded && faceApi) return faceApi;
    const api = await import('@vladmandic/face-api');
    faceApi = api;
    
    // SSD heavy hota hai isliye real-time me freeze hota hai.
    // Hum wapas TinyFaceDetector par aayenge lekin ab ye theek se kaam karega 
    // kyunki humne CSS shrinking issue fix kar diya hai.
    await Promise.all([
        api.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        api.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
    ]);
    
    faceApiLoaded = true;
    return api;
}

// Function to check if student is looking away from the screen
function estimateHeadPose(landmarks) {
    try {
        const positions = landmarks.positions;
        if (!positions || positions.length < 68) return null;
        const noseTip       = positions[30];
        const leftEyeLeft   = positions[36];
        const rightEyeRight = positions[45];
        const faceCenter    = {
            x: (leftEyeLeft.x + rightEyeRight.x) / 2,
            y: (leftEyeLeft.y + rightEyeRight.y) / 2,
        };
        const eyeDistance = Math.abs(rightEyeRight.x - leftEyeLeft.x);
        if (eyeDistance < 1) return null;
        const yaw   = (noseTip.x - faceCenter.x) / eyeDistance;
        const pitch = (noseTip.y - faceCenter.y) / eyeDistance;
        return { yaw, pitch };
    } catch { return null; }
}

export function useFaceProctoring({ videoRef, isActive, isVerificationMode = false, onEvent, examDuration, timeLeftRef }) {
    const [status, setStatus]               = useState('idle');
    const [faceCount, setFaceCount]         = useState(0);
    const [isFaceAligned, setIsFaceAligned] = useState(false); // NEW: For Verification Step
    const intervalRef                       = useRef(null);
    const consecutiveNoFace                 = useRef(0);

    // 🎤 Audio analysis (Noise detection) refs
    const audioContextRef = useRef(null);
    const analyserRef     = useRef(null);
    const dataArrayRef    = useRef(null);

    const emitEvent = useCallback((eventType, severity, details) => {
        const timeLeft       = timeLeftRef?.current ?? 0;
        const videoTimestamp = examDuration ? (examDuration - timeLeft) : 0;
        onEvent?.({
            eventType,
            severity,
            timestamp:      new Date().toISOString(),
            details,
            videoTimestamp: Math.max(0, videoTimestamp),
        });
    }, [onEvent, examDuration, timeLeftRef]);

    const detect = useCallback(async () => {
        const video = videoRef?.current;
        if (!video || !video.srcObject || video.readyState < 2 || !faceApi) return;
        if (video.paused || video.ended) return;

        // 🎤 1. AUDIO PROCTORING: Background Noise Detection
        if (!audioContextRef.current && video.srcObject.getAudioTracks().length > 0) {
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const analyser = audioCtx.createAnalyser();
                const source = audioCtx.createMediaStreamSource(video.srcObject);
                source.connect(analyser);
                analyser.fftSize = 256;
                const bufferLength = analyser.frequencyBinCount;
                dataArrayRef.current = new Uint8Array(bufferLength);
                audioContextRef.current = audioCtx;
                analyserRef.current = analyser;
            } catch (e) { console.warn("Audio context init failed", e); }
        }

        if (analyserRef.current && dataArrayRef.current && !isVerificationMode) {
            analyserRef.current.getByteFrequencyData(dataArrayRef.current);
            let sum = 0;
            for (let i = 0; i < dataArrayRef.current.length; i++) sum += dataArrayRef.current[i];
            const avgVolume = sum / dataArrayRef.current.length;
            
            if (avgVolume > 35) { // Threshold for talking/noise
                emitEvent('audio_anomaly', 'medium', `Suspicious background noise or talking detected (Vol: ${Math.round(avgVolume)})`);
            }
        }

        // 🚀 THE ULTIMATE FIX: Bypass CSS shrinking
        // Is se TinyFaceDetector ko original HD resolution milega, toh wo dur se bhi face pakad lega.
        if (video.videoWidth > 0 && video.width !== video.videoWidth) {
            video.width = video.videoWidth;
            video.height = video.videoHeight;
        }

        try {
            // Options optimized for webcams
            const options = new faceApi.TinyFaceDetectorOptions({
                inputSize: 320,      // Fast process
                scoreThreshold: 0.3  // Forgiving enough to catch face easily
            });

            const detections = await faceApi
                .detectAllFaces(video, options)
                .withFaceLandmarks(true); // true means use tiny landmarks

            const count = detections.length;
            
            // UI Update
            setFaceCount(count);

            // Alignment Logic (For Verification Step)
        let aligned = false;
        if (count === 1 && detections[0].landmarks) {
            const pose = estimateHeadPose(detections[0].landmarks);
            // 🚀 Added Pitch check for looking down during verification
            if (pose && Math.abs(pose.yaw) <= LOOK_AWAY_THRESHOLD && pose.pitch <= LOOK_DOWN_THRESHOLD) {
                aligned = true;
            }
        }
        setIsFaceAligned(aligned);

        // ==========================================
        // IF IN VERIFICATION MODE: Stop here, don't emit DB events
            // ==========================================
            if (isVerificationMode) return;

            // ==========================================
            // NORMAL PROCTORING MODE LOGIC
            // ==========================================

            // 1. Check for NO FACE
            if (count === 0) {
                consecutiveNoFace.current += 1;
                if (consecutiveNoFace.current >= 2) {
                    emitEvent(
                        'no_face',
                        consecutiveNoFace.current >= 4 ? 'high' : 'medium',
                        'No face detected for ' + (consecutiveNoFace.current * DETECTION_INTERVAL_MS / 1000) + 's'
                    );
                }
                return; // Stop further processing if no face
            }

            consecutiveNoFace.current = 0;

            // 2. Check for MULTIPLE FACES (Cheating Alert)
        if (count > 1) {
            emitEvent('multiple_faces', 'high', `${count} faces detected in camera — possible assistance!`);
            return; // Stop processing head pose if multiple people are there
        }

        // 3. Check for LOOKING AWAY or LOOKING DOWN (Head Pose)
        const detection = detections[0];
        if (detection.landmarks) {
            const pose = estimateHeadPose(detection.landmarks);
            if (pose) {
                if (Math.abs(pose.yaw) > LOOK_AWAY_THRESHOLD) {
                    const direction = pose.yaw > 0 ? 'right' : 'left';
                    emitEvent('audio_anomaly', 'low', `Student looking ${direction} continuously`);
                } else if (pose.pitch > LOOK_DOWN_THRESHOLD) {
                    // 🚀 Gaze Strictness: Student is looking down at phone/desk
                    emitEvent('unauthorized_object', 'medium', 'Student looking down continuously (Suspected phone/book usage on desk)');
                }
            }
        }
    } catch (err) {
            if (process.env.NODE_ENV === 'development') {
                console.warn('Detection frame error:', err.message);
            }
            // Agar model freeze hota hai error ki wajah se, toh count reset kar do
            setFaceCount(0);
            setIsFaceAligned(false);
        }
    }, [videoRef, emitEvent, isVerificationMode]);

    useEffect(() => {
        if (!isActive) {
            clearInterval(intervalRef.current);
            setStatus('idle');
            return;
        }

        let cancelled = false;

        const init = async () => {
            setStatus('loading');
            try {
                await loadFaceApi();
                if (cancelled) return;

                await new Promise((resolve, reject) => {
                    let attempts = 0;
                    const check = () => {
                        if (cancelled) { reject(new Error('cancelled')); return; }
                        const v = videoRef?.current;
                        if (v && v.srcObject && v.readyState >= 2 && !v.paused) {
                            resolve();
                        } else if (attempts > 30) {
                            reject(new Error('Camera stream not available after 15s'));
                        } else {
                            attempts++;
                            setTimeout(check, 500);
                        }
                    };
                    check();
                });

                if (cancelled) return;
                setStatus('active');
                
                // Fast interval (1s) during verification, Normal (2.5s) during exam
                const intervalTime = isVerificationMode ? 1000 : DETECTION_INTERVAL_MS;
                intervalRef.current = setInterval(detect, intervalTime);

            } catch (err) {
                if (cancelled) return;
                if (err.message === 'cancelled') return;

                console.warn('Face proctoring unavailable:', err.message);
                setStatus('error');
            }
        };

        init();

        return () => {
            cancelled = true;
            clearInterval(intervalRef.current);
        };
    }, [isActive, detect, videoRef, isVerificationMode]);

    return { status, faceCount, isFaceAligned };
}