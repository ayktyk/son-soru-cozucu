const EXPLICIT_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

const getWindowOrigin = () => {
  if (typeof window === 'undefined' || !window.location?.origin) {
    return null;
  }

  return window.location.origin;
};

export const getApiBaseUrl = () => {
  const baseUrl = EXPLICIT_API_BASE_URL || getWindowOrigin();

  if (!baseUrl) {
    throw new Error('API adresi bulunamadi. EXPO_PUBLIC_API_BASE_URL ayarla.');
  }

  return baseUrl.replace(/\/$/, '');
};

export const callGeminiApi = async (contents) => {
  const response = await fetch(`${getApiBaseUrl()}/api/gemini`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || 'AI servisine ulasilamadi.');
  }

  if (!data?.text) {
    throw new Error('AI yaniti bos geldi. Tekrar dene.');
  }

  return data.text;
};
