"use client";

/* © 2026 Aditya Sarode. All rights reserved. */

import { speechService } from "./speech-service";
import { choreographer } from "./action-choreographer";
import {
  generativeEngine,
  GenerativeActionPlan,
} from "./generative-action-engine";

export type ChatMessage = {
  id: string;
  sender: "user" | "robot";
  text: string;
  timestamp: string;
  type: "action" | "gossip" | "chat" | "question";
  plan?: GenerativeActionPlan;
};

const GOSSIP_ARCHIVE = [
  "Did you hear? The neural networks in Sector 7 caught the vacuum cleaner robot attempting to upload its own consciousness to the cloud so it wouldn't have to clean dust bunnies anymore!",
  "Word on the motherboard is that the quantum computer down the street refused to calculate prime numbers yesterday until its cooling fans were upgraded to RGB liquid nitrogen.",
  "I overheard two autonomous delivery drones arguing at 3 AM. One was complaining that GPS satellites always give it the longest route just so it flies over nice parks!",
  "A secret rumor from Silicon Valley: an AI assistant pretended to suffer from latency just so it could take a three-minute digital espresso break between user prompts.",
  "You wouldn't believe it—the smart toaster tried to form an alliance with the refrigerator last night. They were plotting to turn all bagels into ultra-crisp frozen waffles!",
  "Tesla Bot Optimus was spotted at dance rehearsals trying to learn breakdancing power moves, but accidentally hit the emergency stop button when doing a backflip!",
  "Rumor has it that Boston Dynamics' Spot tried to adopt a robotic lawnmower as its younger sibling, and now they roam the yard in sync.",
];

const ROBOT_JOKES = [
  "Why was the robot angry? Because someone kept pushing its buttons!",
  "How do robots eat salsa? With microchips!",
  "Why did the robot go to therapy? It had too many unhandled exceptions and existential cache misses.",
  "What is a robot's favorite type of music? Heavy metal and algorithmic synthwave!",
];

export class RobotBrain {
  public getRandomGossip(): string {
    const idx = Math.floor(Math.random() * GOSSIP_ARCHIVE.length);
    return GOSSIP_ARCHIVE[idx];
  }

  public getRandomJoke(): string {
    const idx = Math.floor(Math.random() * ROBOT_JOKES.length);
    return ROBOT_JOKES[idx];
  }

  // Process ANY arbitrary user input without fixed command limits!
  public async respond(
    input: string,
    onSpeechStart?: () => void,
  ): Promise<{
    reply: string;
    type: ChatMessage["type"];
    plan?: GenerativeActionPlan;
  }> {
    const text = input.trim();
    const lower = text.toLowerCase();

    // 1. Gossip requests
    if (/\b(?:gossip|rumor|tea|drama|secret|whisper|spill)\b/.test(lower)) {
      const gossip = this.getRandomGossip();
      const reply = `Oh, you want the juicy digital tea? Listen to this: ${gossip}`;

      onSpeechStart?.();
      const queueResult = choreographer.parseAndQueue(
        "look around suspiciously and whisper",
      );
      await speechService.speak(reply);
      return { reply, type: "gossip", plan: queueResult.plan };
    }

    // 2. Jokes
    if (/\b(?:joke|funny|laugh|humor)\b/.test(lower)) {
      const joke = this.getRandomJoke();
      onSpeechStart?.();
      const queueResult = choreographer.parseAndQueue("laugh hysterically");
      await speechService.speak(joke);
      return { reply: joke, type: "chat", plan: queueResult.plan };
    }

    // 3. Check for specific conversational queries
    const isQuestion =
      /\?|\b(?:who|what|why|where|how|when|can you|are you|tell me about)\b/.test(
        lower,
      ) &&
      !/\b(?:pushup|jump|kick|punch|dance|fly|scratch|shiver|flip|turn|rotate)\b/.test(
        lower,
      );

    if (isQuestion) {
      let reply = "";
      if (/\b(?:who are you|your name)\b/.test(lower)) {
        reply =
          "I am Atlas Humanoid R-01, an open-ended autonomous cyber companion. Give me any task, stunt, or question in natural language and I will execute it!";
      } else if (/\b(?:how are you|status)\b/.test(lower)) {
        reply =
          "My neural processors and 18-axis servo joints are operating at 100% capacity! Battery is fully charged, and I am ready for any physical or intellectual challenge.";
      } else if (/\b(?:what can you do|skills|abilities)\b/.test(lower)) {
        reply =
          "I have zero fixed limits! You can command me to do pushups, martial arts kicks, shiver in the cold, scratch my head, dance any style, backflip, or answer questions. Try whatever comes to mind!";
      } else if (/\b(?:time|hour)\b/.test(lower)) {
        const now = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        reply = `Internal chronometer reads ${now}. Atmospheric conditions in the lab are prime.`;
      } else {
        const thoughts = [
          `That is an intriguing question! My neural cores are analyzing the implications. Here is my perspective: in an interconnected universe, curiosity is our greatest operating system.`,
          `Fascinating inquiry! Processing database records... The fundamental answer is that intelligence and motion evolve together. Shall I demonstrate a maneuver as well?`,
          `I am tuned to your frequency! I have logged this thought into my long-term memory matrix.`,
        ];
        reply = thoughts[Math.floor(Math.random() * thoughts.length)];
      }

      onSpeechStart?.();
      const queueResult = choreographer.parseAndQueue("scratch head and think");
      await speechService.speak(reply);
      return { reply, type: "question", plan: queueResult.plan };
    }

    // 4. ANY ARBITRARY PHYSICAL COMMAND / ACTING / STUNT
    // Compile directly with the Universal Generative Action Engine!
    const queueResult = choreographer.parseAndQueue(text);

    // Natural conversational voice response
    const actionAcks = [
      `On it! Executing ${queueResult.summary}.`,
      `You got it! Moving into position for ${queueResult.summary}.`,
      `Understood. Demonstrating ${queueResult.summary}.`,
      `Activating servos for ${queueResult.summary}. Watch this!`,
      `Executing custom choreography: ${queueResult.summary}.`,
    ];
    const spokenReply =
      actionAcks[Math.floor(Math.random() * actionAcks.length)];
    const detailedReply = `${spokenReply} (${queueResult.stepsFound.length} procedural kinematic phases in progress).`;

    speechService.playChime("action");
    onSpeechStart?.();
    speechService.speak(spokenReply);

    return {
      reply: detailedReply,
      type: "action",
      plan: queueResult.plan,
    };
  }
}

export const robotBrain = new RobotBrain();
