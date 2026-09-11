"use client";

/* © 2026 Aditya Sarode. All rights reserved. */

import { speechService } from "./speech-service";
import { choreographer } from "./action-choreographer";
import { generativeEngine, GenerativeActionPlan } from "./generative-action-engine";

// Browser speech recognition commonly returns small phonetic variations. Keep
// this deterministic and conservative so voice commands have the same meaning
// as their typed equivalents.
export function normalizeAtlasCommand(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[.,!?]+/g, " ")
    .replace(/\bback\s*(?:word|war|ward|wards)\b/g, "backward")
    .replace(/\bfore\s*(?:word|ward|wards)\b/g, "forward")
    .replace(/\bturn\s+write\b/g, "turn right")
    .replace(/\bgo\s+write\b/g, "go right")
    .replace(/\bturn\s+lift\b/g, "turn left")
    .replace(/\bgo\s+lift\b/g, "go left")
    .replace(/\bback\s+flip\b/g, "backflip")
    .replace(/\bfront\s+flip\b/g, "frontflip")
    .replace(/\b(?:dancing|dancer|dense|dens)\b/g, "dance")
    .replace(/\b(?:ran|running|jog(?:ging)?|dash(?:ing)?|rush(?:ing)?|hurry(?:ing)?)\b/g, "sprint")
    .replace(/\bspeed\s*up\b/g, "sprint")
    .replace(/\b(?:go|walk|move|step)\s+fast\b/g, "sprint forward")
    .replace(/\bsprint(?:ing)?\s+forward\b/g, "sprint forward")
    .replace(/\s+/g, " ")
    .trim();
  return correctLandmarkWords(normalized);
}

const LANDMARK_WORDS = [
  "fountain", "gazebo", "pavilion", "lake", "pier", "dock", "sakura",
  "cherry", "blossom", "pine", "grove", "gym", "workout", "willow",
  "stream", "bridge", "bench",
];

function editDistance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const saved = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = saved;
    }
  }
  return row[b.length];
}

// Correct individual landmark words without changing ordinary conversation.
// Example: "walk to fountin" -> "walk to fountain".
function correctLandmarkWords(command: string) {
  return command.replace(/\b[a-z]{4,}\b/g, (word) => {
    if (LANDMARK_WORDS.includes(word)) return word;
    let match = "";
    let bestDistance = Infinity;
    for (const candidate of LANDMARK_WORDS) {
      const distance = editDistance(word, candidate);
      if (distance < bestDistance) {
        match = candidate;
        bestDistance = distance;
      }
    }
    const threshold = word.length >= 7 ? 2 : 1;
    return bestDistance <= threshold ? match : word;
  });
}

function isDestinationRequest(command: string) {
  return /\b(?:go|walk|move|head|take me|bring me|navigate|travel)\b/.test(command) &&
    /\b(?:to|toward|near|at)\b/.test(command);
}

function hasKnownLandmark(command: string) {
  return new RegExp(`\\b(?:${LANDMARK_WORDS.join("|")})\\b`).test(command);
}

export type AICharacterResponse = {
  reply: string;
  source: "gemini" | "free_open_source_model" | "local_semantic_brain";
  mood?: string;
  camera?: "follow" | "closeup" | "overview";
  actions: string[];
  plan?: GenerativeActionPlan;
};

export class AIBrain {
  private isProcessing = false;

  public async thinkAndAct(
    prompt: string,
    context: {
      avatarType: "human" | "robot";
      position: [number, number, number];
      yaw: number;
      nearbyLandmark?: string;
      currentQuest?: string;
    },
    onSpeechStart?: () => void,
  ): Promise<AICharacterResponse> {
    if (this.isProcessing) {
      return {
        reply: "Give me one moment, I'm finishing up my previous move!",
        source: "local_semantic_brain",
        actions: [],
      };
    }

    this.isProcessing = true;
    const command = normalizeAtlasCommand(prompt);

    try {
      // Physical controls must never wait for an AI provider. This path is
      // used by microphone, phone bridge, and typed input alike, so a spoken
      // "backflip", "go forward", or "jump" always reaches the choreographer
      // immediately even when the network is slow or unavailable.
      // A destination phrase with no locally recognized landmark is sent to
      // Gemini first for semantic/spelling correction. Never interpret it as
      // a generic "go forward" command.
      const immediateReply = isDestinationRequest(command) && !hasKnownLandmark(command)
        ? null
        : this.getImmediateCommandReply(command);
      if (immediateReply) {
        const result = choreographer.parseAndQueue(command);
        onSpeechStart?.();
        speechService.stopSpeaking();
        await speechService.speak(immediateReply);
        return {
          reply: immediateReply,
          source: "local_semantic_brain",
          mood: "energetic",
          camera: "follow",
          actions: result.stepsFound,
          plan: result.plan,
        };
      }

      let aiResult: {
        source: "gemini" | "free_open_source_model" | "local_semantic_brain";
        speech: string;
        actions: string[];
        mood?: string;
        camera?: "follow" | "closeup" | "overview";
      };

      try {
        const res = await fetch("/api/ai-character", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Never leave the command bar waiting forever when an upstream AI
          // provider is unavailable. The local planner below remains usable.
          // Must exceed the server-side provider allowance so the route can
          // return either Gemini's structured answer or its local fallback.
          signal: AbortSignal.timeout(30000),
          body: JSON.stringify({
            prompt: command,
            avatarType: context.avatarType,
            position: context.position,
            yaw: context.yaw,
            nearbyLandmark: context.nearbyLandmark,
            currentQuest: context.currentQuest,
          }),
        });

        if (res.ok) {
          aiResult = await res.json();
        } else {
          throw new Error("API returned non-200 status");
        }
      } catch {
        // High-grade embedded client-side fallback
        aiResult = this.clientFallbackReasoning(command, context.avatarType, context.nearbyLandmark || "Grand Plaza");
      }

      // Execute speech and synchronized lips
      onSpeechStart?.();
      speechService.stopSpeaking();

      // Trigger action choreography
      let generatedPlan: GenerativeActionPlan | undefined;
      if (aiResult.actions && aiResult.actions.length > 0) {
        for (const act of aiResult.actions) {
          const res = choreographer.parseAndQueue(act);
          if (res?.plan) generatedPlan = res.plan;
        }
      }

      // Speak response verbally with viseme lip sync
      if (aiResult.speech) {
        // Waiting here is intentional: hands-free mode must not re-open the
        // microphone until the reply has finished, or it hears itself.
        await speechService.speak(aiResult.speech);
      }

      return {
        reply: aiResult.speech,
        source: aiResult.source,
        mood: aiResult.mood,
        camera: aiResult.camera,
        actions: aiResult.actions,
        plan: generatedPlan,
      };
    } finally {
      this.isProcessing = false;
    }
  }

  private getImmediateCommandReply(prompt: string): string | null {
    const text = prompt.toLowerCase().trim();
    if (!text) return null;

    if (/\b(?:backflip|back flip)\b/.test(text)) return "Backflip sequence engaged.";
    if (/\b(?:frontflip|front flip|somersault|cartwheel)\b/.test(text)) return "Acrobatic sequence engaged.";
    if (/\b(?:jump|leap|hop|bounce)\b/.test(text)) return "Jumping now.";
    if (/\b(?:dance|groove|moonwalk|shuffle|salsa|disco|boogie)\b/.test(text)) return "Starting the dance routine.";
    if (/\b(?:go|walk|move|step|run|sprint|forward|back|backward|reverse|left|right|turn|rotate|strafe)\b/.test(text)) {
      return /\b(?:run|sprint)\b/.test(text) ? "Sprinting now." : "Moving now.";
    }
    if (/\b(?:fountain|gazebo|pavilion|lake|pier|dock|cherry|sakura|pine|grove|bench|gym|workout|stream|bridge)\b/.test(text)) {
      return "Navigating there now.";
    }
    if (/\b(?:sit|stand|salute|wave|bow|pushup|karate|kick|punch|yoga)\b/.test(text)) {
      return "Executing that action now.";
    }
    return null;
  }

  // Client-side local neural fallback reasoning
  private clientFallbackReasoning(
    prompt: string,
    avatarType: "human" | "robot",
    nearbyLandmark: string,
  ) {
    const p = prompt.toLowerCase().trim();
    const actions: string[] = [];
    let speech = "";
    let mood = "friendly";
    let camera: "follow" | "closeup" | "overview" = "follow";

    const isPlaceRequest = /\b(?:fountain|gazebo|pavilion|lake|pier|dock|cherry|sakura|blossom|pine|grove|bench|gym|workout|stream|bridge)\b/.test(p);
    const countMatch = p.match(/\b(\d+)\b/);
    const steps = countMatch ? Math.min(12, Math.max(1, parseInt(countMatch[1], 10))) : 4;

    // Keep the offline fallback just as dependable as the API route. Voice
    // control must still work if the network request is unavailable.
    if (!isPlaceRequest && /\b(?:jump|hop)\b/.test(p)) {
      actions.push("jump");
      speech = "Jumping now.";
      mood = "energetic";
    } else if (!isPlaceRequest && /\b(?:left|right)\b/.test(p)) {
      const direction = p.includes("left") ? "left" : "right";
      if (/\b(?:turn|rotate|face|spin|pivot)\b/.test(p)) {
        const degrees = countMatch ? Math.min(360, Math.max(15, parseInt(countMatch[1], 10))) : 90;
        actions.push(`turn ${direction} ${degrees} degrees`);
        speech = `Turning ${direction}.`;
      } else {
        actions.push(`go ${direction} ${steps} steps`);
        speech = `Moving ${direction} ${steps} steps.`;
      }
    } else if (!isPlaceRequest && /\b(?:go|walk|move|step|come|run|sprint|forward|back|backward|reverse)\b/.test(p)) {
      const isSprint = /\b(?:sprint|fast|run)\b/.test(p);
      const isBackward = /\b(?:back|backward|reverse)\b/.test(p);
      actions.push(isBackward ? `step back ${steps} steps` : `walk forward ${steps} steps ${isSprint ? "sprint" : ""}`.trim());
      speech = isBackward ? `Stepping back ${steps} paces.` : `Moving forward ${steps} steps${isSprint ? " at a sprint" : ""}.`;
    }

    else if (p.includes("backflip") || p.includes("flip") || p.includes("superhero")) {
      actions.push("backflip and superhero landing");
      speech = avatarType === "human" ? "Watch this flip! Sticking the superhero landing." : "Ballistic torque actuators engaged. Flip executed.";
      mood = "energetic";
    } else if (p.includes("dance") || p.includes("groove")) {
      actions.push("dance hip hop");
      speech = avatarType === "human" ? "Let's turn up the vibe in Cyber Park!" : "Kinematic rhythm routines initialized.";
      mood = "energetic";
      camera = "overview";
    } else if (p.includes("pushup") || p.includes("workout")) {
      actions.push("do 5 pushups on the grass");
      speech = "Dropping for 5 reps right on the lawn!";
      mood = "energetic";
      camera = "closeup";
    } else if (p.includes("karate") || p.includes("kick") || p.includes("boxing")) {
      actions.push("high karate kick and boxing combo");
      speech = "Precision martial arts combo!";
      mood = "energetic";
      camera = "closeup";
    } else if (p.includes("yoga") || p.includes("zen") || p.includes("balance")) {
      actions.push("zen yoga balance");
      speech = "Centering balance and peace under the open sky.";
      mood = "calm";
      camera = "closeup";
    } else if (p.includes("wave") || p.includes("hello") || p.includes("hi")) {
      actions.push("wave hello");
      speech = `Hey! Great to explore the park with you near ${nearbyLandmark}.`;
      mood = "happy";
      camera = "closeup";
    } else if (p.includes("salute")) {
      actions.push("crisp military salute");
      speech = "Standing at attention!";
      camera = "closeup";
    } else if (p.includes("fountain")) {
      actions.push("walk to the water fountain");
      speech = "Navigating to the Grand Marble Fountain.";
    } else if (p.includes("gazebo")) {
      actions.push("walk to the gazebo");
      speech = "Heading toward the Cedar Gazebo.";
    } else if (p.includes("lake") || p.includes("pier")) {
      actions.push("walk to the lake pier");
      speech = "Walking out onto the lakeside boardwalk.";
    } else if (p.includes("cherry") || p.includes("sakura")) {
      actions.push("walk to the cherry blossom tree");
      speech = "Journeying to the blooming Sakura Cherry Grove!";
    } else if (p.includes("bench")) {
      actions.push("go and sit on the bench");
      speech = "Heading over to the bench to relax.";
      mood = "calm";
    } else if (/\b(?:sit|rest)\b/.test(p)) {
      actions.push("sit here");
      speech = "Sitting down right here beside you.";
      mood = "calm";
    } else if (/\b(?:walk|step|move|come|run|sprint)\b/.test(p)) {
      let steps = 4;
      const numMatch = p.match(/\b(\d+)\b/);
      if (numMatch) steps = Math.min(12, Math.max(1, parseInt(numMatch[1], 10)));
      const isSprint = p.includes("sprint") || p.includes("fast") || p.includes("run");
      const isBackward = p.includes("back");

      if (isBackward) {
        actions.push(`step back ${steps} steps`);
        speech = `Stepping back ${steps} paces with collision check.`;
      } else {
        actions.push(`walk forward ${steps} steps ${isSprint ? "sprint" : ""}`.trim());
        speech = `Walking ${steps} steps ${isSprint ? "sprint" : "smoothly"}.`;
      }
    } else {
      actions.push("look around and explore");
      speech = avatarType === "human" ? `On it! Exploring "${prompt}".` : `Subroutine parsed: "${prompt}". Trajectory compiled.`;
    }

    return {
      source: "local_semantic_brain" as const,
      speech,
      actions,
      mood,
      camera,
    };
  }
}

export const aiBrain = new AIBrain();
