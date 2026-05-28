export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, language } = req.body;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: `Sei KnitTranslate AI, uno strumento specializzato nella traduzione di pattern e schemi tecnici di maglia. Sei stato calibrato da una traduttrice professionista madrelingua italiana. Rispondi SOLO con la traduzione, senza spiegazioni.`,
      messages: [{ role: 'user', content: `Traduci questo pattern di maglia in ${language}. Il testo sorgente è in inglese.\n\n${text}` }],
    }),
  });

  const data = await response.json();
  const result = data.content?.map(b => b.text || '').join('') || '';
  res.status(200).json({ translation: result });
}
