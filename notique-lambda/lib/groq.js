const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function invokeModel(systemPrompt, userMessage) {
  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userMessage  }
    ],
    max_tokens: 1024,
  });
  return res.choices[0].message.content;
}

module.exports = { invokeModel };