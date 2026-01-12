export function trustTier(url: string) {
  const host = new URL(url).hostname;

  if (host.endsWith(".gov") || host === "weather.gov") {
    return "Tier 1 — Official";
  }

  if (
    ["seattletimes.com", "kuow.org", "komonews.com", "king5.com", "kiro7.com"]
      .includes(host)
  ) {
    return "Tier 2 — Verified Media";
  }

  return "Tier 3 — Other";
}

export function extractBriefingBullets(result: {
  highlights?: string[];
  text?: string;
}) {
  if (result.highlights?.length) {
    return result.highlights.slice(0, 4);
  }

  if (result.text) {
    return result.text
      .split(". ")
      .slice(0, 3)
      .map(s => s.trim());
  }

  return [];
}
