export type ScanResult = 'safe' | 'phishing' | 'malware';

interface SafeBrowsingResponse {
  matches?: Array<{
    threatType: string;
  }>;
}

/**
 * Scan a URL for malicious content using Google Safe Browsing API.
 * Returns 'safe', 'phishing', or 'malware'.
 * Falls back to 'safe' if API key is not configured (dev mode).
 */
export async function scanUrl(url: string): Promise<{
  result: ScanResult;
  provider: string;
}> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;

  if (!apiKey) {
    console.warn('GOOGLE_SAFE_BROWSING_API_KEY not set — skipping safety scan');
    return { result: 'safe', provider: 'none (dev mode)' };
  }

  try {
    const response = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: {
            clientId: 'url-shortener',
            clientVersion: '1.0.0',
          },
          threatInfo: {
            threatTypes: [
              'MALWARE',
              'SOCIAL_ENGINEERING',
              'UNWANTED_SOFTWARE',
              'POTENTIALLY_HARMFUL_APPLICATION',
            ],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url }],
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('Safe Browsing API error:', response.status);
      return { result: 'safe', provider: 'google_safe_browsing (error fallback)' };
    }

    const data: SafeBrowsingResponse = await response.json();

    if (data.matches && data.matches.length > 0) {
      const threatType = data.matches[0].threatType;
      if (threatType === 'SOCIAL_ENGINEERING') {
        return { result: 'phishing', provider: 'google_safe_browsing' };
      }
      return { result: 'malware', provider: 'google_safe_browsing' };
    }

    return { result: 'safe', provider: 'google_safe_browsing' };
  } catch (error) {
    console.error('Safe Browsing scan failed:', error);
    return { result: 'safe', provider: 'google_safe_browsing (error fallback)' };
  }
}
