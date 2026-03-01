# Rate My Unhinged Decision

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Groq](https://img.shields.io/badge/Groq-Llama_3.3_70B-F55036)](https://groq.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000?logo=vercel)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> Confess your most questionable life choice. Get judged by AI. Share the damage.

**Rate My Unhinged Decision** is a viral mini web app where you describe something questionable you did and an AI "professional unhinged decision analyst" rates it on a 0-100 scale, delivers a roast-style verdict, psychoanalyzes you by comparing your energy to historical figures and fictional characters, and generates a shareable Instagram Story card so you can broadcast your chaos to the world.

Built by [NodeSparks](https://nodesparks.com) as Mini App Challenge #1.

---

<!-- Replace with actual screenshot when available -->
<!-- ![App Screenshot](docs/screenshot.png) -->

## How It Works

1. **Confess** -- Describe your questionable decision (10-500 characters).
2. **Get Judged** -- AI rates your unhinged level 0-100, delivers a verdict, a psychological profile, 3 comparison figures (historical, fictional, wildcard), and a recommendation.
3. **Share the Damage** -- Generate a 1080x1920 Instagram Story card and share it via Web Share API or clipboard.

The entire flow is a single-page state machine: `input -> loading -> result`. No accounts, no databases, no cookies. Just confessions and consequences.

## Features

- **AI-Powered Analysis** -- Groq's Llama 3.3 70B delivers genuinely funny, specific roasts with historical/pop culture comparisons
- **Shareable Story Cards** -- Client-side 1080x1920 image generation optimized for Instagram Stories
- **Smart Sharing** -- Web Share API on supported devices, clipboard fallback everywhere else, plus a "Dare a Friend" button
- **Rate Limiting** -- Per-IP sliding window (15 requests/hour) via Upstash Redis
- **Model Fallback** -- Automatic failover from Llama 3.3 70B to Llama 3.1 8B on rate limits or model unavailability
- **Triple-Layer JSON Safety** -- Groq JSON mode, Zod schema validation, and a canned fallback response
- **Resilient Error Handling** -- Typed error classes, automatic retry on transient failures, themed error messages
- **Mobile-First Design** -- Responsive from 375px up, glassmorphism UI with score-based color gradients
- **Confetti on high scores** -- Because some decisions deserve celebration

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS 4 |
| AI | Groq API (Llama 3.3 70B primary, Llama 3.1 8B fallback) |
| Rate Limiting | Upstash Redis (sliding window, 15 req/hr/IP) |
| Image Generation | html-to-image (client-side) |
| Validation | Zod 4 |
| Testing | Vitest + Testing Library |
| Fonts | Space Grotesk (headings) + Plus Jakarta Sans (body) |
| Deployment | Vercel |

## Project Structure

```
/app
  /api/analyze/route.ts   -- POST endpoint: validate, rate limit, call Groq, return JSON
  page.tsx                 -- Single-page app with input/loading/result state machine
  layout.tsx               -- Root layout with fonts, metadata, OG tags
  globals.css              -- Tailwind base + glassmorphism custom styles
  opengraph-image.tsx      -- Dynamic OG image generation

/components
  InputForm.tsx            -- Textarea with character count + validation
  LoadingState.tsx         -- Animated processing screen
  ScoreDisplay.tsx         -- Animated score meter (0-100)
  ResultCard.tsx           -- Shareable card target (1080x1920, rendered off-screen)
  ShareButton.tsx          -- Web Share API + clipboard fallback
  ErrorBoundary.tsx        -- Themed error display with retry
  Header.tsx               -- App branding
  Footer.tsx               -- NodeSparks attribution

/lib
  ai.ts                    -- Groq API wrapper with model fallback + typed errors
  limits.ts                -- Upstash rate limiter (sliding window)
  prompts.ts               -- System prompt + few-shot examples + AI config
  types.ts                 -- TypeScript interfaces + Zod schemas
  utils.ts                 -- Input sanitization + shared utilities

/tests                     -- Vitest test suite (unit + integration + e2e)
/docs                      -- Architecture + UI/UX design docs
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### 1. Clone the repo

```bash
git clone https://github.com/nodesparks/rate-my-unhinged-decision.git
cd rate-my-unhinged-decision
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the project root:

```env
# AI — get your key at https://console.groq.com
GROQ_API_KEY=gsk_your_key_here

# Rate Limiting — get your credentials at https://console.upstash.com
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

> **Note:** Rate limiting is bypassed in development (`NODE_ENV=development`), so Upstash credentials are optional for local dev. You will still need a Groq API key.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and confess something.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run test` | Run Vitest test suite |
| `npm run lint` | Run ESLint |

## Architecture Highlights

### AI Pipeline

```
User Input
  -> Input sanitization (XSS, length, whitespace)
  -> Per-IP rate limit check (Upstash Redis, sliding window)
  -> Groq API call (Llama 3.3 70B, JSON mode, 15s timeout)
     -> On 429/model unavailable: automatic fallback to Llama 3.1 8B
     -> On parse/schema error: automatic retry (1x)
  -> Zod schema validation
  -> Structured response with metadata (model used, processing time)
```

### Error Strategy

Every error has a themed, in-character message. The AI "analyst" stays in persona even when things break:

- **429 Rate Limit**: "Slow down, chaos agent. The tribunal needs a recess."
- **504 Timeout**: "The analyst stared into the abyss of your decision for too long and got lost."
- **502 Service Error**: "The analyst called in sick today. Even chaos professionals need mental health days."

### Scoring Calibration

The AI prompt includes strict scoring guidelines with calibration anchors to prevent score inflation:

- Cereal for dinner = 5-8
- Called in sick to play video games = 25-35
- Quit a job via company-wide email = 55-70
- Face tattoo of ex's name = 75-90

Most real-world submissions land in the 10-40 range. The entertainment comes from the writing, not inflated numbers.

## Deployment

The app is designed for one-click Vercel deployment:

1. Push to GitHub
2. Import into Vercel
3. Add the three environment variables (`GROQ_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`)
4. Deploy

## Contributing

This is a mini app challenge project. If you want to fork it and make your own version, go for it. If you find a bug, open an issue.

## License

MIT

---

Built with questionable judgment by [NodeSparks](https://nodesparks.com).
