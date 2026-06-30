// api/test-notify.js
// Sends an immediate test notification via ntfy.sh (server-side, no CORS)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ error: 'Missing topic' });

    const appUrl = process.env.APP_URL || 'https://your-app.vercel.app';

    const resp = await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
      method: 'POST',
      headers: {
        'Title': 'JS Daily Quiz - Test',
        'Priority': 'high',
        'Tags': 'tada,sparkles',
        'Click': appUrl,
        'Content-Type': 'text/plain'
      },
      body: 'Test notification is working! You will be reminded daily at your set time.'
    });

    if (resp.ok) {
      return res.status(200).json({ ok: true });
    } else {
      const text = await resp.text();
      return res.status(resp.status).json({ error: text });
    }
  } catch (err) {
    console.error('Test notify error:', err);
    return res.status(500).json({ error: err.message });
  }
}
