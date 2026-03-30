import { NextRequest, NextResponse } from 'next/server';

const VT_API_KEY = process.env.VIRUS_TOTAL_API;
const VT_BASE_URL = 'https://www.virustotal.com/api/v3';

async function submitUrl(url: string): Promise<string> {
  const res = await fetch(`${VT_BASE_URL}/urls`, {
    method: 'POST',
    headers: {
      'x-apikey': VT_API_KEY!,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ url }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`VirusTotal submit failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.data.id as string;
}

async function pollAnalysis(analysisId: string): Promise<any> {
  const maxAttempts = 10;
  const baseDelay = 3000;

  for (let i = 0; i < maxAttempts; i++) {
    const delay = baseDelay * Math.pow(1.5, i);
    await new Promise((r) => setTimeout(r, delay));

    const res = await fetch(`${VT_BASE_URL}/analyses/${analysisId}`, {
      headers: { 'x-apikey': VT_API_KEY! },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`VirusTotal poll failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    if (data.data.attributes.status === 'completed') {
      return data.data.attributes;
    }
  }

  throw new Error('VirusTotal analysis timed out');
}

export async function POST(request: NextRequest) {
  try {
    if (!VT_API_KEY) {
      return NextResponse.json(
        { error: 'VIRUS_TOTAL_API env variable is not set' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'url is required in request body' },
        { status: 400 }
      );
    }

    // Submit URL to VirusTotal
    const analysisId = await submitUrl(url);

    // Poll for results
    const result = await pollAnalysis(analysisId);
    const stats = result.stats;

    const isMalicious = (stats.malicious ?? 0) + (stats.suspicious ?? 0) > 0;

    return NextResponse.json({
      url,
      analysisId,
      verdict: isMalicious ? 'MALICIOUS' : 'CLEAN',
      stats: {
        malicious: stats.malicious,
        suspicious: stats.suspicious,
        harmless: stats.harmless,
        undetected: stats.undetected,
        timeout: stats.timeout,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
