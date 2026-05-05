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

export async function scanUrl(url: string): Promise<{
  result: ScanResult;
  provider: string;
}> {
  const vtApiKey = process.env.VIRUSTOTAL_API_KEY;
  const gsbApiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;


  // common timeout for all requests
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    // 1. Try VirusTotal (Deeper analysis)
    if (vtApiKey) {
      try {
        const urlId = Buffer.from(url).toString('base64').replace(/=/g, '');
        const vtResponse = await fetch(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
          headers: { 'x-apikey': vtApiKey },
          signal: controller.signal,
        });

        if (vtResponse.ok) {
          const data: VirusTotalResponse = await vtResponse.json();
          const stats = data.data?.attributes?.last_analysis_stats;
          if (stats && (stats.malicious > 0 || (stats.suspicious && stats.suspicious > 2))) {
            clearTimeout(timeout);
            return { result: 'malware', provider: 'virustotal' };
          }
        }
      } catch (error) {
        if ((error as any).name === 'AbortError') {
          console.warn('VirusTotal scan timed out after 5s');
        } else {
          console.error('VirusTotal scan failed:', error);
        }
      }
    }

    // 2. Try Google Safe Browsing
    if (gsbApiKey) {
      try {
        const response = await fetch(
          `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${gsbApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              client: { clientId: 'url-shortener', clientVersion: '1.0.0' },
              threatInfo: {
                threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
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
            clearTimeout(timeout);
            const threatType = data.matches[0].threatType;
            return {
              result: threatType === 'SOCIAL_ENGINEERING' ? 'phishing' : 'malware',
              provider: 'google_safe_browsing'
            };
          }
        }
      } catch (error) {
        if ((error as any).name === 'AbortError') {
          console.warn('Safe Browsing scan timed out after 5s');
        } else {
          console.error('Safe Browsing scan failed:', error);
        }
      }
    }
  } finally {
    clearTimeout(timeout);
  }

  return { result: 'safe', provider: vtApiKey ? 'virustotal/google_safe_browsing' : 'google_safe_browsing' };
}
