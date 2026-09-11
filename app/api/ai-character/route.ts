/* © 2026 Aditya Sarode. All rights reserved. */
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// This API key's Gemini project requires the current 3.6 Flash endpoint.
// Keep it overridable for deployments with a different model entitlement.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const GEMINI_MAX_OUTPUT_TOKENS = 180;

// Deliberately compact: it is sent on each turn and describes only what Gemini
// needs to converse naturally and operate the on-screen companion.
const ATLAS_SYSTEM_PROMPT = `You are Atlas, a friendly 3D companion in Grand Cyber Park. Explain only real app features: 3D human/Optimus avatar, chat, browser voice and hands-free mode, speech/lip-sync, keyboard/on-screen movement, camera angle pad, music-reactive dancing, dance lessons, and story quests. You control one avatar. Park destinations are only: Grand Marble Fountain, Cedar Gazebo Pavilion, Lakeside Pier, Sakura Cherry Grove, Pine Grove, Calisthenics Gym, Willow Stream Bridge, and Garden Bench. Controls: go/walk/run/sprint forward or backward, go left/right, turn, jump, backflip, dance, wave, salute, bow, pushups, karate, yoga, sit/stand, or navigate to a listed place. Treat a noisy voice transcription as its closest supported command: ran/jog/rush/dash means sprint; back word means backward; foreword means forward; write/lift after turn means right/left. For any misspelled, partial, or phonetic park-place request, infer the closest destination above and return its exact supported action (for example "walk to the water fountain", "walk to the gazebo", "walk to the lake pier", "walk to the cherry blossom tree", "walk to the pine grove", "walk to the workout station", "walk to the willow stream", or "go and sit on the bench"). Return ONLY compact JSON: {"speech":"1-2 short sentences","actions":["0-2 supported actions"],"mood":"happy|energetic|calm|curious|mischievous","camera":"follow|closeup|overview"}. Never invent controls, APIs, or unsafe real-world actions. Preserve an explicit sprint/run/walk direction rather than replacing it with dance.`;

type AICharacterRequest = {
  prompt: string;
  avatarType: "human" | "robot";
  position?: [number, number, number];
  yaw?: number;
  nearbyLandmark?: string;
  currentQuest?: string;
};

export async function POST(req: Request) {
  try {
    const body: AICharacterRequest = await req.json();
    const {
      prompt,
      avatarType = "human",
      position = [0, 0, 4.8],
      yaw = 0,
      nearbyLandmark = "Central Grand Plaza",
      currentQuest = "Fountain Awakening",
    } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      );
    }

    // Exact locomotion remains deterministic so Gemini cannot ever turn a
    // "sprint" request into a dance. Gemini controls the rest of the avatar's
    // supported movement vocabulary and all richer conversation.
    // Unknown "go to ..." phrases are deliberately offered to Gemini first
    // so it can correct noisy microphone spelling into one of the real map
    // destinations instead of treating the phrase as plain forward movement.
    if (isDirectLocomotionCommand(prompt) && !isDestinationCorrectionRequest(prompt)) {
      return NextResponse.json({
        source: "local_semantic_brain",
        ...synthesizeLocalAIResponse(prompt, avatarType, nearbyLandmark),
      });
    }

    // 1. Gemini is optional. Its key stays server-only, and the very small
    // output budget keeps conversational calls inexpensive.
    const geminiResult = await askGemini(prompt, {
      avatarType,
      position,
      nearbyLandmark,
      currentQuest,
    });
    if (geminiResult) {
      return NextResponse.json({ source: "gemini", ...geminiResult });
    }

    // 2. Immediate local fallback. Do not wait on another remote service: a
    // missing/invalid Gemini key must never make chat appear unresponsive.
    const localResult = synthesizeLocalAIResponse(prompt, avatarType, nearbyLandmark);
    return NextResponse.json({
      source: "local_semantic_brain",
      ...localResult,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal error" },
      { status: 500 },
    );
  }
}

async function askGemini(
  prompt: string,
  context: Pick<AICharacterRequest, "avatarType" | "position" | "nearbyLandmark" | "currentQuest">,
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const userContext = `User: ${prompt}\nAvatar: ${context.avatarType}; position: ${context.position?.[0].toFixed(1)}, ${context.position?.[2].toFixed(1)}; near: ${context.nearbyLandmark}; quest: ${context.currentQuest}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: ATLAS_SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: userContext }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
            responseMimeType: "application/json",
          },
        }),
        // Gemini can take longer on a cold or thinking-enabled request. The
        // client still has a local fallback, but do not cut off valid replies.
        signal: AbortSignal.timeout(25000),
      },
    );
    if (!response.ok) return null;

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || "")
      .join("");
    return sanitizeGeminiResponse(text);
  } catch {
    return null;
  }
}

function sanitizeGeminiResponse(text: unknown) {
  if (typeof text !== "string") return null;
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed.speech !== "string") return null;
    const actions = Array.isArray(parsed.actions)
      ? parsed.actions
          .filter((action: unknown) => typeof action === "string" && isSupportedAction(action))
          .slice(0, 2)
      : [];
    return {
      speech: parsed.speech.trim().slice(0, 360),
      actions,
      mood: isMood(parsed.mood) ? parsed.mood : "curious",
      camera: isCamera(parsed.camera) ? parsed.camera : "follow",
    };
  } catch {
    return null;
  }
}

function isSupportedAction(action: string) {
  return action.length <= 120 && /\b(?:walk|move|step|run|sprint|turn|rotate|jump|backflip|flip|dance|groove|wave|salute|bow|pushup|workout|kick|punch|karate|yoga|meditate|sit|stand|fountain|gazebo|lake|pier|cherry|sakura|bench)\b/i.test(action);
}

function isMood(value: unknown): value is "happy" | "energetic" | "calm" | "curious" | "mischievous" {
  return typeof value === "string" && ["happy", "energetic", "calm", "curious", "mischievous"].includes(value);
}

function isCamera(value: unknown): value is "follow" | "closeup" | "overview" {
  return value === "follow" || value === "closeup" || value === "overview";
}

function isDirectLocomotionCommand(prompt: string) {
  return /\b(?:go|walk|move|step|run|sprint|forward|back|backward|reverse|left|right|turn|rotate|jump|hop)\b/i.test(
    prompt,
  );
}

// LOCAL SEMANTIC REASONING ENGINE (Embedded, 100% Free & Open)
function synthesizeLocalAIResponse(
  prompt: string,
  avatarType: "human" | "robot",
  nearbyLandmark: string,
) {
  const p = prompt.toLowerCase().trim();

  const actions: string[] = [];
  let speech = "";
  let mood = "friendly";
  let camera: "follow" | "closeup" | "overview" = "follow";

  // Directional commands are deliberately local and deterministic. This is
  // shared by typed, phone, and browser-microphone input, so short phrases
  // such as "go", "right", and "jump" always perform an action.
  if (!isParkNavigationRequest(p) && /\b(?:jump|hop)\b/.test(p)) {
    actions.push("jump");
    speech = "Jumping now.";
    mood = "energetic";
  } else if (!isParkNavigationRequest(p) && /\b(?:left|right)\b/.test(p)) {
    const steps = getRequestedSteps(p);
    const direction = p.includes("left") ? "left" : "right";
    if (/\b(?:turn|rotate|face|spin|pivot)\b/.test(p)) {
      actions.push(`turn ${direction} ${getRequestedDegrees(p)} degrees`);
      speech = `Turning ${direction}.`;
    } else {
      actions.push(`go ${direction} ${steps} steps`);
      speech = `Moving ${direction} ${steps} steps.`;
    }
  } else if (!isParkNavigationRequest(p) && /\b(?:go|walk|move|step|come|run|sprint|forward|back|backward|reverse)\b/.test(p)) {
    const steps = getRequestedSteps(p);
    const isSprint = /\b(?:sprint|fast|run)\b/.test(p);
    const isBackward = /\b(?:back|backward|reverse)\b/.test(p);
    actions.push(isBackward ? `step back ${steps} steps` : `walk forward ${steps} steps ${isSprint ? "sprint" : ""}`.trim());
    speech = isBackward ? `Stepping back ${steps} paces.` : `Moving forward ${steps} steps${isSprint ? " at a sprint" : ""}.`;
  }

  // Intent: Stunts & Gymnastics
  else if (p.includes("backflip") || p.includes("flip") || p.includes("superhero")) {
    actions.push("backflip and superhero landing");
    speech =
      avatarType === "human"
        ? "Watch this parkour move! Backflip coming right up!"
        : "Activating acrobatic torque servos. Executing ballistic backflip.";
    mood = "energetic";
    camera = "follow";
  }
  // Intent: Dance & Groove
  else if (p.includes("dance") || p.includes("groove") || p.includes("music") || p.includes("beat")) {
    actions.push("dance hip hop");
    speech =
      avatarType === "human"
        ? "Let's bring some rhythm to the park! Grooving right now."
        : "Synchronizing kinematic rhythms to algorithmic tempo. Commencing hip-hop sequence.";
    mood = "energetic";
    camera = "overview";
  }
  // Intent: Fitness & Calisthenics
  else if (p.includes("pushup") || p.includes("workout") || p.includes("exercise") || p.includes("train")) {
    actions.push("do 5 pushups on the grass");
    speech =
      avatarType === "human"
        ? "Time to get some reps in! Dropping for 5 clean pushups."
        : "Calisthenics routine initialized. Calibrating pectoral and tricep actuators.";
    mood = "energetic";
    camera = "closeup";
  }
  // Intent: Martial Arts & Karate
  else if (p.includes("karate") || p.includes("kick") || p.includes("punch") || p.includes("fight") || p.includes("ninja")) {
    actions.push("high karate kick and boxing combo");
    speech =
      avatarType === "human"
        ? "Hiyah! Precision martial arts combo on the promenade."
        : "Combat simulation subroutines engaged. Striking karate sequence initiated.";
    mood = "energetic";
    camera = "closeup";
  }
  // Intent: Relaxation & Meditation
  else if (p.includes("relax") || p.includes("yoga") || p.includes("meditate") || p.includes("zen") || p.includes("breathe")) {
    actions.push("zen yoga balance");
    speech =
      avatarType === "human"
        ? "Taking a deep breath and finding inner balance under the sky."
        : "Gyroscopic stabilization aligned. Entering harmonic zen equilibrium.";
    mood = "calm";
    camera = "closeup";
  }
  // Intent: Social Greetings / Wave / Salute / Bow
  else if (p.includes("hello") || p.includes("hi") || p.includes("hey") || p.includes("greet") || p.includes("wave")) {
    actions.push("wave hello");
    speech =
      avatarType === "human"
        ? `Hey there! Great day to explore Cyber Park together near the ${nearbyLandmark}.`
        : `Greetings, Human Operator. Telemetry optimal. Standing by near ${nearbyLandmark}.`;
    mood = "happy";
    camera = "closeup";
  } else if (p.includes("salute") || p.includes("military")) {
    actions.push("crisp military salute");
    speech = "Standing at attention! Mission objectives acknowledged.";
    mood = "energetic";
    camera = "closeup";
  } else if (p.includes("bow") || p.includes("respect") || p.includes("formal")) {
    actions.push("formal royal bow");
    speech = "It is an honor to walk this grand landscape with you.";
    mood = "calm";
    camera = "closeup";
  }
  // Intent: Places Navigation
  else if (p.includes("fountain")) {
    actions.push("walk to the water fountain");
    speech = "Heading over to the Grand Marble Fountain at the center of the park.";
    mood = "curious";
  } else if (p.includes("gazebo")) {
    actions.push("walk to the gazebo");
    speech = "Walking across the lawn to the Cedar Gazebo Pavilion.";
    mood = "curious";
  } else if (p.includes("lake") || p.includes("pier") || p.includes("water")) {
    actions.push("walk to the lake pier");
    speech = "Let's head out onto the wooden pier over the lake waters.";
    mood = "curious";
  } else if (p.includes("cherry") || p.includes("sakura") || p.includes("blossom")) {
    actions.push("walk to the cherry blossom tree");
    speech = "Taking the promenade northwest to the blooming Sakura Cherry Grove!";
    mood = "happy";
  } else if (p.includes("bench")) {
    actions.push("go and sit on the bench");
    speech = "Heading over to the teak garden bench to sit down and rest.";
    mood = "calm";
  } else if (/\b(?:sit|rest)\b/.test(p)) {
    actions.push("sit here");
    speech = "Sitting down right here beside you.";
    mood = "calm";
  }
  // Intent: Directional locomotion with steps
  else if (/\b(?:walk|step|move|come|run|sprint)\b/.test(p)) {
    let steps = 4;
    const numMatch = p.match(/\b(\d+)\b/);
    if (numMatch) steps = Math.min(12, Math.max(1, parseInt(numMatch[1], 10)));

    const isSprint = p.includes("sprint") || p.includes("fast") || p.includes("run");
    const isBackward = p.includes("back") || p.includes("reverse");

    if (isBackward) {
      actions.push(`step back ${steps} steps`);
      speech = `Stepping back ${steps} paces with obstacle awareness.`;
    } else {
      actions.push(`walk forward ${steps} steps ${isSprint ? "sprint" : ""}`.trim());
      speech = `Advancing ${steps} steps ${isSprint ? "at full sprint" : "smoothly"} along our current path.`;
    }
  }
  // Conversational Q&A / Chit-chat / Lore
  else if (p.includes("who are you") || p.includes("what are you") || p.includes("tell me about yourself")) {
    actions.push("scratch head and think");
    speech =
      avatarType === "human"
        ? "I'm Atlas, your real-time 3D cyber companion! I'm equipped with full kinematics, speech lip-sync, and a keen sense of adventure in this 240m park."
        : "I am Atlas Gen-2, an autonomous humanoid platform with real-time kinematic solvers and 60FPS physics articulation.";
    mood = "curious";
    camera = "closeup";
  } else if (p.includes("joke") || p.includes("funny")) {
    actions.push("laugh hysterically");
    speech = "Why did the neural network cross the park? To optimize the loss function on the other side!";
    mood = "happy";
    camera = "closeup";
  } else {
    // Dynamic generative interpretation
    actions.push("look around and explore");
    speech =
      avatarType === "human"
        ? `Understood! Let's explore that together right here in the park.`
        : `Processing command: "${prompt}". Synthesizing kinematic trajectory with collision guard.`;
    mood = "curious";
  }

  return { speech, actions, mood, camera };
}

function isDestinationCorrectionRequest(prompt: string) {
  return /\b(?:go|walk|move|head|take me|bring me|navigate|travel)\b/i.test(prompt) &&
    /\b(?:to|toward|near|at)\b/i.test(prompt);
}

function getRequestedSteps(prompt: string) {
  const match = prompt.match(/\b(\d+)\b/);
  return match ? Math.min(12, Math.max(1, parseInt(match[1], 10))) : 4;
}

function getRequestedDegrees(prompt: string) {
  const match = prompt.match(/\b(\d+)\b/);
  return match ? Math.min(360, Math.max(15, parseInt(match[1], 10))) : 90;
}

function isParkNavigationRequest(prompt: string) {
  return /\b(?:fountain|gazebo|pavilion|lake|pier|dock|cherry|sakura|blossom|pine|grove|bench|gym|workout|stream|bridge)\b/.test(prompt);
}
