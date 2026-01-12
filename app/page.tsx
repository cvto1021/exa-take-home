"use client";
import "./globals.css";
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
      : timeframeDays <= 3
      ? "in the past 72 hours"
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
  const [incident, setIncident] = useState("EMS OR 911 OR dispatch");
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
    <main className="app">
      <header className="app-header">
        <h1 className="title">Exa Public Safety Builder</h1>
        
        <p className="subtitle">
          Built for <strong>911 / Emergency Communications Center supervisors </strong>
          to quickly generate shift-change briefings during active incidents.
        </p>
        <p className="description">
          Pulls official updates, verified context, and past playbooks using Exa.
        </p>
      </header>

      {/* Inputs */}
      <section className="card input-grid">
        <label>
          <span>Location </span>
          <input value={location}
           onChange={(e) => setLocation(e.target.value)} 
          />
        </label>

        <label>
          <span>Incident focus </span>
          <input 
            value={incident} 
            onChange={(e) => setIncident(e.target.value)}  
          />
        </label>

        <label>
          <span>Timeframe </span>
          <select 
            value={timeframeDays} 
            onChange={(e) => setTimeframeDays(Number(e.target.value))}
          >
            <option value={1}>Last 24 hours</option>
            <option value={3}>Last 72 hours</option>
            <option value={7}>Last 7 days</option>
          </select>
        </label>
      </section>

      {/* Workflow buttons */}
      <section className="workflow">
        <div className="workflow-modes">
          <button 
            className={mode === "official updates" ? "active" : ""}
            onClick={() => setMode("official updates")}
          >
            Official Updates
          </button>

          <button 
            className={mode === "verified context" ? "active" : ""}
            onClick={() => setMode("verified context")}
          >
            Verified Context
          </button>
          
          <button 
            className={mode === "past playbooks" ? "active" : ""}
            onClick={() => setMode("past playbooks")}
          >
            Playbooks (AAR/SOP PDFs)
          </button>
        </div>

        <button className="primary" onClick={run}>
          {loading ? "Searching..." : "Generate Briefing Sources"}
        </button>
      </section>

      {/* Query Preview */}
      <section className="card query-box">
        <span className="label">Query (auto-generated)</span>
        <pre>{query}</pre>
      </section>

      {error && <div className="error">{error}</div>}

      {/* Results */}
      <ul className="result">
        {results.map((x, i) => (
          <li key={i} className="result-card">
            <a href={x.url} target="_blank" rel="noreferrer">
              {x.title || x.url}
            </a>
            <div className="domain">{new URL(x.url).hostname}</div>
            {x.snippet && <p className="snippet">{x.snippet}</p>}
          </li>
        ))}
      </ul>
    </main>
  );
}