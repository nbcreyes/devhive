const PISTON_API = 'https://emkc.org/api/v2/piston';

const LANGUAGE_MAP = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  cpp: 'c++',
  c: 'c',
  csharp: 'csharp',
  go: 'go',
  rust: 'rust',
  php: 'php',
  ruby: 'ruby',
  swift: 'swift',
  kotlin: 'kotlin',
  bash: 'bash',
};

// Cache runtimes so we don't fetch on every request
let runtimesCache = null;

async function getRuntimes() {
  if (runtimesCache) return runtimesCache;
  const res = await fetch(`${PISTON_API}/runtimes`);
  runtimesCache = await res.json();
  return runtimesCache;
}

async function getVersion(pistonLanguage) {
  const runtimes = await getRuntimes();
  const match = runtimes.find((r) => r.language === pistonLanguage);
  return match?.version || '*';
}

export async function executeCode(req, res) {
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: 'code and language are required' });
  }

  const pistonLanguage = LANGUAGE_MAP[language];
  if (!pistonLanguage) {
    return res.status(400).json({ error: `Unsupported language: ${language}` });
  }

  try {
    const version = await getVersion(pistonLanguage);

    const response = await fetch(`${PISTON_API}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: pistonLanguage,
        version,
        files: [{ content: code }],
        stdin: '',
        args: [],
        run_timeout: 10000,
      }),
    });

    const data = await response.json();
    console.log('[executeCode] piston response:', JSON.stringify(data));

    return res.json({
      output: data.run?.output || '',
      stderr: data.run?.stderr || '',
      exitCode: data.run?.code ?? 0,
    });
  } catch (err) {
    console.error('[executeCode] error:', err.message);
    return res.status(500).json({ error: 'Failed to execute code' });
  }
}