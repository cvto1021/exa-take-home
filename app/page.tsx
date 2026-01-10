"use client";
import { useState } from "react";

export default function Home() {
  const [query, setQuery] = useState(
    'site:.gov ("after action report" OR AAR OR "lessons learned") (EMS OR 911 OR dispatch)'
  );
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setResults([]);

    const r = await fetch("/api/exa-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const data = await r.json();
    setResults(data.results || []);
    setLoading(false);
  }

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1>Exa Public Safety Applet</h1>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, padding: 10 }}
        />
        <button onClick={run} style={{ padding: "10px 14px" }}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      <ul style={{ marginTop: 20 }}>
        {results.map((x, i) => (
          <li key={i} style={{ marginBottom: 14 }}>
            <a href={x.url} target="_blank" rel="noreferrer">
              {x.title || x.url}
            </a>
            {x.snippet ? <div style={{ opacity: 0.8 }}>{x.snippet}</div> : null}
          </li>
        ))}
      </ul>
    </main>
  );
}