/**
 * Face Analyzer Module
 * Uses face-api.js for real-time facial expression detection and cheat monitoring
 * Runs 100% client-side — zero API calls
 */

// face-api.js is loaded from npm
import * as faceapi from 'face-api.js';

class FaceAnalyzer {
  constructor() {
    this.video = null;
    this.canvas = null;
    this.isRunning = false;
    this.detectionInterval = null;
    this.modelsLoaded = false;

    // Expression tracking
    this.expressionHistory = [];
    this.currentExpression = { label: 'neutral', emoji: '😐' };
    this.cheatWarnings = 0;
    this.noFaceCount = 0;

    // Callbacks
    this.onExpression = null;
    this.onCheatDetected = null;
    this.onMetricsUpdate = null;

    // Expression emoji map
    this.emojiMap = {
      neutral: '😐',
      happy: '😊',
      sad: '😢',
      angry: '😠',
      fearful: '😰',
      disgusted: '🤢',
      surprised: '😲'
    };
  }

  /**
   * Load face-api.js models
   */
  async loadModels() {
    if (this.modelsLoaded) return;

    const MODEL_URL = '/models';

    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL)
      ]);
      this.modelsLoaded = true;
      console.log('✅ Face detection models loaded');
    } catch (error) {
      console.error('Failed to load face models:', error);
      throw new Error('Failed to load face detection models. Please check the models directory.');
    }
  }

  /**
   * Start webcam and face detection
   */
  async start(videoElement, canvasElement) {
    this.video = videoElement;
    this.canvas = canvasElement;

    // Request webcam access
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      });
      this.video.srcObject = stream;
      await new Promise(resolve => {
        this.video.onloadedmetadata = () => {
          this.video.play();
          resolve();
        };
      });
    } catch (error) {
      console.error('Webcam access denied:', error);
      throw new Error('Camera access denied. Please allow camera access to proceed.');
    }

    // Load models if not loaded
    await this.loadModels();

    // Match canvas size to video
    const displaySize = { width: this.video.videoWidth, height: this.video.videoHeight };
    faceapi.matchDimensions(this.canvas, displaySize);

    // Start detection loop
    this.isRunning = true;
    this.startDetection();

    return true;
  }

  /**
   * Main detection loop - runs every 500ms
   */
  startDetection() {
    this.detectionInterval = setInterval(async () => {
      if (!this.isRunning || !this.video) return;

      try {
        const detections = await faceapi
          .detectAllFaces(this.video, new faceapi.TinyFaceDetectorOptions({
            inputSize: 224,
            scoreThreshold: 0.5
          }))
          .withFaceLandmarks(true)
          .withFaceExpressions();

        // Clear canvas
        const ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (detections.length === 0) {
          // No face detected - potential cheating
          this.noFaceCount++;
          if (this.noFaceCount >= 4) { // 2 seconds of no face
            this.cheatWarnings++;
            this.noFaceCount = 0;
            if (this.onCheatDetected) {
              this.onCheatDetected('No face detected — please look at the camera');
            }
          }
          this.currentExpression = { label: 'no face', emoji: '👻' };
        } else if (detections.length > 1) {
          // Multiple faces - cheating
          this.cheatWarnings++;
          if (this.onCheatDetected) {
            this.onCheatDetected('Multiple faces detected — this interview is for one person only');
          }
        } else {
          this.noFaceCount = 0;
          const detection = detections[0];
          const expressions = detection.expressions;

          // Find dominant expression
          const expArray = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
          const dominantExp = expArray[0];

          this.currentExpression = {
            label: dominantExp[0],
            confidence: Math.round(dominantExp[1] * 100),
            emoji: this.emojiMap[dominantExp[0]] || '😐'
          };

          // Store expression snapshot
          this.expressionHistory.push({
            timestamp: Date.now(),
            ...expressions
          });

          // Draw detection on canvas
          const resized = faceapi.resizeResults(detections, {
            width: this.canvas.width,
            height: this.canvas.height
          });
          faceapi.draw.drawDetections(this.canvas, resized);
        }

        // Update metrics
        if (this.onExpression) {
          this.onExpression(this.currentExpression);
        }
        if (this.onMetricsUpdate) {
          this.onMetricsUpdate(this.getMetrics());
        }

      } catch (error) {
        // Silently handle occasional detection errors
      }
    }, 500);
  }

  /**
   * Get current metrics summary
   */
  getMetrics() {
    if (this.expressionHistory.length === 0) {
      return {
        confidence: 0,
        nervousness: 0,
        engagement: 0,
        cheatWarnings: this.cheatWarnings
      };
    }

    const recent = this.expressionHistory.slice(-20); // Last 10 seconds
    const avg = {};
    const keys = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised'];
    keys.forEach(key => {
      avg[key] = recent.reduce((sum, e) => sum + (e[key] || 0), 0) / recent.length;
    });

    const confidence = Math.round((avg.neutral * 0.4 + avg.happy * 0.3 + (1 - avg.fearful) * 0.3) * 100);
    const nervousness = Math.round((avg.fearful * 0.5 + avg.surprised * 0.2 + avg.sad * 0.3) * 100);
    const engagement = Math.round(Math.min(100, (1 - avg.neutral * 0.5) * 100 + 30));

    return {
      confidence: Math.min(confidence, 100),
      nervousness: Math.min(nervousness, 100),
      engagement: Math.min(engagement, 100),
      cheatWarnings: this.cheatWarnings
    };
  }

  /**
   * Get expression data for the current question session
   */
  getExpressionData() {
    return {
      expressions: this.expressionHistory.slice(-60), // Last 30 seconds
      cheatWarnings: this.cheatWarnings,
      metrics: this.getMetrics()
    };
  }

  /**
   * Reset for next question
   */
  resetForQuestion() {
    this.expressionHistory = [];
    // Don't reset cheatWarnings — cumulative for the session
  }

  /**
   * Stop everything
   */
  stop() {
    this.isRunning = false;

    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }

    if (this.video && this.video.srcObject) {
      this.video.srcObject.getTracks().forEach(track => track.stop());
      this.video.srcObject = null;
    }
  }
}

export default FaceAnalyzer;
