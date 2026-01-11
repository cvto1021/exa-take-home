# Exa Public Safety Applet

## Overview

This applet demonstrates how Exa’s search API can be used by public safety teams to quickly retrieve credible, high-signal information during active incidents or shift changes.

It is designed for 911 / Emergency Communications Center (ECC) supervisors who need to produce reliable briefings under time pressure using authoritative sources.

## End User

### Primary user:
Emergency Communications Center (911) Shift Supervisor

### Secondary users:
City or county emergency management duty officers

## Problem
During an active incident or shift change, supervisors must gather information from:

- official government alerts and press releases
- trusted local journalism
- historical after-action reports (AARs) and SOPs for similar incidents

This information is scattered across dozens of websites, often buried in long PDFs, and difficult to retrieve quickly with traditional search tools.

## Solution

The Public Safety Briefing Builder uses Exa to:

- retrieve authoritative, external sources in real time
- surface hard-to-find operational documents (AARs, SOPs, IAPs)
- organize results in a way that matches how supervisors actually work

Instead of searching manually, users generate a structured briefing in minutes.

## How Exa Is Used

The applet calls Exa’s API from a server-side route to perform targeted searches across real external content, including:
- .gov emergency alerts and press releases
- reputable local news outlets
- public after-action reports and incident playbooks (PDFs)
Exa’s semantic retrieval makes it easier to consistently find high-signal, operationally relevant documents that are often missed by keyword search.

## Workflow Fit

1. Supervisor selects an incident type and location
2. Applet runs predefined Exa searches for:
- Official updates
- Verified context
- Relevant playbooks (AAR/SOP)
3. Results are reviewed and copied into a shift-change briefing or CAD notes

This mirrors how information is actually gathered and shared during emergency operations.

## Tech Stack
- Next.js (App Router)
- Vercel
- Exa Search API

## Future Improvements
- Structured briefing summary generation
- Saved incident templates
- PDF-first filtering for playbooks
- Organization-specific domain tuning

## Example Queries

- ```site:.gov ("press release" OR "alert") (police OR fire OR emergency) "King County"```
- ```("after action report" OR AAR OR "lessons learned") site:.gov (EMS OR 911)```
- ```("King County" OR "Seattle") (police OR fire OR emergency) site:seattletimes.com```

## Why This Market

Public safety organizations operate in high-stakes, time-critical environments, yet rely on fragmented information systems. Vendors often focus on hardware or dispatch software, leaving a gap in knowledge retrieval and operational context.

Exa uniquely enables fast, reliable access to the information these teams already depend on — but struggle to find.


## How to run the application

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.


