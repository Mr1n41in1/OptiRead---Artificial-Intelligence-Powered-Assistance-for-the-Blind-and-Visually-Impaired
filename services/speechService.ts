// A cache for the synthesis voices to avoid repeated lookups.
let voices: SpeechSynthesisVoice[] = [];
// A promise to ensure we don't try to load voices multiple times simultaneously.
let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

/**
 * Asynchronously loads and caches the list of available speech synthesis voices from the browser.
 * This handles the case where voices are not immediately available on page load.
 * @returns {Promise<SpeechSynthesisVoice[]>} A promise that resolves with the array of voices.
 */
const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
    if (voices.length > 0) {
        return Promise.resolve(voices);
    }
    if (voicesPromise) {
        return voicesPromise;
    }

    voicesPromise = new Promise((resolve) => {
        const allVoices = window.speechSynthesis.getVoices();
        if (allVoices.length > 0) {
            voices = allVoices;
            resolve(voices);
            return;
        }
        window.speechSynthesis.onvoiceschanged = () => {
            voices = window.speechSynthesis.getVoices();
            resolve(voices);
        };
    });
    return voicesPromise;
};

// Pre-warm the voices cache when the module loads for faster first-time use.
if (typeof window !== 'undefined' && window.speechSynthesis) {
    loadVoices();
}

/**
 * Checks if a voice is available for the given language code.
 * @param {string} lang - The BCP 47 language code (e.g., 'en-US', 'hi-IN').
 * @returns {Promise<boolean>} A promise that resolves to true if a voice is found, false otherwise.
 */
export const isVoiceAvailableForLang = async (lang: string): Promise<boolean> => {
    const availableVoices = await loadVoices();
    const langPrefix = lang.split('-')[0];

    return availableVoices.some(voice => 
        voice.lang === lang || voice.lang.startsWith(langPrefix)
    );
};

export const speak = async (text: string, lang: string, rate: number): Promise<void> => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.error('Speech Synthesis not supported.');
    throw new Error('Speech Synthesis not supported.');
  }
  
  // Ensure voices are loaded before proceeding.
  const availableVoices = await loadVoices();

  return new Promise((resolve, reject) => {
    // This function contains the core logic for creating and speaking an utterance.
    const doSpeak = () => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = rate;

        // Find a voice that matches the language.
        // 1. Try for an exact match (e.g., 'hi-IN')
        let selectedVoice = availableVoices.find(voice => voice.lang === lang);
        
        // 2. If no exact match, try matching just the primary language part (e.g., 'hi')
        if (!selectedVoice) {
            const langPrefix = lang.split('-')[0];
            selectedVoice = availableVoices.find(voice => voice.lang.startsWith(langPrefix));
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        } else {
          console.warn(`No voice found for language ${lang}. Using browser default.`);
        }

        utterance.onend = () => {
          resolve();
        };

        utterance.onerror = (event) => {
          const error = (event as SpeechSynthesisErrorEvent).error;
          // 'canceled' and 'interrupted' are expected when we intentionally stop speech.
          if (error === 'canceled' || error === 'interrupted') {
            console.log(`Speech was ${error} as requested.`);
            resolve(); // This is a successful outcome of an intentional action.
            return;
          }
          
          const errorMessage = error || 'Unknown speech error';
          console.error('SpeechSynthesisUtterance.onerror:', errorMessage);
          reject(errorMessage);
        };

        window.speechSynthesis.speak(utterance);
    };

    // The Web Speech API can be buggy. A common pattern to avoid issues
    // is to cancel any ongoing speech, and then use a short timeout
    // to ensure the cancellation has been processed before starting new speech.
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        // Wait for the cancellation to take effect before speaking.
        setTimeout(doSpeak, 100); 
    } else {
        doSpeak();
    }
  });
};

export const startRecognition = (lang: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        // Fix: Cast window to 'any' to access browser-specific SpeechRecognition APIs.
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            return reject('Speech Recognition API not supported in this browser.');
        }

        const recognition = new SpeechRecognition();
        recognition.lang = lang;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.start();

        recognition.onresult = (event) => {
            const speechResult = event.results[0][0].transcript;
            resolve(speechResult);
        };

        recognition.onspeechend = () => {
            recognition.stop();
        };

        recognition.onerror = (event) => {
            const error = (event as any).error || 'Unknown recognition error';
            reject(error);
        };
    });
};

export const cancelSpeech = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
};