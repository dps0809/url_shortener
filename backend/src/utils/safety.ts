export type ScanResult = 'safe' | 'phishing' | 'malware';

interface SafeBrowsingResponse {
  matches?: Array<{
    threatType: string;
  }>;
}

interface VirusTotalResponse {
  data?: {
    attributes?: {
      last_analysis_stats?: {
        malicious: number;
        suspicious: number;
      };
    };
  };
}

/**
 * Scan a URL for malicious content using VirusTotal (primary) and Google Safe Browsing (fallback/parallel).
 * Returns 'safe', 'phishing', or 'malware'.
 * Falls back to 'safe' if API keys are not configured.
 */
export async function scanUrl(url: string): Promise<{
  result: ScanResult;
  provider: string;
}> {
  // 1. Try VirusTotal (Deeper analysis)
  const vtApiKey = process.env.VIRUSTOTAL_API_KEY;
  if (vtApiKey) {
    try {
      // URL ID for VT is base64 of the URL without padding
      const urlId = Buffer.from(url).toString('base64').replace(/=/g, '');
      const vtResponse = await fetch(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
        headers: { 'x-apikey': vtApiKey },
      });

      if (vtResponse.ok) {
        const data: VirusTotalResponse = await vtResponse.json();
        const stats = data.data?.attributes?.last_analysis_stats;
        
        // malicious > 0 or suspicious > 2 is a common threshold for blocking
        if (stats && (stats.malicious > 0 || (stats.suspicious && stats.suspicious > 2))) {
          return { result: 'malware', provider: 'virustotal' };
        }
      } else if (vtResponse.status === 404) {
        console.log('URL not found in VirusTotal, falling back to Google Safe Browsing');
      }
    } catch (error) {
      console.error('VirusTotal scan failed:', error);
    }
  }

  // 2. Try Google Safe Browsing (Reliable fallback/primary)
  const gsbApiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!gsbApiKey) {
    if (!vtApiKey) console.warn('Neither VIRUSTOTAL_API_KEY nor GOOGLE_SAFE_BROWSING_API_KEY set — skipping safety scan');
    return { result: 'safe', provider: 'none (dev mode)' };
  }

  try {
    const response = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${gsbApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: { clientId: 'url-shortener', clientVersion: '1.0.0' },
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

    if (response.ok) {
      const data: SafeBrowsingResponse = await response.json();
      if (data.matches && data.matches.length > 0) {
        const threatType = data.matches[0].threatType;
        return { 
          result: threatType === 'SOCIAL_ENGINEERING' ? 'phishing' : 'malware', 
          provider: 'google_safe_browsing' 
        };
      }
    }
  } catch (error) {
    console.error('Safe Browsing scan failed:', error);
  }

  return { result: 'safe', provider: vtApiKey ? 'virustotal/google_safe_browsing' : 'google_safe_browsing' };
}
