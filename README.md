# E.F.O.O.T.Y. Director

**Enterprise Framework for Objective & Outcome Tracking Yields**

> An enterprise dashboard that uses sports metaphors to track agile projects, sprint velocity, and corporate KPIs — wrapped in a brutalist, corporate-dystopian UI that parodies real enterprise software.

---

## Quick Start for Judges

**Just want to see it in action? No signup needed.**

1. Visit the deployed app
2. Click **"Explore Demo Project"** on the landing page
3. Browse the fully populated demo dashboard with 6 teams, completed sprints, and live analytics

The demo loads fake data locally — no Firebase account required.

---

## What This Is

E.F.O.O.T.Y. Director is a **full-stack project management tool** disguised as a corporate parody. Under the satire, it's a genuinely functional dashboard that:

- Tracks teams ("pods") competing across sprint cycles
- Calculates live leaderboards with points, wins, draws, losses
- Manages squad rosters with drag-and-drop assignments
- Generates AI-powered performance reviews and coaching insights
- Visualizes sprint velocity with interactive charts

The "joke" is the UI — it's designed like the worst enterprise software you've ever used, complete with mandatory productivity enforcement, passive-aggressive compliance alerts, and executive jargon everywhere.

---

## Features

### Core Dashboard
| Feature | Description |
|---|---|
| **Live Leaderboard** | Real-time standings with points, yield (goals), and pod rankings |
| **Sprint Pipeline** | Drag-and-drop Kanban board for managing sprint stages |
| **KPI Highlights** | Top Yield Producer, Synergy Ops Leader, Defect Blocker stats |
| **Squad Builder** | Visual formation editor with position-based roster management |
| **Analytics View** | Goal distribution charts, title race visualization |
| **Synergy Burndown Matrix** | Interactive Recharts-powered delivery tracking |

### AI-Powered (Google Gemini)
| Feature | Description |
|---|---|
| **AI Oracle** | Ask questions about your project — gets context-aware answers |
| **Corporate Review Generator** | Generates passive-aggressive performance reviews per player |
| **Quarterly Report** | Bulk AI reviews for all team members in one click |
| **Executive Email Digest** | AI-composed stakeholder status email with full corporate jargon |

### Enterprise Satire Features
| Feature | Description |
|---|---|
| **Productivity Enforcer** | Locks the screen after 6s of idle time — type "I AM WORKING" to unlock |
| **RTO Tracker** | "Return to Office" compliance banner with yield penalties |
| **Chaos Monkey** | "Automated Resource Liquidator" — randomly eliminates a team member |
| **Corporate Alerts Ticker** | Bloomberg-style scrolling news bar with satirical project updates |
| **Board Meeting Mode** | Fullscreen auto-cycling presentation (Leaderboard → Performers → Results → Summary) |
| **Synergy Guide** | Context-aware page guide with a re-triggerable "?" button |
| **PIP Modal** | Place underperformers on a "Performance Improvement Plan" |
| **Absurd Org Chart** | Procedurally generated nonsensical corporate hierarchy |

### Demo & Onboarding
| Feature | Description |
|---|---|
| **Interactive Demo** | 4-slide onboarding walkthrough for first-time visitors |
| **Guest Demo Mode** | Fully functional demo project with mock data — no auth required |
| **Corporate Guide** | Page-aware tutorial system that auto-triggers on each page |

---

## Setup

```bash
# Clone and install
git clone <repo-url>
cd efooty-manager
npm install --legacy-peer-deps

# Add your API keys
cp .env.example .env
# Edit .env with your Firebase config and Gemini API key

# Run
npm run dev
```

---

## 📐 Architecture Note

You may notice internal components referencing "Tournaments," "Fixtures," or "Goals." This is an **intentional architectural decision** — the app was originally built as a football tournament manager and was refactored into a corporate project tracker. The underlying data model uses sports metaphors (matches = sprints, goals = yield, players = directors) which reinforces the premise.

---

*Built for the Hackathon. Maximizing Yields, One Sprint at a Time.* 
