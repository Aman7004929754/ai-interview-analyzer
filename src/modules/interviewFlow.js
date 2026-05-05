/**
 * Interview Flow Orchestrator
 * Coordinates the full interview lifecycle:
 * question → speech recording → face data → submit → feedback → next
 *
 * Uses client-side session state for Vercel serverless compatibility.
 */

import FaceAnalyzer from './faceAnalyzer.js';
import SpeechEngine from './speechEngine.js';

class InterviewFlow {
  constructor() {
    this.faceAnalyzer = new FaceAnalyzer();
    this.speechEngine = new SpeechEngine();

    this.sessionId = null;
    this.sessionState = null; // Client-held session state for serverless
    this.subject = '';
    this.subjectIcon = '';
    this.currentQuestion = null;
    this.currentQuestionNumber = 0;
    this.totalQuestions = 0;
    this.isRecording = false;
    this.startTime = null;

    // Results storage
    this.questionResults = [];

    // Callbacks for UI updates
    this.onQuestionChange = null;
    this.onExpressionUpdate = null;
    this.onCheatWarning = null;
    this.onMetricsUpdate = null;
    this.onTranscriptUpdate = null;
    this.onInterimUpdate = null;
    this.onEvaluationReady = null;
    this.onInterviewComplete = null;
    this.onError = null;
  }

  /**
   * Initialize the interview: start session, setup webcam, load first question
   */
  async initialize(subject, difficulty, questionCount, videoEl, canvasEl) {
    try {
      // Start interview session on server
      const response = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, difficulty, questionCount })
      });

      if (!response.ok) throw new Error('Failed to start interview session');

      const data = await response.json();
      this.sessionId = data.sessionId;
      this.sessionState = data.sessionState; // Hold session state client-side
      this.subject = data.subject;
      this.subjectIcon = data.icon;
      this.totalQuestions = data.totalQuestions;
      this.currentQuestionNumber = 1;
      this.currentQuestion = data.question;
      this.startTime = Date.now();

      // Setup face analyzer
      this.faceAnalyzer.onExpression = (exp) => {
        if (this.onExpressionUpdate) this.onExpressionUpdate(exp);
      };
      this.faceAnalyzer.onCheatDetected = (msg) => {
        if (this.onCheatWarning) this.onCheatWarning(msg);
      };
      this.faceAnalyzer.onMetricsUpdate = (metrics) => {
        if (this.onMetricsUpdate) this.onMetricsUpdate(metrics);
      };

      // Setup speech engine
      this.speechEngine.onTranscript = (text) => {
        if (this.onTranscriptUpdate) this.onTranscriptUpdate(text);
      };
      this.speechEngine.onInterim = (text) => {
        if (this.onInterimUpdate) this.onInterimUpdate(text);
      };
      this.speechEngine.onVolumeChange = (vol) => {
        if (this.onVolumeChange) this.onVolumeChange(vol);
      };

      // Start webcam
      await this.faceAnalyzer.start(videoEl, canvasEl);

      // Notify UI of first question
      if (this.onQuestionChange) {
        this.onQuestionChange(this.currentQuestion, this.currentQuestionNumber, this.totalQuestions);
      }

      return data;
    } catch (error) {
      console.error('Interview initialization failed:', error);
      if (this.onError) this.onError(error.message);
      throw error;
    }
  }

  /**
   * Start recording user's answer
   */
  startRecording() {
    if (this.isRecording) return;
    this.isRecording = true;
    this.faceAnalyzer.resetForQuestion();
    this.speechEngine.start();
  }

  /**
   * Stop recording and submit answer for evaluation
   */
  async stopRecording() {
    this.isRecording = false;

    // Get speech result
    const speechResult = this.speechEngine.stop() || { transcript: '', duration: 0 };

    // Get face data
    const faceData = this.faceAnalyzer.getExpressionData();

    // Submit to server for evaluation (send session state instead of just sessionId)
    try {
      const response = await fetch('/api/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionState: this.sessionState,
          answer: speechResult.transcript,
          faceData,
          speechDuration: speechResult.duration
        })
      });

      if (!response.ok) throw new Error('Failed to submit answer');

      const result = await response.json();

      // Update client-held session state with server's response
      if (result.sessionState) {
        this.sessionState = result.sessionState;
      }

      // Store result
      this.questionResults.push({
        question: this.currentQuestion,
        answer: speechResult.transcript,
        speechMetrics: speechResult,
        evaluation: result.evaluation,
        behavioralScore: result.behavioralScore,
        communicationScore: result.communicationScore,
        feedback: result.feedback
      });

      // No evaluation overlay! Silent evaluation in the background.

      // If interview is complete
      if (result.isComplete) {
        return result;
      }

      // Store next question
      if (result.nextQuestion) {
        this.currentQuestion = result.nextQuestion;
        this.currentQuestionNumber = result.currentQuestion;
      }

      return result;
    } catch (error) {
      console.error('Answer submission failed:', error);
      if (this.onError) this.onError(error.message);
      throw error;
    }
  }

  /**
   * Skip current question by sending empty answer
   */
  async skipQuestion() {
    this.isRecording = false;
    this.speechEngine.stop(); // Stop if it was running

    try {
      const response = await fetch('/api/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionState: this.sessionState,
          answer: '', // Empty answer for skipped
          faceData: this.faceAnalyzer.getExpressionData() || {},
          speechDuration: 0
        })
      });

      if (!response.ok) throw new Error('Failed to skip question');

      const result = await response.json();

      if (result.sessionState) {
        this.sessionState = result.sessionState;
      }

      this.questionResults.push({
        question: this.currentQuestion,
        answer: '',
        speechMetrics: { duration: 0 },
        evaluation: result.evaluation,
        behavioralScore: result.behavioralScore,
        communicationScore: result.communicationScore,
        feedback: result.feedback,
        skipped: true
      });

      // Do NOT trigger onEvaluationReady so the overlay doesn't annoy the user
      // Just update state and return
      
      if (result.isComplete) {
        return result;
      }

      if (result.nextQuestion) {
        this.currentQuestion = result.nextQuestion;
        this.currentQuestionNumber = result.currentQuestion;
      }

      return result;
    } catch (error) {
      console.error('Skipping failed:', error);
      if (this.onError) this.onError(error.message);
      throw error;
    }
  }

  /**
   * Move to next question (called after user reviews evaluation)
   */
  nextQuestion() {
    if (this.onQuestionChange) {
      this.onQuestionChange(this.currentQuestion, this.currentQuestionNumber, this.totalQuestions);
    }
    this.faceAnalyzer.resetForQuestion();
  }

  /**
   * End the interview and get full report
   */
  async endInterview() {
    try {
      const response = await fetch('/api/interview/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionState: this.sessionState })
      });

      if (!response.ok) throw new Error('Failed to end interview');

      const report = await response.json();

      // Stop everything
      this.faceAnalyzer.stop();
      this.speechEngine.destroy();

      if (this.onInterviewComplete) {
        this.onInterviewComplete(report);
      }

      return report;
    } catch (error) {
      console.error('Failed to end interview:', error);
      if (this.onError) this.onError(error.message);
      throw error;
    }
  }

  /**
   * Get elapsed time in seconds
   */
  getElapsedTime() {
    if (!this.startTime) return 0;
    return Math.round((Date.now() - this.startTime) / 1000);
  }

  /**
   * Cleanup
   */
  destroy() {
    this.faceAnalyzer.stop();
    this.speechEngine.destroy();
    this.isRecording = false;
  }
}

export default InterviewFlow;
