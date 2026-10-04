// api/get-targets.js
// This runs on Vercel's servers, NOT in the browser.
// The service key is safe here.

const SUPABASE_URL = 'https://gtxysgqfuepywqwyciii.supabase.co';
// This is pulled from Vercel's environment variables (see step 3)
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  // 1. Basic protection - you don't want just anyone hitting this
  // You can pass a simple secret from your HTML, or use Vercel's password protection
  const clientSecret = req.headers['x-admin-secret'];
  if (clientSecret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 2. Query Supabase using the service key (bypasses RLS safely)
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/device_tokens?select=username,class_name,university&limit=5000`,
      {
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const rows = await response.json();

    // 3. Deduplicate and clean the data before sending to the browser
    const uniq = (arr) =>
      [...new Set(arr.filter((v) => v && String(v).trim() !== ''))].sort((a, b) =>
        String(a).localeCompare(String(b))
      );

    const data = {
      group: uniq(rows.map((r) => r.class_name)),
      university: uniq(rows.map((r) => r.university)),
      user: uniq(rows.map((r) => r.username)),
    };

    // 4. Return the lists. No tokens, no secrets.
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
