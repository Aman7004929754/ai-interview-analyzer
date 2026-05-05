/**
 * Speech Recognition Engine
 * Wraps the Web Speech API for real-time speech-to-text
 * Runs 100% client-side — zero API calls
 */

class SpeechEngine {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.transcript = '';
    this.interimTranscript = '';
    this.startTime = null;
    this.wordCount = 0;

    // Speech metrics
    this.fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'so', 'well', 'right', 'okay', 'hmm', 'er', 'ah'];
    this.fillerCount = 0;

    // Callbacks
    this.onTranscript = null;
    this.onInterim = null;
    this.onEnd = null;
    this.onError = null;
    this.onVolumeChange = null;

    this._init();
  }

  _init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('Speech Recognition not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 3; // Increased to be more sensitive to different interpretations

    // Audio Context for volume sensitivity tracking
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.volumeCallback = null;
    this.audioStream = null;

    this.recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        this.transcript += final;
        this._countFillers(final);
        if (this.onTranscript) {
          this.onTranscript(this.transcript.trim());
        }
      }

      this.interimTranscript = interim;
      if (this.onInterim) {
        this.onInterim(interim);
      }
    };

    this.recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        // Restart if no speech detected
        if (this.isListening) {
          this._restart();
        }
      } else if (this.onError) {
        this.onError(event.error);
      }
    };

    this.recognition.onend = () => {
      // Auto-restart if still supposed to be listening
      if (this.isListening) {
        this._restart();
      }
    };
  }

  _restart() {
    try {
      setTimeout(() => {
        if (this.isListening && this.recognition) {
          this.recognition.start();
        }
      }, 100);
    } catch (e) {
      // Ignore restart errors
    }
  }

  _countFillers(text) {
    const lower = text.toLowerCase();
    this.fillerWords.forEach(filler => {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      const matches = lower.match(regex);
      if (matches) {
        this.fillerCount += matches.length;
      }
    });
  }

  /**
   * Check if speech recognition is supported
   */
  isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Start listening
   */
  async start() {
    if (!this.recognition) {
      throw new Error('Speech Recognition not supported');
    }

    this.transcript = '';
    this.interimTranscript = '';
    this.fillerCount = 0;
    this.startTime = Date.now();
    this.isListening = true;

    // Start audio volume tracking
    try {
      this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.microphone = this.audioContext.createMediaStreamSource(this.audioStream);
      this.microphone.connect(this.analyser);
      this.analyser.fftSize = 256;
      
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateVolume = () => {
        if (!this.isListening) return;
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for(let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const volume = sum / bufferLength;
        if (this.onVolumeChange) {
          // Normalize volume to 0-100 to make it super sensitive
          this.onVolumeChange(Math.min(100, volume * 1.5));
        }
        requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch(e) {
      console.warn("Could not start volume tracker", e);
    }

    try {
      this.recognition.start();
    } catch (e) {
      // Already started, restart
      this.recognition.stop();
      setTimeout(() => this.recognition.start(), 100);
    }

    return true;
  }

  /**
   * Stop listening and return results
   */
  stop() {
    this.isListening = false;

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignore
      }
    }
    
    // Stop audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
    }

    const duration = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;
    const words = this.transcript.trim().split(/\s+/).filter(w => w.length > 0);

    const result = {
      transcript: this.transcript.trim(),
      duration: Math.round(duration),
      wordCount: words.length,
      wpm: duration > 0 ? Math.round((words.length / duration) * 60) : 0,
      fillerCount: this.fillerCount
    };

    if (this.onEnd) {
      this.onEnd(result);
    }

    return result;
  }

  /**
   * Get current transcript
   */
  getCurrentTranscript() {
    return this.transcript.trim();
  }

  /**
   * Get current speech metrics
   */
  getMetrics() {
    const duration = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;
    const words = this.transcript.trim().split(/\s+/).filter(w => w.length > 0);

    return {
      wordCount: words.length,
      duration: Math.round(duration),
      wpm: duration > 0 ? Math.round((words.length / duration) * 60) : 0,
      fillerCount: this.fillerCount
    };
  }

  /**
   * Destroy
   */
  destroy() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.recognition = null;
    }
  }
}

export default SpeechEngine;
