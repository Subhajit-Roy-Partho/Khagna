// Resilient HTTP layer for crawling: rotating user agents, timeouts, retries
// with backoff, optional proxy support, and explicit bot-wall detection.

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0",
];

export type FetchResult = {
  ok: boolean;
  status: number;
  finalUrl: string;
  html: string;
  blocked: string | null;
  error?: string;
};

// Markers that mean "bot mitigation page", not real content.
const BLOCK_URL_PATTERNS = [
  "/blocked",
  "are-you-human",
  "challenge",
  "captcha",
  "datadome",
  "perimeterx",
  "px-captcha",
  "verify-you-are-human",
];

const BLOCK_HTML_PATTERNS = [
  /px-captcha/i,
  /perimeterx/i,
  /press\s*&\s*hold/i,
  /verify you are (a )?human/i,
  /are you a robot/i,
  /datadome/i,
  /kasada/i,
  /access denied/i,
  /request blocked/i,
];

export function detectBlock(finalUrl: string, html: string): string | null {
  const u = finalUrl.toLowerCase();
  const hit = BLOCK_URL_PATTERNS.find((p) => u.includes(p));
  if (hit) return `block-url:${hit}`;
  const m = BLOCK_HTML_PATTERNS.find((re) => re.test(html));
  if (m) return `block-html:${m.source.slice(0, 40)}`;
  return null;
}

function pickUa(seed: number): string {
  return USER_AGENTS[seed % USER_AGENTS.length];
}

export async function fetchHtml(
  url: string,
  opts: { timeoutMs?: number; retries?: number; seed?: number; referer?: string } = {}
): Promise<FetchResult> {
  const timeoutMs = opts.timeoutMs ?? 25000;
  const retries = opts.retries ?? 2;
  let lastError = "";
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": pickUa((opts.seed ?? 0) + attempt),
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          ...(opts.referer ? { Referer: opts.referer } : {}),
        },
      });
      const finalUrl = res.url || url;
      const html = await res.text().catch(() => "");
      const blocked = detectBlock(finalUrl, html);
      return { ok: res.ok && !blocked, status: res.status, finalUrl, html, blocked };
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      // exponential backoff before retry
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    } finally {
      clearTimeout(timer);
    }
  }
  return { ok: false, status: 0, finalUrl: url, html: "", blocked: null, error: lastError };
}

// NOTE on proxies: datacenter IPs (Vercel, GitHub Actions, most VPS) are blocked
// by Walmart / Sam's / Costco / Kroger bot walls. If you have a residential
// proxy, export CRAWL_PROXY=http://user:pass@host:port and route fetches through
// it with any undici ProxyAgent-compatible dispatcher. The pipeline reads the
// variable and logs whether proxy mode is on (see pipeline.ts).
export function proxyMode(): boolean {
  return Boolean(process.env.CRAWL_PROXY || process.env.HTTPS_PROXY);
}
