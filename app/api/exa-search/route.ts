import Exa from "exa-js";


type ExaResult = {
  url: string;
  title?: string | null;
  snippet?: string | null;
};

type BriefItem = {
  text: string;
  sourceUrl: string;
};

function domainFromUrl(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

// Very lightweight signals (no LLM required)
const CONFIRMED_HINTS = [/confirmed/i, /according to/i, /official/i, /said in a statement/i];
const UNCONFIRMED_HINTS = [/unconfirmed/i, /reports suggest/i, /sources said/i, /rumored/i];
const ACTION_HINTS = [
  /avoid/i,
  /shelter/i,
  /evacuate/i,
  /road closed/i,
  /do not/i,
  /stay away/i,
  /warning/i,
];

function pickSentence(snippet: string) {
  const parts = snippet.split(/(?<=[.!?])\s+/);
  return (parts[0] || snippet).trim();
}

function buildBriefing(params: {
  results: ExaResult[];
  mode: string;
  location: string;
  incident: string;
  timeframeDays: number;
}) {
  const sources = params.results.map(r => ({
    ...r,
    domain: domainFromUrl(r.url),
  }));

  const whatChanged: BriefItem[] = [];
  const confirmed: BriefItem[] = [];
  const unconfirmed: BriefItem[] = [];
  const recommendedActions: BriefItem[] = [];
  const playbooks: { title: string; url: string; whyRelevant: string }[] = [];

  for (const s of sources) {
    if (!s.snippet) continue;

    const line = pickSentence(s.snippet);

    // Playbooks mode: treat PDFs as procedural references
    if (params.mode === "past playbooks") {
      playbooks.push({
        title: s.title || s.url,
        url: s.url,
        whyRelevant: `Mentions ${params.incident} in ${params.location}.`,
      });
      continue;
    }

    if (ACTION_HINTS.some(rx => rx.test(s.snippet ||""))) {
      recommendedActions.push({ text: line, sourceUrl: s.url });
    }

    if (UNCONFIRMED_HINTS.some(rx => rx.test(s.snippet ||""))) {
      unconfirmed.push({ text: line, sourceUrl: s.url });
    } else if (CONFIRMED_HINTS.some(rx => rx.test(s.snippet ||""))) {
      confirmed.push({ text: line, sourceUrl: s.url });
    }

    whatChanged.push({ text: line, sourceUrl: s.url });
  }

  return {
    generatedAt: new Date().toISOString(),
    endUser: "ECC Supervisor",
    location: params.location,
    incident: params.incident,
    timeframeDays: params.timeframeDays,
    mode: params.mode,

    whatChanged: whatChanged.slice(0, 6),
    confirmed: confirmed.slice(0, 6),
    unconfirmed: unconfirmed.slice(0, 6),
    recommendedActions: recommendedActions.slice(0, 6),
    playbooks: playbooks.slice(0, 6),

    sources,
  };
}


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body?.query as string;
    const numResults = Number(body?.numResults || 8);

    const mode = body?.mode as string;
    const location = body?.location as string;
    const incident = body?.incident as string;
    const timeframeDays = Number(body?.timeframeDays || 3);

    if (!query || typeof query !== "string") {
      return Response.json({ error: "Missing query" }, { status: 400 });
    }

    if (!process.env.EXA_API_KEY) {
      return Response.json({ error: "EXA_API_KEY not set" }, { status: 500 });
    }

    const exa = new Exa(process.env.EXA_API_KEY);

    const res = await exa.search(query, {
      numResults: Math.min(Math.max(numResults,1), 10),
    });

    const results: ExaResult[] = res.results ?? res;

    // 🔑 NEW: build an analysis artifact
    const briefing = buildBriefing({
      results,
      mode,
      location,
      incident,
      timeframeDays,
    });

    // SDK returns { results: [...] } in common usage
    return Response.json({
      briefing,
      results});
  } catch (e: any) {
    return Response.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
