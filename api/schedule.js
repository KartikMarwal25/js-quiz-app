// api/schedule.js
// Called from frontend when user sets daily alarm time
// Saves { topic, hour, minute } to Vercel KV so the cron can read it

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { topic, hour, minute, streak } = req.body;

    if (!topic || hour === undefined || minute === undefined) {
      return res.status(400).json({ error: 'Missing topic, hour, or minute' });
    }

    if (typeof hour !== 'number' || hour < 0 || hour > 23) {
      return res.status(400).json({ error: 'Invalid hour (0-23)' });
    }
    if (typeof minute !== 'number' || minute < 0 || minute > 59) {
      return res.status(400).json({ error: 'Invalid minute (0-59)' });
    }

    // Store in KV — key per topic so multiple users work fine
    const { kv } = await import('@vercel/kv');
    await kv.set(`alarm:${topic}`, {
      topic,
      hour,
      minute,
      streak: streak || 0,
      createdAt: new Date().toISOString()
    });

    console.log(`Alarm saved: topic=${topic} at ${hour}:${String(minute).padStart(2,'0')}`);
    return res.status(200).json({ ok: true, message: `Alarm set for ${hour}:${String(minute).padStart(2,'0')} daily` });

  } catch (err) {
    console.error('Schedule error:', err);
    return res.status(500).json({ error: err.message });
  }
}
