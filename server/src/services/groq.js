import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Summarizes a list of chat messages using the Groq API.
 * Uses llama-3.3-70b-versatile which is fast and free on Groq's free tier.
 *
 * @param {Array<{ author: string, content: string, createdAt: string }>} messages
 * @returns {Promise<string>} AI-generated summary
 */
export async function summarizeMessages(messages) {
  const formatted = messages
    .map((m) => `[${m.author}]: ${m.content}`)
    .join('\n');

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful assistant for a developer team chat platform called DevHive. Summarize conversations concisely, focusing on key decisions, problems, solutions, and action items. Keep summaries under 200 words and use bullet points.',
      },
      {
        role: 'user',
        content: `Summarize this conversation:\n\n${formatted}`,
      },
    ],
    max_tokens: 512,
  });

  return completion.choices[0].message.content;
}