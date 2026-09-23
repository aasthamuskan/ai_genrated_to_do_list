require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── AI Task Generator (Groq API) ─────────────────────────────────────────────
app.post('/api/generate-tasks', async (req, res) => {
  const { goal } = req.body;

  if (!goal || goal.trim().length < 5)
    return res.status(400).json({ error: 'Please describe your goal in more detail.' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey)
    return res.status(500).json({ error: 'GROQ_API_KEY is not set in .env file.' });

  const systemPrompt = `You are a productivity expert. When given a goal, you break it down into 4-6 specific, actionable tasks.
You ALWAYS respond with ONLY a valid JSON array — no markdown, no explanation, no extra text.`;

  const userPrompt = `Break this goal into 4-6 actionable tasks: "${goal.trim()}"

Return ONLY this JSON array:
[
  {
    "title": "Short action-oriented title",
    "description": "Exactly what to do (1-2 sentences)",
    "priority": "high",
    "daysUntilDue": 3
  }
]

Rules: priority = high/medium/low only, daysUntilDue = 1-21, valid JSON array only.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   }
        ],
        temperature: 0.6,
        max_tokens: 1024,
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = data?.error?.message || 'Groq API request failed';
      console.error('Groq error:', msg);
      return res.status(502).json({ error: msg });
    }

    const raw = data?.choices?.[0]?.message?.content || '';
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    let tasks;
    try { tasks = JSON.parse(cleaned); }
    catch {
      console.error('Parse fail. Raw output:', raw);
      return res.status(500).json({ error: 'AI returned unexpected format. Please try again.' });
    }

    const base = new Date();
    const enriched = tasks.map(t => {
      const due = new Date(base);
      due.setDate(due.getDate() + Math.max(1, parseInt(t.daysUntilDue) || 7));
      return {
        title:       String(t.title || 'Untitled task'),
        description: String(t.description || ''),
        priority:    ['high','medium','low'].includes(t.priority) ? t.priority : 'medium',
        dueDate:     due.toISOString().split('T')[0],
      };
    });

    res.json({ tasks: enriched });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
});

// ── Serve frontend ──────────────────────────────────────────────────────────
app.get('/{*splat}', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
);

app.listen(PORT, () => {
  console.log(`\n  Smart Todo   ->  http://localhost:${PORT}`);
  console.log(`  Groq API     ->  ${process.env.GROQ_API_KEY ? 'Key loaded OK' : 'GROQ_API_KEY missing!'}\n`);
});
