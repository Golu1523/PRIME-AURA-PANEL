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

  const inputKey = String(key).trim();
  let targetKey = inputKey;
  let firebaseMatched = false;

  // 1. Fetch Firebase Realtime Database mapping under /KEY node
  try {
    const fbController = new AbortController();
    const fbTimeout = setTimeout(() => fbController.abort(), 3500);

    const fbUrl = `https://prime-aura-45381-default-rtdb.firebaseio.com/KEY/${encodeURIComponent(inputKey)}.json`;
    const fbRes = await fetch(fbUrl, { signal: fbController.signal });
    clearTimeout(fbTimeout);

    if (fbRes.ok) {
      const fbData = await fbRes.json();

      if (fbData && typeof fbData === 'string' && fbData.trim()) {
        targetKey = fbData.trim();
        firebaseMatched = true;
      } else if (fbData && typeof fbData === 'object') {
        if (fbData.key && typeof fbData.key === 'string') {
          targetKey = fbData.key.trim();
          firebaseMatched = true;
        } else if (fbData.value && typeof fbData.value === 'string') {
          targetKey = fbData.value.trim();
          firebaseMatched = true;
        }
      }
    }
  } catch (err) {
    console.warn('Firebase Key Lookup failed/timed out:', err.message);
  }

  // 2. Submit resolved targetKey to live PHP backend
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const phpResponse = await fetch('http://45.196.196.121/balamods/api/user_activate.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ActivationPortal/1.0'
      },
      body: JSON.stringify({ key: targetKey }),
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

  // 3. Fallback local validation if PHP server is offline or for test keys
  const validKeys = [
    'BALA-1234-ABCD-5678',
    'TEST-KEY-9999-FREE',
    'BALA-VIP-2026-PASS',
    '1', '2', '3', 'GOLU'
  ];

  if (firebaseMatched || validKeys.includes(targetKey.toUpperCase()) || validKeys.includes(inputKey.toUpperCase())) {
    return res.status(200).json({
      status: 'ok',
      message: 'Your IP is locked. Open the game!'
    });
  } else {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid key'
    });
  }
}
