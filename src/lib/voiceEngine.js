export class VoiceEngine {
  constructor(onResult, onStatusChange) {
    this.onResult = onResult;
    this.onStatusChange = onStatusChange; // 'idle' | 'listening' | 'speaking'
    this.recognition = null;
    this.synth = window.speechSynthesis;
    this.isListening = false;
    
    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US'; // Default, can be updated

      this.recognition.onstart = () => {
        this.isListening = true;
        this.onStatusChange('listening');
      };

      this.recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript || interimTranscript) {
          this.onResult({ final: finalTranscript, interim: interimTranscript });
        }
      };

      this.recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        this.stopListening();
      };

      this.recognition.onend = () => {
        // If we are still supposed to be listening, restart it
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch (e) {
            this.isListening = false;
            this.onStatusChange('idle');
          }
        } else {
          this.onStatusChange('idle');
        }
      };
    } else {
      console.warn('Speech Recognition API not supported in this browser.');
    }
  }

  setLanguage(langCode) {
    if (this.recognition) {
      // Map app lang 'zh' to standard locales
      this.recognition.lang = langCode === 'zh' ? 'zh-CN' : 'en-US';
    }
  }

  startListening() {
    if (this.recognition && !this.isListening) {
      this.stopSpeaking();
      try {
        this.recognition.start();
      } catch(e) {
        console.error('Failed to start recognition', e);
      }
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.recognition.stop();
      this.onStatusChange('idle');
    }
  }

  toggleListening() {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  speak(text, langCode = 'en') {
    if (!this.synth) return;
    
    // Stop any ongoing speech
    this.stopSpeaking();
    
    // Stop listening while speaking to prevent feedback loops
    const wasListening = this.isListening;
    if (wasListening) this.stopListening();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode === 'zh' ? 'zh-CN' : 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Try to find a good voice
    const voices = this.synth.getVoices();
    const preferredVoices = voices.filter(v => v.lang.startsWith(utterance.lang));
    if (preferredVoices.length > 0) {
      // Prefer Google or natural sounding voices
      const naturalVoice = preferredVoices.find(v => v.name.includes('Google') || v.name.includes('Natural'));
      utterance.voice = naturalVoice || preferredVoices[0];
    }

    utterance.onstart = () => {
      this.onStatusChange('speaking');
    };

    utterance.onend = () => {
      this.onStatusChange('idle');
      // Resume listening if it was active before
      if (wasListening) {
        this.startListening();
      }
    };

    utterance.onerror = () => {
      this.onStatusChange('idle');
      if (wasListening) this.startListening();
    };

    this.synth.speak(utterance);
  }

  stopSpeaking() {
    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
    }
  }
}
