import { speak, cancelSpeech } from './speechService';

/**
 * Manages streaming text and synthesizes it to speech sentence by sentence.
 */
class StreamingTextToSpeech {
    private textBuffer = '';
    private sentenceQueue: string[] = [];
    private isSpeaking = false;
    private isCancelled = false;
    private isFlushed = false;
    private lang: string;
    private rate: number;
    private onDoneCallback: () => void;

    constructor(lang: string, rate: number, onDone: () => void) {
        this.lang = lang;
        this.rate = rate;
        this.onDoneCallback = onDone;
    }

    /**
     * Adds a chunk of text to the buffer and processes it into sentences for speech.
     * @param {string} chunk - The text chunk from the stream.
     */
    public addChunk(chunk: string): void {
        if (this.isCancelled) return;

        this.textBuffer += chunk;
        // Regex to split on sentences ending with ., ?, or ! followed by a space.
        const sentenceEndRegex = /(?<=[.?!])\s+/;
        const parts = this.textBuffer.split(sentenceEndRegex);

        if (parts.length > 1) {
            const completeSentences = parts.slice(0, -1).filter(s => s.trim().length > 0);
            this.textBuffer = parts[parts.length - 1] || '';
            this.sentenceQueue.push(...completeSentences);
            
            if (!this.isSpeaking) {
                this.speakNext();
            }
        }
    }

    /**
     * Signals that the stream is complete. Any remaining text in the buffer will be spoken.
     * After the final sentence is spoken, the onDone callback will be triggered.
     */
    public flush(): void {
        if (this.isCancelled) return;
        this.isFlushed = true;

        const remainingText = this.textBuffer.trim();
        if (remainingText) {
            this.sentenceQueue.push(remainingText);
            this.textBuffer = '';
            if (!this.isSpeaking) {
                this.speakNext();
            }
        } else if (!this.isSpeaking && this.sentenceQueue.length === 0) {
            // If flush is called and there's nothing to speak, we're done.
            this.onDoneCallback();
        }
    }

    /**
     * Cancels all ongoing and pending speech.
     */
    public cancel(): void {
        this.isCancelled = true;
        this.sentenceQueue = [];
        this.textBuffer = '';
        cancelSpeech();
    }
    
    private async speakNext(): Promise<void> {
        if (this.isCancelled) return;

        if (this.sentenceQueue.length === 0) {
            this.isSpeaking = false;
            // If the queue is empty AND the stream has been flushed, we're done.
            if (this.isFlushed) {
                this.onDoneCallback();
            }
            return;
        }

        this.isSpeaking = true;
        const sentence = this.sentenceQueue.shift();

        if (sentence) {
            try {
                await speak(sentence, this.lang, this.rate);
            } catch (error) {
                console.error("Speech error in streaming:", error);
            }
        }
        
        // After speaking, immediately try to speak the next item in the queue.
        this.speakNext();
    }
}

export default StreamingTextToSpeech;