export function matchingLocalVoices<T extends { lang: string; localService: boolean }>(voices: T[], language: string, allowOnline = false): T[] {
  const original = language.toLowerCase().replace(/_/g, "-").split("-")[0];
  const primary = original === "hbo" ? "he" : original === "grc" ? "el" : original;
  return voices.filter((voice) => (voice.localService || allowOnline) && voice.lang.toLowerCase().replace(/_/g, "-").split("-")[0] === primary);
}

export const narrationStyles = {
  calm: { rate: 0.9, pitch: 0.95 },
  natural: { rate: 1, pitch: 1 },
} as const;

/** Prefer explicitly named enhanced voices when installed; keep all options available. */
export function preferredVoice<T extends { name: string; default: boolean }>(voices: T[]): T | undefined {
  return voices.find((voice) => /natural|neural|enhanced|premium/i.test(voice.name))
    ?? voices.find((voice) => voice.default)
    ?? voices[0];
}

/** Short utterances avoid engine length limits while retaining every word. */
export function speechChunks(text: string, maximum = 220): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  for (const word of words) {
    if (word.length > maximum) {
      if (current) { chunks.push(current); current = ""; }
      const characters = Array.from(word);
      for (let index = 0; index < characters.length; index += maximum) chunks.push(characters.slice(index, index + maximum).join(""));
      continue;
    }
    if (current && current.length + word.length + 1 > maximum) { chunks.push(current); current = ""; }
    current = current ? `${current} ${word}` : word;
  }
  if (current) chunks.push(current);
  return chunks;
}
