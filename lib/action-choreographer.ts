"use client";

/* © 2026 Aditya Sarode. All rights reserved. */

import { audioDetector } from "./audio-detector";
import { speechService } from "./speech-service";
import {
  generativeEngine,
  GenerativeActionPlan,
  KinematicPhase,
} from "./generative-action-engine";

export const PARK_LANDMARKS = {
  fountain: [0, 0, 0] as [number, number, number],
  mainBench: [6.5, 0, 2.0] as [number, number, number],
  northBench: [-6.5, 0, 4.5] as [number, number, number],
  cherryTree: [-22.0, 0, -18.0] as [number, number, number],
  pineGrove: [28.0, 0, -22.0] as [number, number, number],
  lakePier: [-32.0, 0, 18.0] as [number, number, number],
  gazebo: [28.0, 0, 20.0] as [number, number, number],
  workoutStation: [18.0, 0, -32.0] as [number, number, number],
  willowStream: [-18.0, 0, 36.0] as [number, number, number],
};

// Arrival points sit beside the feature, so navigation ends on clear paving rather
// than in a fountain basin, tree trunk, or a building's footprint.
export const PARK_APPROACH_POINTS: Record<
  keyof typeof PARK_LANDMARKS,
  [number, number, number]
> = {
  fountain: [0, 0, 4.15],
  mainBench: [6.5, 0, 3.25],
  northBench: [-5.15, 0, 5.25],
  cherryTree: [-16.0, 0, -13.25],
  pineGrove: [21.2, 0, -16.2],
  lakePier: [-31.8, 0, 13.2],
  gazebo: [22.5, 0, 20.0],
  workoutStation: [13.7, 0, -32.0],
  willowStream: [-18.0, 0, 33.3],
};

// ============================================================================
// PARK OBSTACLES & SOLID COLLISION GEOMETRIES (Lakes, Trees, Fountain, Streams)
// ============================================================================
export type ParkObstacle = {
  id: string;
  name: string;
  type: "water" | "tree" | "structure" | "boundary" | "hedge" | "bench";
  x: number;
  z: number;
  radius?: number;
  width?: number;
  depth?: number;
  isAllowed?: (x: number, z: number) => boolean;
};

export const PARK_OBSTACLES: ParkObstacle[] = [
  // 1. SCENIC LAKE & WATER SURFACE (center [-35, 0, 19], radius 15.6m)
  // Allowed exception: The wooden pier / dock at [-32, 0, 18]
  {
    id: "lake-water",
    name: "Scenic Lake Water",
    type: "water",
    x: -35.0,
    z: 19.0,
    radius: 15.5,
    isAllowed: (x, z) => {
      // Allow walking on the pier boardwalk corridor
      return x >= -34.5 && x <= -29.5 && z >= 14.0 && z <= 22.0;
    },
  },

  // 2. GRAND WATER FOUNTAIN BASIN (center [0, 0, 0], stone basin radius 2.8m)
  {
    id: "fountain-basin",
    name: "Central Fountain Basin",
    type: "structure",
    x: 0,
    z: 0,
    radius: 2.8,
  },

  // 3. WILLOW CREEK STREAM (center [-18, 0, 36])
  // Allowed exception: The arched wooden footbridge at x in [-19.8, -16.2]
  {
    id: "willow-stream-west",
    name: "Willow Creek Water",
    type: "water",
    x: -23.5,
    z: 36.0,
    radius: 3.5,
    isAllowed: (x, z) => x >= -19.8 && x <= -16.2,
  },
  {
    id: "willow-stream-center",
    name: "Willow Creek Water",
    type: "water",
    x: -18.0,
    z: 36.0,
    radius: 2.6,
    isAllowed: (x, z) => x >= -19.8 && x <= -16.2,
  },
  {
    id: "willow-stream-east",
    name: "Willow Creek Water",
    type: "water",
    x: -12.5,
    z: 36.0,
    radius: 3.5,
    isAllowed: (x, z) => x >= -19.8 && x <= -16.2,
  },

  // 4. CHERRY BLOSSOM SHRINE / TORII POSTS
  {
    id: "cherry-shrine-tree",
    name: "Sakura Tree Trunk",
    type: "tree",
    x: -22.0,
    z: -18.0,
    radius: 2.0,
  },
  {
    id: "torii-gate-posts",
    name: "Torii Gate Posts",
    type: "structure",
    x: -22.0,
    z: -15.0,
    radius: 1.5,
  },

  // 5. PINE GROVE DENSE WOODS
  {
    id: "pine-grove-trunks",
    name: "Pine Grove Trees",
    type: "tree",
    x: 28.0,
    z: -22.0,
    radius: 3.5,
  },
  {
    id: "gazebo-floor",
    name: "Cedar Gazebo",
    type: "structure",
    x: 28.0,
    z: 20.0,
    radius: 4.3,
  },
  {
    id: "workout-station",
    name: "Fitness Station",
    type: "structure",
    x: 18.0,
    z: -32.0,
    width: 7.0,
    depth: 7.0,
  },

  // 6. OAK TREES
  {
    id: "oak-1",
    name: "Oak Tree Trunk",
    type: "tree",
    x: -7.5,
    z: 2.5,
    radius: 1.3,
  },
  {
    id: "oak-2",
    name: "Oak Tree Trunk",
    type: "tree",
    x: 7.5,
    z: 4.5,
    radius: 1.3,
  },
  {
    id: "oak-3",
    name: "Oak Tree Trunk",
    type: "tree",
    x: 2.5,
    z: -10.5,
    radius: 1.3,
  },
  {
    id: "oak-4",
    name: "Oak Tree Trunk",
    type: "tree",
    x: -9.5,
    z: -11.5,
    radius: 1.3,
  },
  {
    id: "oak-5",
    name: "Oak Tree Trunk",
    type: "tree",
    x: 14.5,
    z: -8.5,
    radius: 1.3,
  },
  {
    id: "oak-6",
    name: "Oak Tree Trunk",
    type: "tree",
    x: 14.0,
    z: 13.5,
    radius: 1.3,
  },

  // 7. AUTUMN MAPLES & WEEPING WILLOWS
  {
    id: "maple-1",
    name: "Maple Tree Trunk",
    type: "tree",
    x: 4.5,
    z: 9.5,
    radius: 1.2,
  },
  {
    id: "maple-2",
    name: "Maple Tree Trunk",
    type: "tree",
    x: -6.5,
    z: 8.5,
    radius: 1.2,
  },
  {
    id: "maple-3",
    name: "Maple Tree Trunk",
    type: "tree",
    x: 9.5,
    z: -3.5,
    radius: 1.2,
  },
  {
    id: "willow-1",
    name: "Weeping Willow Trunk",
    type: "tree",
    x: -17.5,
    z: 5.5,
    radius: 1.4,
  },
  {
    id: "willow-2",
    name: "Weeping Willow Trunk",
    type: "tree",
    x: -12.5,
    z: 14.5,
    radius: 1.4,
  },
  {
    id: "willow-3",
    name: "Weeping Willow Trunk",
    type: "tree",
    x: -18.5,
    z: 11.5,
    radius: 1.4,
  },

  // 8. HEDGES & GARDEN SHRUB BORDERS (Blocks clipping through park hedges)
  {
    id: "hedge-south-left",
    name: "Garden Topiary Hedge",
    type: "hedge",
    x: -5.8,
    z: 14.5,
    width: 6.8,
    depth: 1.4,
  },
  {
    id: "hedge-south-right",
    name: "Garden Topiary Hedge",
    type: "hedge",
    x: 5.8,
    z: 14.5,
    width: 6.8,
    depth: 1.4,
  },
  {
    id: "hedge-north-left",
    name: "Garden Topiary Hedge",
    type: "hedge",
    x: -5.8,
    z: -14.5,
    width: 6.8,
    depth: 1.4,
  },
  {
    id: "hedge-north-right",
    name: "Garden Topiary Hedge",
    type: "hedge",
    x: 5.8,
    z: -14.5,
    width: 6.8,
    depth: 1.4,
  },
  {
    id: "hedge-east-north",
    name: "Garden Topiary Hedge",
    type: "hedge",
    x: 18.0,
    z: 5.5,
    width: 1.4,
    depth: 8.5,
  },
  {
    id: "hedge-east-south",
    name: "Garden Topiary Hedge",
    type: "hedge",
    x: 18.0,
    z: -5.5,
    width: 1.4,
    depth: 8.5,
  },
  {
    id: "hedge-west-north",
    name: "Garden Topiary Hedge",
    type: "hedge",
    x: -18.0,
    z: 5.5,
    width: 1.4,
    depth: 8.5,
  },
  {
    id: "hedge-west-south",
    name: "Garden Topiary Hedge",
    type: "hedge",
    x: -18.0,
    z: -5.5,
    width: 1.4,
    depth: 8.5,
  },

  // 9. PARK BENCHES
  {
    id: "bench-main",
    name: "Plaza Cedar Bench",
    type: "bench",
    x: 6.5,
    z: 2.0,
    width: 2.2,
    depth: 1.1,
  },
  {
    id: "bench-north",
    name: "Garden Bench",
    type: "bench",
    x: -6.5,
    z: 4.5,
    width: 2.2,
    depth: 1.1,
  },
  {
    id: "bench-lake",
    name: "Lakeside Bench",
    type: "bench",
    x: -28.0,
    z: 12.0,
    width: 2.2,
    depth: 1.1,
  },
];

export function checkObstacleCollision(
  x: number,
  z: number,
  robotRadius = 0.45,
): { hit: boolean; obstacle?: ParkObstacle } {
  // Check outer park boundary
  const distFromCenter = Math.hypot(x, z);
  if (distFromCenter > 113.0) {
    return {
      hit: true,
      obstacle: {
        id: "park-boundary",
        name: "Park Perimeter Boundary",
        type: "boundary",
        x: 0,
        z: 0,
        radius: 113.0,
      },
    };
  }

  for (const obs of PARK_OBSTACLES) {
    if (obs.width !== undefined && obs.depth !== undefined) {
      // Oriented AABB box collision
      const halfW = obs.width / 2 + robotRadius;
      const halfD = obs.depth / 2 + robotRadius;
      if (Math.abs(x - obs.x) < halfW && Math.abs(z - obs.z) < halfD) {
        if (obs.isAllowed && obs.isAllowed(x, z)) {
          continue;
        }
        return { hit: true, obstacle: obs };
      }
    } else if (obs.radius !== undefined) {
      // Radial circle collision
      const d = Math.hypot(x - obs.x, z - obs.z);
      if (d < obs.radius + robotRadius) {
        if (obs.isAllowed && obs.isAllowed(x, z)) {
          continue;
        }
        return { hit: true, obstacle: obs };
      }
    }
  }

  return { hit: false };
}

export function resolveObstacleCollision(
  currentPos: [number, number, number],
  targetX: number,
  targetZ: number,
  robotRadius = 0.45,
): {
  pos: [number, number, number];
  blocked: boolean;
  obstacle?: ParkObstacle;
} {
  // If target position is clear, move normally
  const direct = checkObstacleCollision(targetX, targetZ, robotRadius);
  if (!direct.hit) {
    return { pos: [targetX, currentPos[1], targetZ], blocked: false };
  }

  // Tangential slide: Try moving along X only
  const slideX = checkObstacleCollision(targetX, currentPos[2], robotRadius);
  if (!slideX.hit) {
    return {
      pos: [targetX, currentPos[1], currentPos[2]],
      blocked: true,
      obstacle: direct.obstacle,
    };
  }

  // Tangential slide: Try moving along Z only
  const slideZ = checkObstacleCollision(currentPos[0], targetZ, robotRadius);
  if (!slideZ.hit) {
    return {
      pos: [currentPos[0], currentPos[1], targetZ],
      blocked: true,
      obstacle: direct.obstacle,
    };
  }

  // Completely obstructed: Halt safely in place to prevent entering water or colliding with trees
  return {
    pos: [currentPos[0], currentPos[1], currentPos[2]],
    blocked: true,
    obstacle: direct.obstacle,
  };
}

/**
 * Finds a short, collision-free waypoint route around the park geometry.
 * It is deliberately invoked only after the direct route is blocked, keeping
 * ordinary movement direct while still allowing a moving companion to replan.
 */
export function planObstacleReroute(
  start: [number, number, number],
  destination: [number, number, number],
): [number, number][] {
  const cell = 1.15;
  type Node = { x: number; z: number; g: number; f: number };
  const key = (x: number, z: number) => `${x},${z}`;
  const toCell = (value: number) => Math.round(value / cell);
  const clearCell = (x: number, z: number) => !checkObstacleCollision(x * cell, z * cell, 0.5).hit;
  const nearestClear = (x: number, z: number) => {
    if (clearCell(x, z)) return [x, z] as const;
    for (let radius = 1; radius <= 8; radius++) {
      for (let dx = -radius; dx <= radius; dx++) for (let dz = -radius; dz <= radius; dz++) {
        if (Math.abs(dx) !== radius && Math.abs(dz) !== radius) continue;
        if (clearCell(x + dx, z + dz)) return [x + dx, z + dz] as const;
      }
    }
    return null;
  };
  const origin = nearestClear(toCell(start[0]), toCell(start[2]));
  const goal = nearestClear(toCell(destination[0]), toCell(destination[2]));
  if (!origin || !goal) return [];
  const open: Node[] = [{ x: origin[0], z: origin[1], g: 0, f: Math.hypot(goal[0] - origin[0], goal[1] - origin[1]) }];
  const cameFrom = new Map<string, string>();
  const cost = new Map<string, number>([[key(origin[0], origin[1]), 0]]);
  const closed = new Set<string>();
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  let found: Node | null = null;
  while (open.length && closed.size < 9000) {
    open.sort((a, b) => b.f - a.f);
    const current = open.pop()!;
    const currentKey = key(current.x, current.z);
    if (closed.has(currentKey)) continue;
    closed.add(currentKey);
    if (current.x === goal[0] && current.z === goal[1]) { found = current; break; }
    for (const [dx, dz] of directions) {
      const nx = current.x + dx;
      const nz = current.z + dz;
      const nextKey = key(nx, nz);
      if (closed.has(nextKey) || !clearCell(nx, nz)) continue;
      // Do not cut diagonally through the corner of an obstacle.
      if (dx && dz && (!clearCell(current.x + dx, current.z) || !clearCell(current.x, current.z + dz))) continue;
      const nextCost = current.g + (dx && dz ? 1.414 : 1);
      if (nextCost >= (cost.get(nextKey) ?? Infinity)) continue;
      cost.set(nextKey, nextCost);
      cameFrom.set(nextKey, currentKey);
      open.push({ x: nx, z: nz, g: nextCost, f: nextCost + Math.hypot(goal[0] - nx, goal[1] - nz) });
    }
  }
  if (!found) return [];
  const route: [number, number][] = [];
  let cursor = key(found.x, found.z);
  while (cursor !== key(origin[0], origin[1])) {
    const [x, z] = cursor.split(",").map(Number);
    route.unshift([x * cell, z * cell]);
    const previous = cameFrom.get(cursor);
    if (!previous) return [];
    cursor = previous;
  }
  route.push([destination[0], destination[2]]);
  return route;
}

export type RobotJointState = {
  worldPos: [number, number, number];
  yaw: number;
  jumpY: number;
  squat: number;
  isSitting: boolean;
  currentAction: string;
  shockwave: number;

  // Upper body DOFs
  torsoPitch: number;
  torsoRoll: number;
  torsoYaw: number;
  headPitch: number;
  headYaw: number;
  headRoll: number;
  leftArmPitch: number;
  leftArmRoll: number;
  leftElbow: number;
  leftHandRotate: number;
  rightArmPitch: number;
  rightArmRoll: number;
  rightElbow: number;
  rightHandRotate: number;

  // Lower body DOFs
  leftLegPitch: number;
  leftKnee: number;
  rightLegPitch: number;
  rightKnee: number;
};

export type ActionStep = {
  id: string;
  name: string;
  description: string;
  duration: number;
  update: (
    dt: number,
    progress: number,
    currentPos: [number, number, number],
    currentYaw: number,
    elapsedSeconds: number,
  ) => Partial<RobotJointState> & {
    worldPos: [number, number, number];
    yaw: number;
  };
};

export class ActionChoreographer {
  private queue: ActionStep[] = [];
  private currentStepIndex: number = 0;
  private stepStartTime: number = 0;
  private isRunning: boolean = false;

  // Live 60FPS coordinates & heading
  private currentPos: [number, number, number] = [0, 0, 4.8];
  private currentYaw: number = 0; // 0 rad = facing positive Z (Forward/South towards camera)
  private isSitting: boolean = false;
  // Held keyboard input is handled separately from scripted actions. This keeps
  // WASD responsive and frame-rate independent instead of restarting a small
  // queued animation on every key-repeat event.
  private manualInput = { forward: false, backward: false, left: false, right: false, sprint: false };
  private currentActionName: string = "Idle in Park";
  private lastNotifyTime: number = 0;
  private lastObstacleAlert: string | null = null;
  private lastObstacleSpeechTime: number = 0;

  private onStatusChange:
    | ((status: {
        isBusy: boolean;
        currentAction: string;
        stepNumber: number;
        totalSteps: number;
        pos: [number, number, number];
        yaw: number;
        isSitting: boolean;
        obstacleAlert?: string | null;
      }) => void)
    | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      audioDetector.subscribe((event) => {
        if (event.isBeat && !this.isRunning) {
          this.parseAndQueue("dance on beat");
        }
      });
    }
  }

  public setStatusListener(
    cb: (status: {
      isBusy: boolean;
      currentAction: string;
      stepNumber: number;
      totalSteps: number;
      pos: [number, number, number];
      yaw: number;
      isSitting: boolean;
      obstacleAlert?: string | null;
    }) => void,
  ) {
    this.onStatusChange = cb;
  }

  public triggerObstacleAlert(obstacleName: string) {
    this.lastObstacleAlert = obstacleName;
    const now = performance.now();
    if (now - this.lastObstacleSpeechTime > 4500) {
      this.lastObstacleSpeechTime = now;
      speechService.speak(
        `Obstacle ahead: ${obstacleName}. Safety guard active.`,
      );
    }
  }

  public clearObstacleAlert() {
    this.lastObstacleAlert = null;
  }

  private notifyStatus(action = this.currentActionName, force = false) {
    const now = performance.now();
    if (!force && now - this.lastNotifyTime < 33) return; // Throttle ~30fps for UI state
    this.lastNotifyTime = now;
    this.currentActionName = action;
    this.onStatusChange?.({
      isBusy: this.isRunning,
      currentAction: this.isRunning
        ? action
        : this.isSitting
          ? "Sitting on Bench"
          : "Idle in Park",
      stepNumber: this.currentStepIndex + 1,
      totalSteps: Math.max(1, this.queue.length),
      pos: [...this.currentPos],
      yaw: this.currentYaw,
      isSitting: this.isSitting,
      obstacleAlert: this.lastObstacleAlert,
    });
  }

  // UNIVERSAL COMMAND COMPILER & KINEMATIC DISPATCHER
  public parseAndQueue(commandText: string): {
    success: boolean;
    stepsFound: string[];
    summary: string;
    plan?: GenerativeActionPlan;
  } {
    // Normalize phrases like "go and sit", "walk and sit", "back and forth"
    let clean = commandText.toLowerCase().replace(/[,+]/g, " and ");
    clean = clean.replace(/\b(?:go|walk|head|run)\s+and\s+sit\b/g, "sit");
    clean = clean.replace(/\bback\s+and\s+forth\b/g, "back_and_forth");

    const parts = clean
      .split(/\b(?:and then|then|after that|next|followed by|and|&)\b/)
      .map((s) => s.replace(/back_and_forth/g, "back and forth").trim())
      .filter(Boolean);

    const steps: ActionStep[] = [];
    let detectedPlan: GenerativeActionPlan | undefined;

    for (const part of parts) {
      // 1. SITTING. "sit" means sit where the companion is now; only an
      // explicit bench/seat request should navigate across the park.
      if (/\b(?:sit|rest)\b/.test(part) && !/\b(?:bench|seat|chair)\b/.test(part)) {
        steps.push(this.createSitHereStep());
        continue;
      }

      // 2. BENCH SITTING
      if (
        /\b(?:sit|rest)\b.*\b(?:bench|seat|chair)\b|\b(?:bench)\b.*\b(?:sit)\b/.test(
          part,
        )
      ) {
        steps.push(this.createNavigateToLandmarkStep("mainBench", true));
        continue;
      }

      // 2. STAND UP FROM BENCH
      if (/\b(?:stand up|get up|rise|leave bench)\b/.test(part)) {
        steps.push(this.createStandUpStep());
        continue;
      }

      // 3. LANDMARK NAVIGATION (fountain, gazebo, lake/pier, cherry blossom, pine grove, gym)
      if (/\b(?:fountain|water fountain)\b/.test(part)) {
        steps.push(this.createNavigateToLandmarkStep("fountain", false));
        continue;
      }
      if (/\b(?:gazebo|pavilion|pergola)\b/.test(part)) {
        steps.push(this.createNavigateToLandmarkStep("gazebo", false));
        continue;
      }
      if (/\b(?:lake|pier|dock|waterfront|pond)\b/.test(part)) {
        steps.push(this.createNavigateToLandmarkStep("lakePier", false));
        continue;
      }
      if (/\b(?:cherry|sakura|pink tree|blossom)\b/.test(part)) {
        steps.push(this.createNavigateToLandmarkStep("cherryTree", false));
        continue;
      }
      if (/\b(?:pine|grove|evergreen|woods|forest)\b/.test(part)) {
        steps.push(this.createNavigateToLandmarkStep("pineGrove", false));
        continue;
      }
      if (/\b(?:workout|gym|calisthenic|bars|pullup|dip bar)\b/.test(part)) {
        steps.push(this.createNavigateToLandmarkStep("workoutStation", false));
        continue;
      }
      if (/\b(?:stream|bridge|willow)\b/.test(part)) {
        steps.push(this.createNavigateToLandmarkStep("willowStream", false));
        continue;
      }

      // 4a. "COME TO ME", "COME HERE", "APPROACH ME" (Explicit command to orient toward camera)
      if (
        /\b(?:come here|come to me|approach me|face me and come)\b/.test(part)
      ) {
        let count = 6;
        const numMatch = part.match(/(\d+)/);
        if (numMatch)
          count = Math.max(1, Math.min(30, parseInt(numMatch[1], 10)));
        const isRunning =
          part.includes("run") ||
          part.includes("sprint") ||
          part.includes("fast");

        // Align to face camera only when explicitly asked to approach user
        if (Math.abs(this.currentYaw) > 0.15) {
          steps.push(
            this.createTurnStep(
              Math.round((Math.abs(this.currentYaw) * 180) / Math.PI),
              this.currentYaw < 0,
              0,
            ),
          );
        }
        steps.push(this.createTranslateSteps(count, 1, isRunning, false));
        continue;
      }

      // 4b. FORWARD STRIDE IN CURRENT HEADING ("move", "walk forward", "forward", "walk", "step forward", "advance")
      // Maintains whichever direction the robot was turned (e.g. turned left, turned right)!
      if (
        /\b(?:move|walk forward|step forward|forward|walk|advance|step|run|sprint)\b/.test(
          part,
        ) &&
        !part.includes("back") &&
        !part.includes("left") &&
        !part.includes("right")
      ) {
        let count = 4;
        const numMatch = part.match(/(\d+)/);
        if (numMatch)
          count = Math.max(1, Math.min(30, parseInt(numMatch[1], 10)));
        const isRunning =
          part.includes("run") ||
          part.includes("sprint") ||
          part.includes("fast");

        // Stride FORWARD along robot's CURRENT body yaw heading!
        steps.push(this.createTranslateSteps(count, 1, isRunning, false));
        continue;
      }

      // 5. BACKWARD MOVEMENT ("go back", "walk backward", "step back")
      if (part.includes("back") || part.includes("reverse")) {
        let count = 4;
        const numMatch = part.match(/(\d+)/);
        if (numMatch)
          count = Math.max(1, Math.min(20, parseInt(numMatch[1], 10)));
        steps.push(this.createTranslateSteps(count, -1, false));
        continue;
      }

      // 6. STRAFE (LEFT / RIGHT)
      if (
        /\b(?:left|right)\b/.test(part) &&
        (part.includes("go") ||
          part.includes("step") ||
          part.includes("walk") ||
          part.includes("move") ||
          part.includes("strafe"))
      ) {
        let count = 4;
        const numMatch = part.match(/(\d+)/);
        if (numMatch)
          count = Math.max(1, Math.min(15, parseInt(numMatch[1], 10)));
        const isLeft = part.includes("left");
        steps.push(this.createStrafeStep(count, isLeft));
        continue;
      }

      // 7. ROTATE / TURN (90 deg, 180 deg, turn left, turn right)
      if (
        /\b(?:turn|rotate|face|spin|pivot)\b/.test(part) &&
        !part.includes("hand") &&
        !part.includes("wrist")
      ) {
        let deg = 90;
        const degMatch = part.match(/(\d+)\s*(?:deg|degree|degrees)?/);
        if (degMatch) deg = parseInt(degMatch[1], 10);
        else if (part.includes("180")) deg = 180;
        else if (part.includes("360")) deg = 360;
        else if (part.includes("45")) deg = 45;

        const isLeft = part.includes("left") || part.includes("counter");
        steps.push(this.createTurnStep(deg, isLeft));
        continue;
      }

      // 8. COMPILE VIA UNIVERSAL GENERATIVE KINEMATIC ENGINE!
      // This handles ANY arbitrary custom command (martial arts kicks, backflips, salutes, bows, pushups,
      // yoga, squats, stealth crouch, shivers, head scratches, superman flying, dancing, breakdancing, etc.)
      const plan = generativeEngine.compile(part);
      detectedPlan = plan;

      for (const phase of plan.phases) {
        steps.push(this.createGenerativeKinematicStep(phase));
      }
    }

    if (steps.length === 0) {
      // Default: Walk 6 steps forward toward camera
      steps.push(this.createTranslateSteps(6, 1, false, true));
    }

    this.queue = steps;
    this.currentStepIndex = 0;
    this.stepStartTime = performance.now();
    this.isRunning = true;
    this.notifyStatus(steps[0]?.name, true);

    return {
      success: true,
      stepsFound: steps.map((s) => s.name),
      summary: steps.map((s) => s.name).join(" → "),
      plan: detectedPlan,
    };
  }

  // REAL 60FPS FORWARD/BACKWARD GROUND DISPLACEMENT
  private createTranslateSteps(
    stepCount: number,
    direction = 1,
    isRunning = false,
    faceUser = false,
  ): ActionStep {
    const strideLength = isRunning ? 0.65 : 0.48; // meters per step
    const totalDistance = stepCount * strideLength * direction;
    const speed = isRunning ? 2.1 : 1.15; // meters per second
    const duration = Math.abs(totalDistance) / speed;

    return {
      id: `walk-${stepCount}-${direction}`,
      name: isRunning
        ? `Running Forward (${(stepCount * strideLength).toFixed(1)}m)`
        : `Walking Forward (${(stepCount * strideLength).toFixed(1)}m)`,
      description: `Physical continuous coordinate displacement at 60FPS`,
      duration,
      update: (dt, p, pos, yaw, elapsed) => {
        const currentHeading = faceUser ? 0 : yaw;
        const distThisFrame = speed * dt * direction;
        const targetX = pos[0] + Math.sin(currentHeading) * distThisFrame;
        const targetZ = pos[2] + Math.cos(currentHeading) * distThisFrame;

        // Obstacle avoidance safety barrier (blocks water, trees, fountain, boundaries)
        const res = resolveObstacleCollision(pos, targetX, targetZ);
        if (res.blocked && res.obstacle) {
          this.triggerObstacleAlert(res.obstacle.name);
        } else if (!res.blocked && this.lastObstacleAlert) {
          this.clearObstacleAlert();
        }

        // Natural kinematic stride angles
        const strideSpeed = isRunning ? 15 : 10;
        const legCycle =
          Math.sin(elapsed * strideSpeed) * (isRunning ? 0.75 : 0.55);
        const armCycle = -legCycle * 0.8;
        const bob = Math.abs(Math.sin(elapsed * strideSpeed)) * 0.04;

        return {
          worldPos: res.pos,
          yaw: currentHeading,
          isSitting: false,
          currentAction: res.blocked
            ? `Obstacle Guard: ${res.obstacle?.name || "Solid Barrier"}`
            : isRunning
              ? "Running"
              : "Walking",
          jumpY: bob,
          torsoPitch: isRunning ? 0.12 : 0.05,
          torsoRoll: Math.sin(elapsed * strideSpeed * 0.5) * 0.03,
          leftLegPitch: legCycle,
          rightLegPitch: -legCycle,
          leftKnee: Math.max(0, -legCycle * 0.9),
          rightKnee: Math.max(0, legCycle * 0.9),
          leftArmPitch: armCycle,
          rightArmPitch: -armCycle,
          leftElbow: 0.4 + Math.abs(armCycle) * 0.35,
          rightElbow: 0.4 + Math.abs(armCycle) * 0.35,
        };
      },
    };
  }

  // REAL 60FPS LATERAL STRAFE
  private createStrafeStep(stepCount: number, isLeft: boolean): ActionStep {
    const speed = 0.85;
    const duration = stepCount * 0.55;

    return {
      id: `strafe-${isLeft ? "left" : "right"}`,
      name: `Step ${isLeft ? "Left" : "Right"} (${stepCount} steps)`,
      description: `Lateral ground translation`,
      duration,
      update: (dt, p, pos, yaw, elapsed) => {
        const dist = speed * dt * (isLeft ? -1 : 1);
        const targetX = pos[0] + Math.cos(yaw) * dist;
        const targetZ = pos[2] - Math.sin(yaw) * dist;

        const res = resolveObstacleCollision(pos, targetX, targetZ);
        if (res.blocked && res.obstacle) {
          this.triggerObstacleAlert(res.obstacle.name);
        } else if (!res.blocked && this.lastObstacleAlert) {
          this.clearObstacleAlert();
        }

        const legCycle = Math.sin(elapsed * 9) * 0.4;
        return {
          worldPos: res.pos,
          yaw,
          isSitting: false,
          currentAction: res.blocked
            ? `Obstacle Guard: ${res.obstacle?.name || "Solid Barrier"}`
            : "Walking",
          torsoRoll: isLeft ? -0.06 : 0.06,
          leftLegPitch: legCycle,
          rightLegPitch: -legCycle,
          leftKnee: Math.max(0, legCycle),
          rightKnee: Math.max(0, -legCycle),
        };
      },
    };
  }

  private createSitHereStep(): ActionStep {
    const startY = this.currentPos[1];
    // Both bundled avatars have their hip roughly 0.98m above the root. The
    // bench seat is 0.51m high, so the root must lower instead of being raised.
    const seatedY = -0.47;
    return {
      id: "sit-here",
      name: "Sit Down Nearby",
      description: "Sit naturally at the current safe position",
      duration: 0.55,
      update: (_dt, p, pos, yaw) => ({
        worldPos: [pos[0], startY + (seatedY - startY) * (p * p), pos[2]],
        yaw,
        isSitting: p >= 0.92,
        currentAction: p >= 0.92 ? "Sitting Nearby" : "Sitting Down",
        squat: Math.min(0.62, p * 0.62),
      }),
    };
  }

  // REAL 60FPS ROTATION
  private createTurnStep(
    deg: number,
    isLeft: boolean,
    targetFixedYaw?: number,
  ): ActionStep {
    const rad =
      targetFixedYaw !== undefined
        ? targetFixedYaw
        : ((deg * Math.PI) / 180) * (isLeft ? 1 : -1);
    const duration = Math.max(0.6, (deg / 120) * 0.7);
    let startYaw: number | null = null;

    return {
      id: `turn-${deg}`,
      name: `Turn ${deg}° ${isLeft ? "Left" : "Right"}`,
      description: `Rotate yaw heading orientation`,
      duration,
      update: (dt, p, pos, yaw) => {
        if (startYaw === null) startYaw = yaw;
        const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
        const targetYaw =
          targetFixedYaw !== undefined
            ? startYaw + (targetFixedYaw - startYaw) * ease
            : startYaw + rad * ease;

        return {
          worldPos: pos,
          yaw: targetYaw,
          isSitting: false,
          currentAction: "Walking",
          torsoRoll: Math.sin(p * Math.PI) * (isLeft ? 0.05 : -0.05),
        };
      },
    };
  }

  // NAVIGATE TO LANDMARK
  private createNavigateToLandmarkStep(
    landmarkKey: keyof typeof PARK_LANDMARKS,
    sitOnArrival = false,
  ): ActionStep {
    const landmark = PARK_LANDMARKS[landmarkKey];
    const target = PARK_APPROACH_POINTS[landmarkKey];
    const speed = 2.0;
    const tx = target[0];
    const tz = target[2];
    const initialDist = Math.hypot(
      tx - this.currentPos[0],
      tz - this.currentPos[2],
    );
    // Reserve time for a detour if an obstacle enters the direct corridor.
    const duration = Math.max(4, initialDist / speed + 10);
    let isArrived = false;
    let reroute: [number, number][] = [];
    let rerouteIndex = 0;

    return {
      id: `nav-${landmarkKey}`,
      name: sitOnArrival
        ? "Walk to Bench & Sit Down"
        : `Walk to ${landmarkKey}`,
      description: `Navigating directly toward ${landmarkKey}`,
      duration,
      update: (dt, p, pos, yaw, elapsed) => {
        const activeTarget = reroute[rerouteIndex] ?? [target[0], target[2]];
        const tx = activeTarget[0];
        const tz = activeTarget[1];

        const dx = tx - pos[0];
        const dz = tz - pos[2];
        const dist = Math.hypot(dx, dz);

        if (dist > 0.45 && !isArrived) {
          const targetYaw = Math.atan2(dx, dz);
          const nextYaw = yaw + (targetYaw - yaw) * Math.min(1, dt * 5.5);
          const moveStep = Math.min(dist, speed * dt);
          const targetX = pos[0] + Math.sin(nextYaw) * moveStep;
          const targetZ = pos[2] + Math.cos(nextYaw) * moveStep;

          const res = resolveObstacleCollision(pos, targetX, targetZ);
          if (res.blocked && res.obstacle) {
            this.triggerObstacleAlert(res.obstacle.name);
            reroute = planObstacleReroute(pos, [target[0], 0, target[2]]);
            rerouteIndex = 0;
          } else if (!res.blocked && this.lastObstacleAlert) {
            this.clearObstacleAlert();
          }

          const legCycle = Math.sin(elapsed * 10) * 0.55;
          const armCycle = -legCycle * 0.75;
          const bob = Math.abs(Math.sin(elapsed * 10)) * 0.04;

          return {
            worldPos: res.pos,
            yaw: nextYaw,
            isSitting: false,
            currentAction: res.blocked
              ? reroute.length ? `Rerouting around ${res.obstacle?.name || "obstacle"}` : `Nav Obstacle Guard: ${res.obstacle?.name || "Barrier"}`
              : reroute.length ? "Following safe reroute" : "Walking",
            jumpY: bob,
            leftLegPitch: legCycle,
            rightLegPitch: -legCycle,
            leftKnee: Math.max(0, -legCycle * 0.9),
            rightKnee: Math.max(0, legCycle * 0.9),
            leftArmPitch: armCycle,
            rightArmPitch: -armCycle,
            leftElbow: 0.4 + Math.abs(armCycle) * 0.3,
            rightElbow: 0.4 + Math.abs(armCycle) * 0.3,
          };
        } else if (reroute.length && rerouteIndex < reroute.length - 1) {
          rerouteIndex += 1;
          return { worldPos: pos, yaw, isSitting: false, currentAction: "Following safe reroute" };
        } else {
          isArrived = true;
          if (sitOnArrival) {
            return {
              // Only the seated pose is placed on the bench itself. Walking always
              // stops at its clear approach point.
              worldPos: [landmark[0], -0.47, landmark[2]],
              // The main bench faces west after its -90° world rotation.
              yaw: -Math.PI / 2,
              isSitting: true,
              currentAction: "Sitting on Bench",
            };
          } else {
            return {
              worldPos: pos,
              yaw,
              isSitting: false,
              currentAction: "Idle in Park",
            };
          }
        }
      },
    };
  }

  // STAND UP FROM BENCH
  private createStandUpStep(): ActionStep {
    return {
      id: "stand-up",
      name: "Stand Up from Bench",
      description: "Rise up and step onto grass lawn",
      duration: 2.2,
      update: (dt, p, pos, yaw) => {
        const rise = Math.min(1, p / 0.6);
        const forward = Math.max(0, (p - 0.6) / 0.4);
        const nextY = -0.47 + rise * 0.47;
        const nextX = pos[0] + Math.sin(yaw) * forward * 0.6;
        const nextZ = pos[2] + Math.cos(yaw) * forward * 0.6;

        return {
          worldPos: [nextX, nextY, nextZ],
          yaw,
          isSitting: false,
          currentAction: p < 0.6 ? "Standing" : "Idle in Park",
          squat: (1 - rise) * 0.6,
        };
      },
    };
  }

  // GENERATIVE KINEMATIC ACTION STEP
  private createGenerativeKinematicStep(phase: KinematicPhase): ActionStep {
    return {
      id: `gen-${phase.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      name: phase.name,
      description: phase.description,
      duration: phase.duration,
      update: (dt, progress, pos, yaw, elapsed) => {
        const evalState = phase.evaluate(progress, yaw, elapsed);
        const nextYaw = evalState.yaw !== undefined ? evalState.yaw : yaw;

        return {
          worldPos: pos,
          yaw: nextYaw,
          isSitting: false,
          currentAction: phase.name,
          ...evalState,
        };
      },
    };
  }

  // DIRECT MANUAL CONTROLS (D-PAD)
  public moveForward(steps = 4, sprint = false) {
    this.parseAndQueue(
      `walk forward ${steps} steps ${sprint ? "fast sprint" : ""}`,
    );
  }

  public moveBackward(steps = 3) {
    this.parseAndQueue(`go back ${steps} steps`);
  }

  public turnLeft(deg = 45) {
    this.parseAndQueue(`turn left ${deg} degrees`);
  }

  public turnRight(deg = 45) {
    this.parseAndQueue(`turn right ${deg} degrees`);
  }

  public jump() {
    this.parseAndQueue("jump");
  }

  public sitOnBench() {
    this.parseAndQueue("go and sit on the bench");
  }

  public setManualInput(input: Partial<typeof this.manualInput>) {
    this.manualInput = { ...this.manualInput, ...input };
    if (this.manualInput.forward || this.manualInput.backward || this.manualInput.left || this.manualInput.right) {
      this.stopAll();
      if (this.isSitting) this.isSitting = false;
    }
  }

  public standUp() {
    this.parseAndQueue("stand up");
  }

  // 60FPS RUNTIME FRAME LOOP (CALLED INSIDE useFrame)
  public update(delta: number, now: number): RobotJointState {
    const defaultState: RobotJointState = {
      worldPos: this.currentPos,
      yaw: this.currentYaw,
      jumpY: 0,
      squat: 0,
      isSitting: this.isSitting,
      currentAction: this.currentActionName,
      shockwave: 0,
      torsoPitch: 0,
      torsoRoll: 0,
      torsoYaw: 0,
      headPitch: 0,
      headYaw: 0,
      headRoll: 0,
      leftArmPitch: 0,
      leftArmRoll: 0,
      leftElbow: 0.15,
      leftHandRotate: 0,
      rightArmPitch: 0,
      rightArmRoll: 0,
      rightElbow: 0.15,
      rightHandRotate: 0,
      leftLegPitch: 0,
      leftKnee: 0.04,
      rightLegPitch: 0,
      rightKnee: 0.04,
    };

    const forwardAxis = (this.manualInput.forward ? 1 : 0) - (this.manualInput.backward ? 1 : 0);
    // Positive yaw is a left turn in this scene (the same convention used by
    // createTurnStep), so keyboard left/right must use that direction too.
    const turnAxis = (this.manualInput.left ? 1 : 0) - (this.manualInput.right ? 1 : 0);
    if (forwardAxis || turnAxis) {
      const turnSpeed = 2.6;
      const speed = this.manualInput.sprint ? 4.1 : 2.25;
      this.currentYaw += turnAxis * turnSpeed * delta;
      const distance = forwardAxis * speed * delta;
      const targetX = this.currentPos[0] + Math.sin(this.currentYaw) * distance;
      const targetZ = this.currentPos[2] + Math.cos(this.currentYaw) * distance;
      const safePos = resolveObstacleCollision(this.currentPos, targetX, targetZ);
      this.currentPos = safePos.pos;
      if (safePos.blocked && safePos.obstacle) this.triggerObstacleAlert(safePos.obstacle.name);
      else this.clearObstacleAlert();
      const stride = forwardAxis ? Math.sin(now / 1000 * (this.manualInput.sprint ? 15 : 10)) * (this.manualInput.sprint ? 0.75 : 0.55) : 0;
      this.currentActionName = forwardAxis ? (this.manualInput.sprint ? "Sprinting" : "Walking") : "Turning";
      this.notifyStatus(this.currentActionName, false);
      return {
        ...defaultState, worldPos: this.currentPos, yaw: this.currentYaw, isSitting: false,
        currentAction: this.currentActionName, torsoPitch: forwardAxis ? (this.manualInput.sprint ? 0.12 : 0.05) : 0,
        torsoRoll: turnAxis * -0.05, leftLegPitch: stride, rightLegPitch: -stride,
        leftKnee: Math.max(0, -stride * 0.9), rightKnee: Math.max(0, stride * 0.9),
        leftArmPitch: -stride * 0.8, rightArmPitch: stride * 0.8,
      };
    }

    if (!this.isRunning || this.queue.length === 0) {
      return defaultState;
    }

    const currentStep = this.queue[this.currentStepIndex];
    if (!currentStep) {
      this.isRunning = false;
      this.notifyStatus(
        this.isSitting ? "Sitting on Bench" : "Idle in Park",
        true,
      );
      return defaultState;
    }

    const elapsed = (now - this.stepStartTime) / 1000;
    const progress = Math.min(1, elapsed / currentStep.duration);

    // Evaluate step update at 60 FPS
    const computed = currentStep.update(
      delta,
      progress,
      this.currentPos,
      this.currentYaw,
      elapsed,
    );

    // Final Obstacle Barrier Clamp: Prevent any step from placing Atlas in water or obstacles
    const safePos = computed.isSitting
      ? { pos: [computed.worldPos[0], computed.worldPos[1], computed.worldPos[2]] as [number, number, number], blocked: false }
      : resolveObstacleCollision(this.currentPos, computed.worldPos[0], computed.worldPos[2]);
    this.currentPos = [safePos.pos[0], computed.worldPos[1], safePos.pos[2]];
    this.currentYaw = computed.yaw;
    if (safePos.blocked && safePos.obstacle) {
      this.triggerObstacleAlert(safePos.obstacle.name);
    } else if (!safePos.blocked && this.lastObstacleAlert) {
      this.clearObstacleAlert();
    }
    if (computed.isSitting !== undefined) this.isSitting = computed.isSitting;
    if (computed.currentAction) this.currentActionName = computed.currentAction;

    // Periodic telemetry update for UI radar & HUD
    this.notifyStatus(this.currentActionName, false);

    if (progress >= 1) {
      this.currentStepIndex++;
      this.stepStartTime = now;

      if (this.currentStepIndex >= this.queue.length) {
        this.isRunning = false;
        this.queue = [];
        this.currentStepIndex = 0;
        this.notifyStatus(
          this.isSitting ? "Sitting on Bench" : "Idle in Park",
          true,
        );
      } else {
        const nextStep = this.queue[this.currentStepIndex];
        this.notifyStatus(nextStep.name, true);
      }
    }

    return {
      ...defaultState,
      ...computed,
      worldPos: this.currentPos,
      yaw: this.currentYaw,
      isSitting: this.isSitting,
      currentAction: this.currentActionName,
    };
  }

  public stopAll() {
    this.queue = [];
    this.isRunning = false;
    this.currentStepIndex = 0;
    this.notifyStatus("Idle in Park", true);
  }

  public getPos(): [number, number, number] {
    return this.currentPos;
  }

  public getYaw(): number {
    return this.currentYaw;
  }

  public getIsSitting(): boolean {
    return this.isSitting;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }
}

export const choreographer = new ActionChoreographer();
