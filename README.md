<div align="center">
  <h1>Atlas</h1>
  <p><strong>Interactive 3D companion runtime for Grand Cyber Park.</strong></p>
  <p>
    <a href="https://github.com/adityassarode/atlas"><img src="https://img.shields.io/github/stars/adityassarode/atlas?style=flat-square&amp;logo=github" alt="GitHub stars" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-4f46e5?style=flat-square" alt="MIT License" /></a>
    <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&amp;logo=next.js" alt="Next.js 16" />
    <img src="https://img.shields.io/badge/React-19-149eca?style=flat-square&amp;logo=react" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-5.7-3178c6?style=flat-square&amp;logo=typescript" alt="TypeScript" />
  </p>
  <p>
    <a href="#architecture">Architecture</a> ·
    <a href="#local-development">Development</a> ·
    <a href="#command-pipeline">Command pipeline</a> ·
    <a href="#configuration">Configuration</a> ·
    <a href="#deployment">Deployment</a>
  </p>
</div>

## What this repository contains

Atlas is a browser-first, real-time 3D companion experience. The app renders Grand Cyber Park with React Three Fiber, drives companion locomotion and choreographed actions in the client, and exposes an optional server-side conversational endpoint.

The application remains usable without external services: deterministic movement commands and local semantic fallbacks keep the interaction loop available when no model key is configured or an upstream provider is unavailable.

### Product capabilities

- Two avatar modes: human companion and Tesla Optimus.
- Park navigation, collision-aware movement, sprinting, jumping, sitting, and landmark travel.
- Camera presets, orbit controls, guided cinematic intro, and story progression.
- Text input, browser voice input/output, hands-free mode, and lip-sync-oriented speech flow.
- Music beat detection, dance lessons, generated choreography, and action queues.
- A live architectural map with park landmarks, distances, and click-to-navigate behavior.

## Architecture

```text
Browser
└── RobotStudio (components/robot-studio.tsx)
    ├── React Three Fiber canvas
    │   ├── ParkEnvironment
    │   ├── HumanCharacterModel | TeslaOptimusModel
    │   └── CameraDirector + OrbitControls
    ├── Interaction UI
    │   ├── command bar / microphone / map / keyboard
    │   └── story, camera, audio, and control overlays
    └── Client domain services (lib/)
        ├── AIBrain → /api/ai-character
        ├── ActionChoreographer → generated action plans
        ├── SpeechService + AudioDetector
        └── StoryEngine

Server
└── app/api/ai-character/route.ts
    ├── deterministic local response for direct locomotion
    ├── optional Gemini request (2.5s timeout)
    └── local semantic fallback
```

### Runtime boundaries

| Area | Location | Responsibility |
| --- | --- | --- |
| App shell and global styling | `app/` | Next.js App Router entry points, global CSS, metadata, API route |
| Experience composition | `components/robot-studio.tsx` | Primary interaction state, canvas composition, HUD, input wiring |
| 3D assets | `components/*Model.tsx`, `components/ParkEnvironment.tsx` | Avatar geometry, animation, and park rendering |
| Movement and action semantics | `lib/action-choreographer.ts`, `lib/generative-action-engine.ts` | Commands, action queues, kinematic phases, park collision rules |
| Conversation | `lib/ai-brain.ts`, `app/api/ai-character/route.ts` | Client orchestration, remote provider integration, local fallbacks |
| Voice and audio | `lib/speech-service.ts`, `lib/audio-detector.ts` | Browser speech lifecycle and music-beat detection |
| Narrative state | `lib/story-engine.ts` | Quest chapters, landmark progress, and completion events |

## Local development

### Prerequisites

- Node.js 20 or newer
- npm
- A WebGL-capable browser

```bash
git clone https://github.com/adityassarode/atlas.git
cd atlas
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

On Windows, replace the copy command with:

```powershell
Copy-Item .env.example .env.local
```

### Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Create an optimized production build. |
| `npm run start` | Serve the production build. |
| `npx tsc --noEmit` | Run TypeScript validation. |

## Command pipeline

Atlas deliberately separates exact movement from conversational interpretation.

1. Input arrives from keyboard, command bar, microphone, map, or story interaction.
2. `AIBrain` posts text and contextual state to `/api/ai-character`.
3. Direct locomotion terms such as `walk`, `run`, `sprint`, `turn`, and `step` are handled locally and deterministically.
4. Other supported commands may be sent to Gemini when `GEMINI_API_KEY` is available.
5. If the request fails, times out, or returns invalid data, the local semantic responder produces a fallback response.
6. `ActionChoreographer` queues validated actions; `SpeechService` handles the spoken reply.

This boundary is intentional: a provider response cannot reinterpret an explicit sprint or walk command as an unrelated action.

### Supported command examples

```text
walk to the gazebo
sprint forward 8 steps
turn around 180 degrees
go and sit on the bench
dance hip hop
do a backflip
walk to the lake pier
```

## Configuration

Create `.env.local` from `.env.example`. The provider key is optional.

```env
# Enables optional server-side conversational responses.
GEMINI_API_KEY=your_google_ai_studio_key

# Optional. Defaults to gemini-3.6-flash.
GEMINI_MODEL=gemini-3.6-flash
```

| Variable | Required | Notes |
| --- | --- | --- |
| `GEMINI_API_KEY` | No | Read only by the server route; never expose it to the browser. |
| `GEMINI_MODEL` | No | Overrides the route’s default provider model. |

> Keep `.env.local` private. Do not commit it or rename secrets with a `NEXT_PUBLIC_` prefix.

## Implementation notes

### Adding a landmark

Landmark data is distributed intentionally: add the canonical location in `PARK_LANDMARKS`, define an unobstructed endpoint in `PARK_APPROACH_POINTS`, add collision geometry in `PARK_OBSTACLES` when applicable, then expose it through the map and command parsing layers.

### Adding an action

Add an action through `generative-action-engine.ts` and `action-choreographer.ts`, then register its vocabulary in the API route’s supported-action validation. Keep action names explicit and ensure a failed provider response can still be handled locally.

### Changing the 3D scene

Keep frame-loop work inside React Three Fiber hooks. Avoid creating materials, geometries, vectors, or expensive allocations on every frame; allocate reusable Three.js objects once with refs or memoization.

## Deployment

Atlas can be deployed to Vercel or any Node.js-compatible host.

```bash
npm run build
npm run start
```

For hosted deployments, configure `GEMINI_API_KEY` only when conversational responses are needed. The core park experience does not depend on it.

## Repository conventions

- TypeScript is used for application code; keep types close to their domain.
- Preserve the separation between deterministic actions and provider-assisted conversation.
- Keep browser-only APIs inside client components or client services.
- Never add API keys, build output, or local environment files to version control.
- Use focused commits that describe observable behavior.

## Contributing

1. Fork or branch from the default branch.
2. Keep changes scoped to a single concern.
3. Run `npx tsc --noEmit` and any relevant runtime checks.
4. Open a pull request describing the behavior change and validation performed.

## License

Licensed under the [MIT License](LICENSE).

## Author

Created and maintained by [Aditya Sarode](https://github.com/adityassarode).  
© 2026 Aditya Sarode.
