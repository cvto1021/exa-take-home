"use client";
import { useMemo, useState } from "react";

type ExaResult = {
  url: string;
  title?: string;
  snippet?: string; 
};

type Mode = "official updates" | "verified context" | "past playbooks";

function buildQuery(modes: Mode, location: string, incident: string, timeframeDays: number) {
  const loc = location.trim();
  const inc = incident.trim();
  
  const timeHint =
    timeframeDays <= 1
      ? "in the last 24 hours"
      : timeframeDays <= 7
      ? "in the past week"
      : `in the past ${timeframeDays} days`;

  if (modes === "official updates") {
    return `site:.gov ("press release" OR "alert" OR "official update") (police OR fire OR sheriff OR "emergency management") ${inc} (${loc}) ${timeHint}`;
  }
   if (modes === "verified context") {
    return `(${inc}) (${loc}) (police OR fire OR emergency OR incident) site:seattletimes.com OR site:kuow.org OR site:komonews.com ${timeHint}`;
  } 
  return `"(after action report" OR AAR OR "lessons learned" OR SOP OR "incident action plan" OR IAP) site:.gov filetype:pdf (${inc}) (${loc})`;
}

export default function Home() {
  // States default query for public safety supervisors managing emergency incidents
  const [location, setLocation] = useState("King County, WA");
  const [incident, setIncident] = useState("EMS OR 911 OD dispatch");
  const [timeframeDays, setTimeframeDays] = useState(3);

  // Workflow mode
  const [mode, setMode] = useState<Mode>("past playbooks");

  //Results and Request state
  const [results, setResults] = useState<ExaResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoized query string
  const query = useMemo(
    () => buildQuery(mode, location, incident, timeframeDays),
    [mode, location, incident, timeframeDays]
  );

  async function run() {
    try{
      setLoading(true);
      setError(null);
      setResults([]);

      const r = await fetch("/api/exa-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, numResults: 8 }),
      });
      
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || `Request failed (${r.status})`);
      
      setResults(data.results || []);
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 950, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ marginBottom: 6 }}>Exa Public Safety Builder</h1>
      
      <p style={{ marginTop: 0, opacity: 0.85 }}>
        Built for <strong>911 / Emergency Communications Center supervisors</strong>
        to quickly generate shift-change briefings during active incidents.
      </p>
      <p style={{ opacity: 0.8 }}>
        Pulls official updates, verified context, and past playbooks using Exa.
      </p>

      {/* Inputs */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 18 }}>
        <label>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Location</div>
          <input value={location} onChange={(e) => setLocation(e.target.value)} style={{ width: "100%", padding: 10 }} />
        </label>

        <label>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Incident focus</div>
          <input value={incident} onChange={(e) => setIncident(e.target.value)} style={{ width: "100%", padding: 10 }} />
        </label>

        <label>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Timeframe</div>
          <select value={timeframeDays} onChange={(e) => setTimeframeDays(Number(e.target.value))} style={{ width: "100%", padding: 10 }}>
            <option value={1}>Last 24 hours</option>
            <option value={3}>Last 72 hours</option>
            <option value={7}>Last 7 days</option>
          </select>
        </label>
      </section>

      {/* Workflow buttons */}
      <section style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <button onClick={() => setMode("official updates")} style={{ padding: "10px 12px", fontWeight: mode === "official updates" ? 700 : 400 }}>
          Official Updates
        </button>
        <button onClick={() => setMode("verified context")} style={{ padding: "10px 12px", fontWeight: mode === "verified context" ? 700 : 400 }}>
          Verified Context
        </button>
        <button onClick={() => setMode("past playbooks")} style={{ padding: "10px 12px", fontWeight: mode === "past playbooks" ? 700 : 400 }}>
          Playbooks (AAR/SOP PDFs)
        </button>

        <button onClick={run} style={{ padding: "10px 14px", marginLeft: "auto" }}>
          {loading ? "Searching..." : "Generate Briefing Sources"}
        </button>
      </section>

      {/* Show the query for transparency */}
      <section style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, opacity: 0.7 }}>Query (auto-generated)</div>
        <div style={{ padding: 10, background: "#f6f6f6", borderRadius: 8, overflowX: "auto" }}>{query}</div>
      </section>

      {error && <p style={{ color: "crimson", marginTop: 14 }}>{error}</p>}

      <ul style={{ marginTop: 20 }}>
        {results.map((x, i) => (
          <li key={i} style={{ marginBottom: 14 }}>
            <a href={x.url} target="_blank" rel="noreferrer">
              {x.title || x.url}
            </a>
            <div style={{ fontSize: 12, opacity: 0.75 }}>{new URL(x.url).hostname}</div>
            {x.snippet ? <div style={{ opacity: 0.85 }}>{x.snippet}</div> : null}
          </li>
        ))}
      </ul>
    </main>
  );
}