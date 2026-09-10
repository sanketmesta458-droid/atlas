"use client";

/* © 2026 Aditya Sarode. All rights reserved. */

import { speechService } from "./speech-service";
import { choreographer } from "./action-choreographer";
import { generativeEngine, GenerativeActionPlan } from "./generative-action-engine";

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

    try {
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
            prompt,
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
        aiResult = this.clientFallbackReasoning(prompt, context.avatarType, context.nearbyLandmark || "Grand Plaza");
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

    if (p.includes("backflip") || p.includes("flip") || p.includes("superhero")) {
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
