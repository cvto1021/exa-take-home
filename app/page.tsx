"use client";
import "./globals.css";
import { useMemo, useState } from "react";
import { trustTier, extractBriefingBullets } from "./lib/briefing";
import type { ExaResult } from "./lib/types/exa";


// 1. Build semantic intent query
// 2. Call /api/exa-search
// 3. Render briefing-ready cards


type BriefItem = { text: string; sourceUrl: string };

type Briefing = {
  generatedAt: string;
  endUser: string;
  location: string;
  incident: string;
  timeframeDays: number;
  mode: string;

  whatChanged: BriefItem[];
  confirmed: BriefItem[];
  unconfirmed: BriefItem[];
  recommendedActions: BriefItem[];
  playbooks: { title: string; url: string; whyRelevant: string }[];

  sources: (ExaResult & { domain: string })[];
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
    return `verified news coverage and situational context about ${inc} in ${loc} ${timeHint}`;
  }
  // past playbooks
  return `after action report or lessons learned related to ${inc} relevant to ${loc}`;
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function Home() {
  // States default query for public safety supervisors managing emergency incidents
  const [location, setLocation] = useState("King County, WA");
  const [incident, setIncident] = useState("EMS OR 911 OR dispatch");
  const [timeframeDays, setTimeframeDays] = useState(3);

  // Workflow mode
  const [mode, setMode] = useState<Mode>("official updates");

  //Results and Request state
  const [results, setResults] = useState<ExaResult[]>([]);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
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
      setBriefing(null);

      const res = await fetch("/api/exa-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, mode, timeframeDays, numResults: 8 }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
      
      // Set results and briefing
      setResults(data.results || []);
      setBriefing(data.briefing || null);
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
          Pulls authoritative updates, verified context, and historical playbooks
          from real external sources using Exa.
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

      {/* NEW: Briefing Artifact */}
      {briefing && (
        <section className="card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0 }}>Shift-Change Briefing Draft</h2>
            <div style={{ opacity: 0.8, fontSize: 13 }}>
              Generated: {fmtDate(briefing.generatedAt)} · End user: {briefing.endUser}
            </div>
          </div>

          <div style={{ opacity: 0.85, marginTop: 6, fontSize: 14 }}>
            <strong>Location:</strong> {briefing.location} · <strong>Incident:</strong> {briefing.incident} ·{" "}
            <strong>Window:</strong> {briefing.timeframeDays}d · <strong>Mode:</strong> {briefing.mode}
          </div>

          <div className="briefing-grid" style={{ marginTop: 14 }}>
            <div>
              <h3>What Changed</h3>
              {briefing.whatChanged?.length ? (
                <ul>
                  {briefing.whatChanged.map((x, i) => (
                    <li key={i}>
                      {x.text}{" "}
                      <a href={x.sourceUrl} target="_blank" rel="noreferrer">
                        (source)
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No clear update summary found in snippets.</p>
              )}
            </div>

            <div>
              <h3>Recommended Actions</h3>
              {briefing.recommendedActions?.length ? (
                <ul>
                  {briefing.recommendedActions.map((x, i) => (
                    <li key={i}>
                      {x.text}{" "}
                      <a href={x.sourceUrl} target="_blank" rel="noreferrer">
                        (source)
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No actionable guidance detected yet.</p>
              )}
            </div>

            <div>
              <h3>Confirmed</h3>
              {briefing.confirmed?.length ? (
                <ul>
                  {briefing.confirmed.map((x, i) => (
                    <li key={i}>
                      {x.text}{" "}
                      <a href={x.sourceUrl} target="_blank" rel="noreferrer">
                        (source)
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No confirmed statements detected yet.</p>
              )}
            </div>

            <div>
              <h3>Unconfirmed / Needs Verification</h3>
              {briefing.unconfirmed?.length ? (
                <ul>
                  {briefing.unconfirmed.map((x, i) => (
                    <li key={i}>
                      {x.text}{" "}
                      <a href={x.sourceUrl} target="_blank" rel="noreferrer">
                        (source)
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No unconfirmed claims flagged.</p>
              )}
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <h3>Relevant Playbooks (AAR/SOP)</h3>
              {briefing.playbooks?.length ? (
                <ul>
                  {briefing.playbooks.map((p, i) => (
                    <li key={i}>
                      <a href={p.url} target="_blank" rel="noreferrer">
                        {p.title}
                      </a>
                      <div className="muted" style={{ marginTop: 4 }}>
                        Why relevant: {p.whyRelevant}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No playbooks extracted for this run.</p>
              )}
            </div>
          </div>
        </section>
      )}
              

      {/* Results */}
      <ul className="result">
        {results.map((x, i) => (
          <li key={i} className="result-card">
            <a href={x.url} target="_blank" rel="noreferrer">
              {x.title ?? x.url}
            </a>
            <div className="domain">
              {new URL(x.url).hostname} • {trustTier(x.url)}
            </div>

            <ul className="snippet">
              {extractBriefingBullets(x).map((b, idx) => (
                <li key={idx}>{b}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </main>
  );
}