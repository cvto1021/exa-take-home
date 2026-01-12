import Exa from "exa-js";
import { isoDaysAgo } from "@/app/lib/time";
import { OFFICIAL_DOMAINS, VERIFIED_CONTEXT_DOMAINS, PLAYBOOK_DOMAINS } from "@/app/lib/domains";


export async function POST(req: Request) {
  const { query, mode, timeframeDays, numResults } = await req.json();

  const exa = new Exa(process.env.EXA_API_KEY!);

  const includeDomains =
    mode === "official updates"
      ? OFFICIAL_DOMAINS
      : mode === "verified context"
      ? VERIFIED_CONTEXT_DOMAINS
      : PLAYBOOK_DOMAINS;

  const res = await exa.searchAndContents(query, {
    numResults: Math.min(numResults ?? 8, 10),
    includeDomains,
    startPublishedDate: isoDaysAgo(timeframeDays ?? 3),
    highlights: true,
    text: { maxCharacters: 2000 },
  });

  return Response.json({ results: res.results });
}
