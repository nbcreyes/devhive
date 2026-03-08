export async function executeCode(req, res) {
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: 'code and language are required' });
  }

  // For now return a placeholder for non-JS languages
  // Piston will be configured on the production Linux server
  if (language !== 'javascript') {
    return res.json({
      output: '',
      stderr: `Server-side execution for ${language} will be available in production.`,
      exitCode: 0,
      clientSide: false,
    });
  }

  // For JS, tell the client to handle it
  return res.json({
    output: '',
    stderr: '',
    exitCode: 0,
    clientSide: true,
  });
}