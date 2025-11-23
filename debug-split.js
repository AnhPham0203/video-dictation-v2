const text = "Hello, everybody. Today, we will practice English by talking about daily routines. Listen carefully, repeat after me, and try to understand each sentence. Let's begin. Every day starts with waking up. I wake up at 7 a.m.";

function splitSentences(text) {
  if (!text) return [];

  // Use Intl.Segmenter if available (Node 16+)
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    console.log("Using Intl.Segmenter");
    const segmenter = new Intl.Segmenter("en", { granularity: "sentence" });
    const segments = segmenter.segment(text);
    const sentences = [];
    for (const { segment } of segments) {
      const trimmed = segment.trim();
      if (trimmed.length > 0) {
        sentences.push(trimmed);
      }
    }
    return sentences;
  }

  console.log("Using Fallback Regex");
  // Fallback for older environments: Split by newlines and then simple regex
  const lines = text.split(/\r\n|\n|\r/);
  const allSentences = [];

  for (const line of lines) {
    const cleanedLine = line.trim();
    if (cleanedLine.length === 0) continue;
    
    // Match sentence ending punctuation . ! ?
    const matches = cleanedLine.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
    if (matches && matches.length > 0) {
      matches.forEach(s => {
        const trimmed = s.trim();
        if (trimmed.length > 0) allSentences.push(trimmed);
      });
    } else {
      allSentences.push(cleanedLine);
    }
  }
  return allSentences;
}

const result = splitSentences(text);
console.log("Resulting sentences:", result);
console.log("Count:", result.length);
