const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

const readJsonBody = async (req) => {
  if (req.body) {
    if (typeof req.body === 'string') {
      return JSON.parse(req.body);
    }

    return req.body;
  }

  return await new Promise((resolve, reject) => {
    let raw = '';

    req.on('data', (chunk) => {
      raw += chunk;
    });

    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
};

const mapGeminiError = (status, errorMessage) => {
  if (status === 400) {
    return 'Fotograf islenemedi. Daha net bir fotograf cek.';
  }

  if (status === 401 || status === 403) {
    return 'Sunucu Gemini anahtariyla baglanamadi. Vercel ayarlarini kontrol et.';
  }

  if (status === 429) {
    return 'Cok fazla istek gonderildi. Biraz bekleyip tekrar dene.';
  }

  return `Gemini istegi basarisiz oldu: ${errorMessage}`;
};

module.exports = async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Sadece POST destekleniyor.' });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({ error: 'Sunucuda GEMINI_API_KEY tanimli degil.' });
    return;
  }

  let body;

  try {
    body = await readJsonBody(req);
  } catch {
    res.status(400).json({ error: 'Gecersiz JSON gonderildi.' });
    return;
  }

  const contents = body?.contents;

  if (!Array.isArray(contents) || contents.length === 0) {
    res.status(400).json({ error: 'contents alani bos olamaz.' });
    return;
  }

  try {
    const geminiResponse = await fetch(
      `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      }
    );

    const data = await geminiResponse.json().catch(() => ({}));

    if (!geminiResponse.ok) {
      const errorMessage = data?.error?.message || `HTTP ${geminiResponse.status}`;
      res.status(geminiResponse.status).json({
        error: mapGeminiError(geminiResponse.status, errorMessage),
      });
      return;
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text) {
      res.status(200).json({ text });
      return;
    }

    if (data?.candidates?.[0]?.finishReason === 'SAFETY') {
      res.status(400).json({
        error: 'Bu icerik guvenlik filtresi nedeniyle islenemedi. Baska bir fotograf dene.',
      });
      return;
    }

    if (data?.promptFeedback?.blockReason) {
      res.status(400).json({
        error: `Fotograf reddedildi: ${data.promptFeedback.blockReason}`,
      });
      return;
    }

    res.status(502).json({ error: 'Gemini beklenen formatta yanit donmedi.' });
  } catch (error) {
    console.error('Gemini proxy hatasi:', error);
    res.status(500).json({ error: 'AI servisine baglanirken beklenmeyen bir hata olustu.' });
  }
};
