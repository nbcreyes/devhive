/**
 * A map of common file extensions and keywords to language names.
 * Used to auto-detect the language of a code block when none is specified.
 */
const LANGUAGE_PATTERNS = {
  javascript: [/\bconst\b/, /\blet\b/, /\bvar\b/, /=>/, /\bconsole\.log\b/, /\brequire\b/, /\bimport\b.*\bfrom\b/],
  typescript: [/\binterface\b/, /\btype\b.*=/, /:\s*(string|number|boolean|void)\b/, /\benum\b/],
  python: [/\bdef\b/, /\bimport\b/, /\bprint\(/, /\bclass\b.*:/, /\belif\b/, /\bNone\b/],
  java: [/\bpublic\b.*\bclass\b/, /\bSystem\.out\.println\b/, /\bvoid\b/, /\bnew\b.*\(\)/],
  cpp: [/#include/, /\bstd::/, /\bcout\b/, /\bint\s+main\b/],
  c: [/#include\s*</, /\bprintf\b/, /\bint\s+main\b/, /\bvoid\s+\w+\s*\(/],
  rust: [/\bfn\b/, /\blet\s+mut\b/, /\bimpl\b/, /\bpub\b/, /\bmatch\b/],
  go: [/\bfunc\b/, /\bpackage\b/, /\bfmt\./, /\bvar\b.*:=/, /:=/],
  css: [/[.#][\w-]+\s*\{/, /\bmargin\b.*:/, /\bpadding\b.*:/, /\bcolor\b.*:/],
  html: [/<html/, /<div/, /<body/, /<head/, /<script/],
  sql: [/\bSELECT\b/i, /\bFROM\b/i, /\bWHERE\b/i, /\bINSERT\b/i, /\bCREATE\s+TABLE\b/i],
  bash: [/\becho\b/, /\bsudo\b/, /\bapt\b/, /\bchmod\b/, /^\s*#!/],
  json: [/^\s*[\[{]/, /"[\w]+":\s*["{[\d]/],
  yaml: [/^\w+:\s*$/, /^\s+-\s+\w+/, /^---/],
};

/**
 * Attempts to detect the programming language of a code string.
 * Returns 'plaintext' if no language can be determined.
 *
 * @param {string} code - The code string to analyze
 * @returns {string} Detected language name
 */
export function detectLanguage(code) {
  const scores = {};

  for (const [language, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
    scores[language] = 0;
    for (const pattern of patterns) {
      if (pattern.test(code)) {
        scores[language]++;
      }
    }
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];

  if (best && best[1] > 0) {
    return best[0];
  }

  return 'plaintext';
}

/**
 * Checks whether a message string contains a markdown-style code block.
 * Matches triple backtick blocks with an optional language hint.
 *
 * @param {string} content - The message content to check
 * @returns {{ isCode: boolean, language: string, code: string }}
 */
export function parseCodeBlock(content) {
  const codeBlockRegex = /^```(\w+)?\n([\s\S]*?)```$/;
  const match = content.trim().match(codeBlockRegex);

  if (!match) {
    return { isCode: false, language: null, code: null };
  }

  const language = match[1] || detectLanguage(match[2]);
  return { isCode: true, language, code: match[2] };
}