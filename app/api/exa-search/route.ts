import Exa from "exa-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body?.query as string;
    const numResults = Number(body?.numResults || 8);

    if (!query || typeof query !== "string") {
      return Response.json({ error: "Missing query" }, { status: 400 });
    }

    if (!process.env.EXA_API_KEY) {
      return Response.json({ error: "EXA_API_KEY not set" }, { status: 500 });
    }

    const exa = new Exa(process.env.EXA_API_KEY);

    const res = await exa.search(query, {
      numResults: Math.min(Math.max(numResults,1), 10),
      // You can add: startPublishedDate, includeDomains, excludeDomains, etc.
    });

    // SDK returns { results: [...] } in common usage
    return Response.json({ results: res.results ?? res });
  } catch (e: any) {
    return Response.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
