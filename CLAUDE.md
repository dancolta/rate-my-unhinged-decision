# Rate My Unhinged Decision

NodeSparks Mini App Challenge #1 — "How questionable was that, really?"

## What It Does
User describes something questionable they did. AI rates their unhinged level (0-100), assigns a psychological profile comparing them to historical figures, fictional villains, and internet archetypes. Generates a shareable verdict card optimized for Instagram Stories.

## Tech Stack
- **Frontend:** Next.js 14+ (App Router), Tailwind CSS
- **AI:** Groq free tier (Llama 3.3 70B or Mixtral 8x7B)
- **Rate Limiting:** Upstash Redis (per-IP, 10 req/hour)
- **Card Generation:** html-to-image (client-side)
- **Sharing:** Web Share API + clipboard fallback
- **Deployment:** Vercel

## File Structure
```
/app
  /api/analyze/route.ts   — POST endpoint, validates input, rate limits, calls Groq
  /page.tsx               — Landing page with input form
  /result/page.tsx        — Result display + shareable card
  /layout.tsx             — Root layout with fonts + metadata
  /globals.css            — Tailwind base + custom styles
/lib
  /ai.ts                  — Groq API wrapper
  /limits.ts              — Upstash rate limiter
  /prompts.ts             — AI system prompt + few-shot examples
  /types.ts               — TypeScript interfaces
  /utils.ts               — Shared utilities
/components
  /ResultCard.tsx          — Shareable card (html-to-image target, 1080x1920)
  /InputForm.tsx           — Textarea with validation
  /ShareButton.tsx         — Web Share API + clipboard fallback
  /ScoreDisplay.tsx        — Animated score meter (0-100)
  /LoadingState.tsx        — Processing animation
  /ErrorBoundary.tsx       — Error handling wrapper
  /Header.tsx              — App branding
  /Footer.tsx              — NodeSparks attribution
```

## Development Rules
- Mobile-first always (375px base)
- TDD: write tests alongside implementation
- Shareable card must be 9:16 (1080x1920) for Instagram Stories
- No `any` types in TypeScript
- Conventional commits: feat:, fix:, chore:, test:
- All tests must pass before moving to next task

## Environment Variables
```
GROQ_API_KEY=           # from console.groq.com
UPSTASH_REDIS_REST_URL= # from console.upstash.com
UPSTASH_REDIS_REST_TOKEN= # from console.upstash.com
```

## Run Locally
```bash
npm install
npm run dev
# Open http://localhost:3000
```

## AI Prompt Strategy
The system prompt should make the AI act as a "professional unhinged decision analyst" — funny, roast-style, references pop culture and historical figures, returns structured JSON with score, verdict, profile, and comparisons. Never cruel, always entertaining. The humor comes from the specificity of the comparisons, not from being mean.
