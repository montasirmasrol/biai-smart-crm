const BANGLA_CHAR_PATTERN = /[\u0980-\u09FF]/
const BANGLISH_PATTERNS = [
  /\bami\b/i,
  /\bamra\b/i,
  /\bamar\b/i,
  /\bamader\b/i,
  /\bapni\b/i,
  /\bapnar\b/i,
  /\bapnader\b/i,
  /\bkor(?:bo|ben|chi|te)\b/i,
  /\bchai\b/i,
  /\bach(?:e|he)\b/i,
  /\base\b/i,
  /\bk(?:i|eno|obe|othay|ibhabe|ivabe)\b/i,
  /\bkoto\b/i,
  /\blagbe\b/i,
  /\bhobe\b/i,
  /\bhoy\b/i,
  /\b(?:den|diben|bolben|janaben)\b/i,
  /\ber\b/i,
  /\btumi\b/i,
  /\btomar\b/i,
  /\btomake\b/i,
  /\bkorte\b/i,
  /\bparbo\b/i,
  /\bpabo\b/i,
  /\bvalo\b/i,
  /\bdorkar\b/i,
  /\bki\s+rokom\b/i,
]

export function detectCustomerLanguage(text = "") {
  const normalized = String(text ?? "").trim()

  if (!normalized) {
    return "English"
  }

  if (BANGLA_CHAR_PATTERN.test(normalized)) {
    return "Bangla"
  }

  if (BANGLISH_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return "Banglish"
  }

  return "English"
}

export function getReplyLanguageInstruction(language) {
  switch (language) {
    case "Bangla":
      return "Write in natural Bengali and use Bengali script."
    case "Banglish":
      return "Write in natural Banglish (Romanized Bengali) using Latin/Roman letters only. Do not write Bengali script."
    default:
      return "Write in natural English using Latin letters."
  }
}
