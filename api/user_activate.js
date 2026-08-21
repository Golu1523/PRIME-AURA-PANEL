export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  }

  const { key } = req.body || {};

  if (!key) {
    return res.status(400).json({ status: 'error', message: 'License key is required' });
  }

  // 1. Try forwarding to the live PHP backend
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const phpResponse = await fetch('http://45.196.196.121/balamods/api/user_activate.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ActivationPortal/1.0'
      },
      body: JSON.stringify({ key: key }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (phpResponse.ok) {
      const data = await phpResponse.json();
      return res.status(200).json(data);
    }
  } catch (err) {
    console.warn('Live PHP server connection fallback triggered:', err.message);
  }

  // 2. Fallback local validation if PHP server is unreachable or for test keys
  const validKeys = [
    'BALA-1234-ABCD-5678',
    'TEST-KEY-9999-FREE',
    'BALA-VIP-2026-PASS'
  ];

  if (validKeys.includes(key.toUpperCase())) {
    return res.status(200).json({
      status: 'ok',
      message: 'Your IP is locked. Open the game!'
    });
  } else {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid or Expired Key'
    });
  }
}
