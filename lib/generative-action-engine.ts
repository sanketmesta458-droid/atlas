"use client";

/* © 2026 Aditya Sarode. All rights reserved. */

import { ActionStep, RobotJointState } from "./action-choreographer";

export type KinematicPhase = {
  name: string;
  description: string;
  duration: number;
  evaluate: (
    progress: number,
    baseYaw: number,
    cycleTime: number,
  ) => Partial<RobotJointState>;
};

export type GenerativeActionPlan = {
  rawPrompt: string;
  intent: string;
  inferredEmotion: string;
  phases: KinematicPhase[];
  narration: string;
};

// Universal Semantic Motion Compiler
export class GenerativeActionEngine {
  public compile(prompt: string): GenerativeActionPlan {
    const raw = prompt.trim();
    const lower = raw.toLowerCase();

    // Break into sequential sub-clauses if connected by "and", "then", "after", etc.
    const clauses = lower
      .split(/\b(?:then|and then|after that|next|followed by)\b/)
      .map((c) => c.trim())
      .filter(Boolean);

    const compiledPhases: KinematicPhase[] = [];
    let inferredEmotion = "curious";
    let narrationText = "";

    for (let i = 0; i < clauses.length; i++) {
      const clause = clauses[i];
      const phase = this.synthesizeClause(clause, i, clauses.length);
      compiledPhases.push(...phase.phases);
      if (phase.emotion) inferredEmotion = phase.emotion;
    }

    if (compiledPhases.length === 0) {
      // Fallback: Generative abstract interpretation
      const fallback = this.synthesizeAbstract(raw);
      compiledPhases.push(...fallback.phases);
      inferredEmotion = fallback.emotion;
    }

    narrationText = `Synthesized ${compiledPhases.length} custom kinematic phases for: "${raw}". Emotion matrix: ${inferredEmotion}.`;

    return {
      rawPrompt: raw,
      intent: compiledPhases.map((p) => p.name).join(" → "),
      inferredEmotion,
      phases: compiledPhases,
      narration: narrationText,
    };
  }

  private synthesizeClause(
    clause: string,
    index: number,
    total: number,
  ): { phases: KinematicPhase[]; emotion: string } {
    const phases: KinematicPhase[] = [];
    let emotion = "neutral";

    // Extract repetition counts like "3 times", "5 pushups", "twice"
    let repetitions = 1;
    const repMatch = clause.match(
      /\b(\d+)\s*(?:times|reps|pushups|jumps|hops|kicks|punches)?\b/,
    );
    if (repMatch) {
      repetitions = Math.min(10, Math.max(1, parseInt(repMatch[1], 10)));
    } else if (clause.includes("twice")) repetitions = 2;
    else if (clause.includes("thrice") || clause.includes("three times"))
      repetitions = 3;

    // 1. PUSHUPS / PLANK / BURPEE
    if (/\b(?:pushup|push up|push-up|plank|burpee|press up)\b/.test(clause)) {
      emotion = "focused";
      for (let r = 1; r <= repetitions; r++) {
        phases.push({
          name: `Pushup Repetition ${r}/${repetitions}`,
          description:
            "Lower torso, compress arm servos into deep ground press",
          duration: 1.6,
          evaluate: (p) => {
            const press = Math.sin(p * Math.PI);
            return {
              jumpY: -0.4 * press,
              squat: 0.8 * press,
              torsoPitch: 0.9 * press,
              headPitch: -0.4 * press,
              leftArmPitch: 1.6 * press,
              rightArmPitch: 1.6 * press,
              leftElbow: 1.8 * press,
              rightElbow: 1.8 * press,
              leftKnee: 1.4 * press,
              rightKnee: 1.4 * press,
            };
          },
        });
      }
      return { phases, emotion };
    }

    // 2. KICK / MARTIAL ARTS / NINJA / KARATE
    if (
      /\b(?:kick|karate|ninja|kung fu|martial art|taekwondo)\b/.test(clause)
    ) {
      emotion = "combative";
      const isLeft = clause.includes("left");
      phases.push({
        name: `High Chamber & Kinetic ${isLeft ? "Left" : "Right"} Kick`,
        description: "Torso counter-lean with explosive leg servo extension",
        duration: 1.8,
        evaluate: (p) => {
          const chamber = p < 0.5 ? Math.sin(p * Math.PI) : 1 - (p - 0.5) * 2;
          const kickExtension =
            p >= 0.3 && p <= 0.7 ? Math.sin(((p - 0.3) / 0.4) * Math.PI) : 0;
          return {
            torsoPitch: -0.3 * kickExtension,
            torsoRoll: (isLeft ? 0.35 : -0.35) * kickExtension,
            leftLegPitch: isLeft ? kickExtension * 1.8 : 0,
            rightLegPitch: !isLeft ? kickExtension * 1.8 : 0,
            leftKnee: isLeft ? chamber * 1.5 - kickExtension * 1.2 : 0,
            rightKnee: !isLeft ? chamber * 1.5 - kickExtension * 1.2 : 0,
            leftArmPitch: 0.8,
            rightArmPitch: 0.8,
            leftElbow: 1.2,
            rightElbow: 1.2,
          };
        },
      });
      return { phases, emotion };
    }

    // 3. PUNCH / BOXING / JAB / HOOK / FIGHT
    if (/\b(?:punch|box|boxing|jab|hook|strike|fight)\b/.test(clause)) {
      emotion = "combative";
      phases.push({
        name: "Rapid Boxing Flurry (Jab-Cross-Hook)",
        description: "Alternating high-torque wrist and shoulder thrusts",
        duration: 2.2,
        evaluate: (p) => {
          const lPunch = Math.sin(p * Math.PI * 6);
          const rPunch = Math.cos(p * Math.PI * 6);
          return {
            torsoPitch: 0.15,
            torsoRoll: lPunch * 0.1,
            leftArmPitch: Math.max(0, lPunch * 1.9),
            leftElbow: Math.max(0.1, (1 - lPunch) * 0.8),
            rightArmPitch: Math.max(0, rPunch * 1.9),
            rightElbow: Math.max(0.1, (1 - rPunch) * 0.8),
            headPitch: 0.05,
          };
        },
      });
      return { phases, emotion };
    }

    // 4. SCRATCH HEAD / CONFUSED / THINK / WONDER / PUZZLED
    if (
      /\b(?:scratch|confuse|think|wonder|puzzle|ponder|curious)\b/.test(clause)
    ) {
      emotion = "confused";
      phases.push({
        name: "Head Scratch & Puzzled Diagnostic",
        description:
          "Right hand articulates to temple with perplexed head tilt",
        duration: 2.6,
        evaluate: (p) => {
          const reach = Math.sin(p * Math.PI);
          const scratch = Math.sin(p * Math.PI * 8) * 0.15 * reach;
          return {
            headRoll: 0.35 * reach,
            headPitch: 0.15 * reach,
            headYaw: Math.sin(p * Math.PI * 2) * 0.25,
            rightArmPitch: 2.2 * reach,
            rightArmRoll: -0.4 * reach,
            rightElbow: 1.8 * reach + scratch,
            rightHandRotate: scratch * 2,
            leftArmPitch: 0.2,
            leftArmRoll: 0.1,
          };
        },
      });
      return { phases, emotion };
    }

    // 5. SHIVER / COLD / FREEZE / SHAKE / TREMBLE
    if (
      /\b(?:shiver|cold|freeze|shaking|tremble|vibrate|chilly|ice)\b/.test(
        clause,
      )
    ) {
      emotion = "cold";
      phases.push({
        name: "Sub-Zero Thermal Shivering Routine",
        description:
          "Micro-vibrations across all chassis joints with protective tuck",
        duration: 3.0,
        evaluate: (p, bYaw, t) => {
          const jitter = Math.sin(t * 45) * 0.06;
          const jitterFast = Math.cos(t * 60) * 0.04;
          return {
            squat: 0.25,
            torsoPitch: 0.25 + jitter,
            torsoRoll: jitterFast,
            headPitch: 0.2 + jitter,
            headRoll: jitterFast,
            leftArmPitch: 0.8 + jitter,
            rightArmPitch: 0.8 - jitter,
            leftArmRoll: 0.4,
            rightArmRoll: -0.4,
            leftElbow: 1.6 + jitterFast,
            rightElbow: 1.6 - jitterFast,
          };
        },
      });
      return { phases, emotion };
    }

    // 6. FLY / AIRPLANE / SUPERMAN / GLIDE
    if (
      /\b(?:fly|airplane|plane|superman|glid|glide|soar|wings)\b/.test(clause)
    ) {
      emotion = "heroic";
      phases.push({
        name: "Aerodynamic Flight Configuration",
        description: "Wings outstretched with atmospheric banking simulation",
        duration: 3.5,
        evaluate: (p, bYaw, t) => {
          const bank = Math.sin(t * 2.5) * 0.35;
          return {
            jumpY: 0.4 + Math.sin(t * 3) * 0.15,
            torsoPitch: 0.45,
            torsoRoll: bank,
            headPitch: -0.3,
            leftArmPitch: 0.1,
            rightArmPitch: 0.1,
            leftArmRoll: 1.5,
            rightArmRoll: -1.5,
            leftElbow: 0.05,
            rightElbow: 0.05,
            leftLegPitch: -0.4,
            rightLegPitch: -0.4,
          };
        },
      });
      return { phases, emotion };
    }

    // 7. LAUGH / HYSTERICAL / CHUCKLE / GIGGLE
    if (/\b(?:laugh|hysterical|chuckle|giggle|haha|funny)\b/.test(clause)) {
      emotion = "joyful";
      phases.push({
        name: "Hysterical Joy & Finger Pointing",
        description: "Torso belly laugh oscillation with celebratory gestures",
        duration: 3.0,
        evaluate: (p, bYaw, t) => {
          const laughBurst = Math.sin(t * 18) * 0.12;
          return {
            torsoPitch: -0.15 + laughBurst,
            headPitch: -0.25 + laughBurst * 1.5,
            headRoll: Math.sin(t * 4) * 0.1,
            leftArmPitch: 0.6,
            leftArmRoll: 0.3,
            leftElbow: 1.2,
            rightArmPitch: 1.4,
            rightArmRoll: -0.2,
            rightElbow: 0.2,
            jumpY: Math.max(0, laughBurst * 0.5),
          };
        },
      });
      return { phases, emotion };
    }

    // 8. CRY / SAD / DEPRESSED / WEEP
    if (/\b(?:cry|sad|weep|depress|mourn|sob)\b/.test(clause)) {
      emotion = "sad";
      phases.push({
        name: "Melodramatic Slump & Visor Cover",
        description: "Shoulders slump and hands shield visor in sorrow",
        duration: 3.0,
        evaluate: (p) => {
          const sorrow = Math.sin(p * Math.PI);
          return {
            squat: 0.2 * sorrow,
            torsoPitch: 0.35 * sorrow,
            headPitch: 0.45 * sorrow,
            leftArmPitch: 1.5 * sorrow,
            rightArmPitch: 1.5 * sorrow,
            leftArmRoll: 0.2 * sorrow,
            rightArmRoll: -0.2 * sorrow,
            leftElbow: 1.9 * sorrow,
            rightElbow: 1.9 * sorrow,
          };
        },
      });
      return { phases, emotion };
    }

    // 9. AIR GUITAR / ROCK OUT / HEADBANG / MUSIC SOLO
    if (/\b(?:guitar|rock out|headbang|solo|riff|shred)\b/.test(clause)) {
      emotion = "ecstatic";
      phases.push({
        name: "Cyberpunk Air Guitar Solo & Headbang",
        description:
          "Fast fretting left hand, rapid strumming right wrist, intense headbanging",
        duration: 3.8,
        evaluate: (p, bYaw, t) => {
          const strum = Math.sin(t * 16) * 0.4;
          const headbang = Math.sin(t * 12) * 0.35;
          return {
            squat: 0.3,
            torsoPitch: 0.2 + headbang * 0.3,
            headPitch: headbang,
            leftArmPitch: 1.2,
            leftArmRoll: 0.5,
            leftElbow: 1.4,
            leftHandRotate: Math.sin(t * 8) * 0.8,
            rightArmPitch: 0.8,
            rightArmRoll: -0.2,
            rightElbow: 1.6 + strum,
            rightHandRotate: strum * 2,
            leftLegPitch: 0.3,
            rightLegPitch: -0.2,
          };
        },
      });
      return { phases, emotion };
    }

    // 10. ZOMBIE / THRILLER / MONSTER WALK
    if (/\b(?:zombie|thriller|monster|undead|spooky|creepy)\b/.test(clause)) {
      emotion = "spooky";
      phases.push({
        name: "Thriller Undead Zombie Stride",
        description:
          "Rigid forward reaching arms, cocked head, and limping hip drag",
        duration: 3.5,
        evaluate: (p, bYaw, t) => {
          const limp = Math.sin(t * 4) * 0.2;
          return {
            torsoPitch: 0.18,
            torsoRoll: limp * 0.4,
            headRoll: 0.35,
            headPitch: 0.1,
            leftArmPitch: 1.5,
            rightArmPitch: 1.45,
            leftArmRoll: 0.05,
            rightArmRoll: -0.05,
            leftElbow: 0.1,
            rightElbow: 0.1,
            leftHandRotate: Math.sin(t * 5) * 0.2,
            rightHandRotate: -Math.sin(t * 5) * 0.2,
            leftLegPitch: limp,
            rightLegPitch: -limp,
          };
        },
      });
      return { phases, emotion };
    }

    // 11. YOGA / MEDITATE / ZEN / NAMASTE / TREE POSE
    if (
      /\b(?:yoga|meditate|zen|tree pose|namaste|pray|balance|peace)\b/.test(
        clause,
      )
    ) {
      emotion = "serene";
      phases.push({
        name: "Zen Harmonic Balance Posture",
        description:
          "Palms meeting at chest core with steady single-foot balancing",
        duration: 3.5,
        evaluate: (p) => {
          const balance = Math.sin(p * Math.PI);
          return {
            torsoPitch: 0,
            headPitch: -0.08,
            leftArmPitch: 0.8 * balance,
            rightArmPitch: 0.8 * balance,
            leftArmRoll: 0.4 * balance,
            rightArmRoll: -0.4 * balance,
            leftElbow: 1.6 * balance,
            rightElbow: 1.6 * balance,
            leftLegPitch: 0.4 * balance,
            leftKnee: 1.5 * balance,
          };
        },
      });
      return { phases, emotion };
    }

    // 12. FLIP / BACKFLIP / FRONTFLIP / SOMERSAULT
    if (/\b(?:flip|backflip|frontflip|somersault|cartwheel)\b/.test(clause)) {
      emotion = "acrobatic";
      const isBack = clause.includes("back");
      phases.push({
        name: `Aeroballistic 360° ${isBack ? "Backflip" : "Frontflip"}`,
        description:
          "Full-body aerial rotation with a tucked landing and shockwave",
        duration: 2.2,
        evaluate: (p) => {
          const apex = Math.sin(p * Math.PI);
          const spin = p * Math.PI * 2 * (isBack ? -1 : 1);
          const tuck = Math.sin(p * Math.PI) * 1.25;
          return {
            jumpY: apex * 1.8,
            // Rotate the root group, not just the chest. This produces the
            // visible full 360° backflip/frontflip that the command promises.
            rootPitch: spin,
            torsoPitch: -0.18 * apex,
            headPitch: 0.12 * apex,
            leftArmPitch: 0.45 + apex * 0.8,
            rightArmPitch: 0.45 + apex * 0.8,
            leftElbow: 0.65 + apex * 0.35,
            rightElbow: 0.65 + apex * 0.35,
            leftLegPitch: -0.32 * tuck,
            rightLegPitch: -0.32 * tuck,
            leftKnee: 0.12 + tuck,
            rightKnee: 0.12 + tuck,
            squat: (1 - apex) * 0.4,
            shockwave: p > 0.8 ? (p - 0.8) / 0.2 : 0,
          };
        },
      });
      return { phases, emotion };
    }

    // 13. TURNS WITH ANY ARBITRARY ANGLE (e.g. 45°, 90°, 120°, 270°, 360°)
    if (
      /\b(?:turn|rotate|face|spin|pivot)\b/.test(clause) &&
      !clause.includes("hand") &&
      !clause.includes("arm")
    ) {
      let deg = 90;
      const degMatch = clause.match(/(\d+)\s*(?:deg|degree|degrees)?/);
      if (degMatch) deg = parseInt(degMatch[1], 10);
      else if (clause.includes("180")) deg = 180;
      else if (clause.includes("360")) deg = 360;
      else if (clause.includes("45")) deg = 45;

      const isLeft = clause.includes("left") || clause.includes("counter");
      const rad = ((deg * Math.PI) / 180) * (isLeft ? 1 : -1);

      phases.push({
        name: `Arbitrary Servo Turn: ${deg}° ${isLeft ? "Left" : "Right"}`,
        description: `Smooth PID-controlled yaw rotation by ${deg} degrees`,
        duration: Math.max(0.7, (deg / 120) * 0.8),
        evaluate: (p, bYaw) => {
          const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
          return {
            yaw: bYaw + rad * ease,
            torsoRoll: Math.sin(p * Math.PI) * (isLeft ? 0.08 : -0.08),
          };
        },
      });
      return { phases, emotion: "precise" };
    }

    // 14. JUMP / LEAP / HOP / BOUNCE
    if (/\b(?:jump|leap|hop|bounce|spring)\b/.test(clause)) {
      emotion = "energetic";
      for (let r = 1; r <= repetitions; r++) {
        phases.push({
          name: `Ballistic Aerial Leap ${r}/${repetitions}`,
          description: "High vertical servo launch and shockwave landing",
          duration: 1.4,
          evaluate: (p) => {
            let jumpY = 0,
              squat = 0,
              shock = 0;
            if (p < 0.25) {
              squat = Math.sin((p / 0.25) * Math.PI * 0.5) * 0.4;
            } else if (p < 0.75) {
              const flight = (p - 0.25) / 0.5;
              jumpY = Math.sin(flight * Math.PI) * 1.5;
            } else {
              const land = (p - 0.75) / 0.25;
              squat = (1 - land) * 0.35;
              shock = 1 - land;
            }
            return {
              jumpY,
              squat,
              leftKnee: squat * 1.5,
              rightKnee: squat * 1.5,
              leftArmPitch: jumpY * 1.2,
              rightArmPitch: jumpY * 1.2,
              shockwave: shock,
            };
          },
        });
      }
      return { phases, emotion };
    }

    // 15. DANCE / GROOVE / SALSA / TANGO / MOONWALK / DISCO
    if (
      /\b(?:dance|groove|salsa|tango|disco|moonwalk|breakdance|shuffle|twerk|vogue)\b/.test(
        clause,
      )
    ) {
      emotion = "rhythmic";
      phases.push({
        name: `Generative Choreo Style: ${clause}`,
        description:
          "Eight-count footwork with coordinated arms, wrists, torso, and hip rhythm",
        duration: 6.4,
        evaluate: (p, bYaw, t) => {
          // Eight-count choreography: alternating knees establish the footwork,
          // while the shoulders, elbows, and wrists hit opposite accents.
          const beat = Math.sin(t * 7.2);
          const accent = Math.sin(t * 3.6);
          const leftStep = Math.max(0, Math.sin(t * 7.2));
          const rightStep = Math.max(0, -Math.sin(t * 7.2));
          const armSweep = Math.sin(t * 3.6);
          return {
            jumpY: Math.max(0, accent) * 0.09,
            torsoPitch: 0.05 + Math.abs(beat) * 0.1,
            torsoRoll: beat * 0.18,
            torsoYaw: armSweep * 0.2,
            headRoll: -beat * 0.12,
            headYaw: armSweep * 0.16,
            leftArmPitch: 0.65 + armSweep * 0.95,
            rightArmPitch: 0.65 - armSweep * 0.95,
            leftArmRoll: 0.2 + rightStep * 0.45,
            rightArmRoll: 0.2 + leftStep * 0.45,
            leftElbow: 0.35 + rightStep * 0.85,
            rightElbow: 0.35 + leftStep * 0.85,
            leftHandRotate: t * 5.5 + armSweep * 0.8,
            rightHandRotate: -t * 5.5 - armSweep * 0.8,
            leftLegPitch: leftStep * 0.62 - rightStep * 0.26,
            rightLegPitch: rightStep * 0.62 - leftStep * 0.26,
            leftKnee: leftStep * 0.75 + rightStep * 0.12,
            rightKnee: rightStep * 0.75 + leftStep * 0.12,
          };
        },
      });
      return { phases, emotion };
    }

    // 16. HAND/ARM ROTATE OR SPIN
    if (
      /\b(?:hand|arm|wrist)\b.*\b(?:rotate|spin|twirl|roll)\b|\b(?:rotate|spin|twirl)\b.*\b(?:hand|arm|wrist)\b/.test(
        clause,
      )
    ) {
      phases.push({
        name: "360° Hand Servo Rotation Calibration",
        description: "High velocity multi-axis wrist spin",
        duration: 1.6,
        evaluate: (p) => ({
          leftArmPitch: 1.2,
          rightArmPitch: 1.2,
          leftHandRotate: p * Math.PI * 4,
          rightHandRotate: -p * Math.PI * 4,
        }),
      });
      return { phases, emotion: "calibrated" };
    }

    // 18. BOW / RESPECT / CURTSEY / HONOR
    if (/\b(?:bow|curtsey|respect|honor|formal)\b/.test(clause)) {
      phases.push({
        name: "Formal Royal Cyber Bow",
        description: "Deep torso bend at waist with arm folded across chest",
        duration: 2.8,
        evaluate: (p) => {
          const bend = Math.sin(p * Math.PI);
          return {
            torsoPitch: 0.7 * bend,
            headPitch: 0.3 * bend,
            rightArmPitch: 1.1 * bend,
            rightArmRoll: -0.4 * bend,
            rightElbow: 1.4 * bend,
            leftArmPitch: 0.1,
            leftArmRoll: 0.1,
          };
        },
      });
      return { phases, emotion: "respectful" };
    }

    // 19. SALUTE / MILITARY / GUARD
    if (/\b(?:salute|soldier|guard|drill|attention)\b/.test(clause)) {
      phases.push({
        name: "Crisp Military Protocol Salute",
        description: "Right hand snaps up to forehead edge with locked spine",
        duration: 2.4,
        evaluate: (p) => {
          const snap =
            p < 0.25 ? p / 0.25 : p < 0.75 ? 1 : 1 - (p - 0.75) / 0.25;
          return {
            torsoPitch: -0.05 * snap,
            headPitch: 0.05 * snap,
            rightArmPitch: 1.9 * snap,
            rightArmRoll: -0.65 * snap,
            rightElbow: 2.0 * snap,
            leftArmPitch: -0.05,
            leftArmRoll: 0.05,
          };
        },
      });
      return { phases, emotion: "disciplined" };
    }

    // 20. CLAP / APPLAUD / BRAVO / CHEER
    if (/\b(?:clap|applaud|applause|bravo|cheer|congratulate)\b/.test(clause)) {
      phases.push({
        name: "Enthusiastic Rhythmic Clapping",
        description:
          "Rapid palm strikes at chest level with celebratory bounce",
        duration: 2.8,
        evaluate: (p, bYaw, t) => {
          const clap = Math.sin(t * 14) * 0.35;
          return {
            torsoPitch: 0.05,
            headPitch: -0.1,
            leftArmPitch: 0.9,
            rightArmPitch: 0.9,
            leftArmRoll: -clap,
            rightArmRoll: clap,
            leftElbow: 1.5,
            rightElbow: 1.5,
            jumpY: Math.max(0, Math.sin(t * 14) * 0.06),
          };
        },
      });
      return { phases, emotion: "celebratory" };
    }

    // 21. THUMBS UP / APPROVE / GREAT / OKAY
    if (
      /\b(?:thumbs up|approve|great job|nice|awesome|good job|super)\b/.test(
        clause,
      )
    ) {
      phases.push({
        name: "Prominent Dual Thumbs Up",
        description: "Both forearms elevated with thumbs extended forward",
        duration: 2.4,
        evaluate: (p) => {
          const reach = Math.sin(p * Math.PI);
          return {
            torsoPitch: -0.06 * reach,
            headPitch: -0.1 * reach,
            leftArmPitch: 1.2 * reach,
            rightArmPitch: 1.2 * reach,
            leftElbow: 1.4 * reach,
            rightElbow: 1.4 * reach,
            leftHandRotate: 1.57 * reach,
            rightHandRotate: -1.57 * reach,
          };
        },
      });
      return { phases, emotion: "supportive" };
    }

    // 22. SUPERHERO LANDING / IRON MAN IMPACT
    if (
      /\b(?:superhero|hero landing|iron man|impact landing|smash)\b/.test(
        clause,
      )
    ) {
      phases.push({
        name: "Three-Point Superhero Impact Landing",
        description:
          "One knee down, right fist ground strike, head slowly rising",
        duration: 3.2,
        evaluate: (p) => {
          let pose = 0;
          if (p < 0.3) pose = p / 0.3;
          else if (p < 0.75) pose = 1;
          else pose = 1 - (p - 0.75) / 0.25;

          return {
            squat: 0.75 * pose,
            torsoPitch: 0.65 * pose,
            headPitch: (p > 0.4 ? -0.2 : 0.4) * pose,
            rightArmPitch: 1.8 * pose,
            rightElbow: 0.4 * pose,
            leftArmPitch: -0.3 * pose,
            leftArmRoll: 0.5 * pose,
            rightKnee: 1.6 * pose,
            leftKnee: 1.1 * pose,
            shockwave: p > 0.25 && p < 0.6 ? 1 - (p - 0.25) / 0.35 : 0,
          };
        },
      });
      return { phases, emotion: "heroic" };
    }

    // 23. CROUCH / SNEAK / STEALTH / DUCK
    if (/\b(?:crouch|sneak|stealth|duck|low|hide|ninja)\b/.test(clause)) {
      phases.push({
        name: "Low-Profile Stealth Crouch",
        description: "Deep chassis compression and scanning eyes",
        duration: 3.0,
        evaluate: (p, bYaw, t) => {
          const scan = Math.sin(t * 3) * 0.3;
          return {
            squat: 0.55,
            torsoPitch: 0.3,
            headYaw: scan,
            headPitch: -0.1,
            leftArmPitch: 0.6,
            rightArmPitch: 0.6,
            leftElbow: 1.2,
            rightElbow: 1.2,
            leftKnee: 1.3,
            rightKnee: 1.3,
          };
        },
      });
      return { phases, emotion: "stealthy" };
    }

    // 24. SCAN / LOOK AROUND / SEARCH / INSPECT
    if (/\b(?:scan|look around|search|inspect|explore|watch)\b/.test(clause)) {
      phases.push({
        name: "Wide-Spectrum Park LIDAR Scan",
        description:
          "Smooth panoramic head yaw rotation with shaded hand visor",
        duration: 3.4,
        evaluate: (p) => {
          const look = Math.sin(p * Math.PI * 2) * 0.75;
          return {
            headYaw: look,
            headPitch: 0.1 * Math.cos(p * Math.PI * 2),
            rightArmPitch: 1.6,
            rightArmRoll: -0.3,
            rightElbow: 1.8,
            leftArmPitch: 0.2,
          };
        },
      });
      return { phases, emotion: "observant" };
    }

    // 25. SQUATS / CALISTHENICS / LEGS
    if (/\b(?:squat|squats|calisthenic|workout|leg day)\b/.test(clause)) {
      phases.push({
        name: "Deep Kinetic Power Squat",
        description:
          "Full 90° knee actuation with forward counter-balance arms",
        duration: 2.8,
        evaluate: (p) => {
          const dip = Math.sin(p * Math.PI);
          return {
            squat: 0.7 * dip,
            torsoPitch: 0.25 * dip,
            leftArmPitch: 1.3 * dip,
            rightArmPitch: 1.3 * dip,
            leftKnee: 1.5 * dip,
            rightKnee: 1.5 * dip,
          };
        },
      });
      return { phases, emotion: "athletic" };
    }

    return { phases, emotion };
  }

  // Generative abstract interpreter for novel, unexpected, or creative prompts
  private synthesizeAbstract(prompt: string): {
    phases: KinematicPhase[];
    emotion: string;
  } {
    const phases: KinematicPhase[] = [];
    const hash = Array.from(prompt).reduce(
      (acc, char) => acc + char.charCodeAt(0),
      0,
    );
    const rhythmFreq = 4 + (hash % 8);
    const armAmplitude = 0.5 + ((hash % 10) / 10) * 1.2;

    phases.push({
      name: `AI Synthesized Maneuver: "${prompt}"`,
      description: `Generative procedural articulation dynamically tuned to prompt frequencies`,
      duration: 3.5,
      evaluate: (p, bYaw, t) => {
        const osc = Math.sin(t * rhythmFreq);
        const osc2 = Math.cos(t * (rhythmFreq * 0.7));
        return {
          torsoPitch: osc * 0.15,
          torsoRoll: osc2 * 0.12,
          headPitch: -osc2 * 0.2,
          headYaw: osc * 0.3,
          leftArmPitch: 0.7 + osc * armAmplitude,
          rightArmPitch: 0.7 - osc * armAmplitude,
          leftArmRoll: 0.3 + Math.abs(osc2) * 0.4,
          rightArmRoll: -0.3 - Math.abs(osc2) * 0.4,
          leftHandRotate: t * 3,
          rightHandRotate: -t * 3,
          jumpY: Math.max(0, Math.sin(t * rhythmFreq * 2) * 0.1),
        };
      },
    });

    return { phases, emotion: "creative" };
  }
}

export const generativeEngine = new GenerativeActionEngine();
