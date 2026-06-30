// api/cron.js
// Vercel cron runs this every minute (see vercel.json)
// Checks all saved alarms — if it's time for any, fires ntfy.sh notification

export default async function handler(req, res) {
  // Vercel cron calls with Authorization header containing CRON_SECRET
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { kv } = await import('@vercel/kv');

    // Get current UTC time — ntfy.sh works in UTC
    // We store alarm times in IST (UTC+5:30), so convert current UTC → IST
    const nowUTC = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST = UTC + 5:30
    const nowIST = new Date(nowUTC.getTime() + istOffset);

    const currentHour = nowIST.getUTCHours();
    const currentMinute = nowIST.getUTCMinutes();

    console.log(`Cron running at IST ${currentHour}:${String(currentMinute).padStart(2,'0')}`);

    // Scan all alarm keys
    const keys = await kv.keys('alarm:*');
    if (!keys.length) {
      return res.status(200).json({ ok: true, message: 'No alarms set' });
    }

    const fired = [];
    const skipped = [];

    for (const key of keys) {
      const alarm = await kv.get(key);
      if (!alarm) continue;

      const { topic, hour, minute, streak } = alarm;

      // Fire if current IST time matches alarm time (within same minute)
      if (currentHour === hour && currentMinute === minute) {
        const success = await fireNtfy(topic, streak || 0);
        if (success) {
          fired.push(topic);
          // Update streak count stored in alarm
          await kv.set(key, { ...alarm, streak: (streak || 0) + 1 });
        }
      } else {
        skipped.push(`${topic} (set for ${hour}:${String(minute).padStart(2,'0')})`);
      }
    }

    console.log(`Fired: ${fired.length}, Skipped: ${skipped.length}`);
    return res.status(200).json({ ok: true, fired, skipped });

  } catch (err) {
    console.error('Cron error:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function fireNtfy(topic, streak) {
  try {
    const message = `Time for your daily JS quiz! Keep your ${streak} day streak going.`;
    const appUrl = process.env.APP_URL || 'https://your-app.vercel.app';

    // Server-side fetch to ntfy.sh — no CORS, no browser restrictions
    const url = `https://ntfy.sh/${encodeURIComponent(topic)}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Title': 'JS Daily Quiz',
        'Priority': 'high',
        'Tags': 'brain,books',
        'Click': appUrl,
        'Content-Type': 'text/plain'
      },
      body: message
    });

    if (resp.ok) {
      console.log(`Notification fired for topic: ${topic}`);
      return true;
    } else {
      console.error(`ntfy failed for ${topic}: ${resp.status} ${resp.statusText}`);
      return false;
    }
  } catch (err) {
    console.error(`ntfy error for ${topic}:`, err);
    return false;
  }
}
