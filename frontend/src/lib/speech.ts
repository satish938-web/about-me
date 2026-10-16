type SpeakOptions = {
  rate?: number;
  pitch?: number;
  male?: boolean;
  onstart?: () => void;
  onend?: () => void;
  onerror?: (error: string) => void;
};

function scoreVoice(voice: SpeechSynthesisVoice, male: boolean) {
  const label = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();
  let value = 0;
  if (lang.startsWith("en-in")) value += 6;
  else if (lang.startsWith("en-gb")) value += 3;
  else if (lang.startsWith("en")) value += 1;
  if (male) {
    if (/male|david|daniel|ravi|prabhat|george|mark|brian|alex/.test(label)) value += 5;
    if (/female|zira|samantha|heera|veena|susan|victoria/.test(label)) value -= 8;
  }
  return value;
}

function pickVoice(male: boolean) {
  const voices = window.speechSynthesis.getVoices();
  return voices.slice().sort((a, b) => scoreVoice(b, male) - scoreVoice(a, male))[0] ?? null;
}

export function canSpeak() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function stopSpeaking() {
  window.speechSynthesis?.cancel();
}

export function speakText(text: string, options: SpeakOptions = {}) {
  if (!canSpeak()) {
    options.onerror?.("unsupported");
    return;
  }

  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-IN";
  utterance.rate = options.rate ?? 0.96;
  utterance.pitch = options.pitch ?? 0.9;
  const voice = pickVoice(options.male ?? true);
  if (voice) utterance.voice = voice;

  let keepAlive = 0;
  const stopKeep = () => window.clearInterval(keepAlive);

  utterance.onstart = () => {
    options.onstart?.();
    keepAlive = window.setInterval(() => {
      if (synth.speaking) synth.resume();
    }, 8000);
  };
  utterance.onend = () => {
    stopKeep();
    options.onend?.();
  };
  utterance.onerror = (event) => {
    stopKeep();
    options.onerror?.(event.error);
  };

  const start = () => {
    synth.speak(utterance);
    synth.resume();
  };

  if (synth.speaking || synth.pending) {
    synth.cancel();
    window.setTimeout(start, 60);
    return;
  }

  start();
}
