export default function handler(req, res) {
  // Sirf POST request accept karein
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  }

  const { key } = req.body || {};

  if (!key) {
    return res.status(400).json({ status: 'error', message: 'License key is required' });
  }

  // Example: Valid keys ki list (Aap ise Database ya KV store se replace kar sakte hain)
  const validKeys = ['BALA-1234-ABCD-5678', 'TEST-KEY-9999-FREE'];

  if (validKeys.includes(key)) {
    return res.status(200).json({
      status: 'ok',
      message: 'Your key has been successfully activated!'
    });
  } else {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid key'
    });
  }
}
