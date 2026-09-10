"use client";

/* © 2026 Aditya Sarode. All rights reserved. */

import React, { useState, useEffect, useRef, Suspense } from "react";
import QRCode from "qrcode";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sky } from "@react-three/drei";
import * as THREE from "three";
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Radio,
  RotateCcw,
  Upload,
  Armchair,
  Play,
  Pause,
  MessageSquare,
  Sparkles,
  Zap,
  Bot,
  GraduationCap,
  Footprints,
  Navigation,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Waves,
  Compass,
  BatteryCharging,
  Maximize2,
  Minimize2,
  Eye,
  Camera,
  Dumbbell,
  Flower2,
  Home,
  Plus,
  Minus,
  Gamepad2,
  Layers,
  Keyboard,
  Trees,
  Crosshair,
  Orbit,
  X,
  ShieldAlert,
  User,
  Trophy,
  BookOpen,
  Volume1,
  CheckCircle2,
  Award,
  ChevronDown,
  Smartphone,
} from "lucide-react";

import { TeslaOptimusModel } from "@/components/TeslaOptimusModel";
import { HumanCharacterModel } from "@/components/HumanCharacterModel";
import { ParkEnvironment, PARK_LANDMARKS } from "@/components/ParkEnvironment";
import { speechService } from "@/lib/speech-service";
import { choreographer, PARK_OBSTACLES } from "@/lib/action-choreographer";
import { audioDetector, AudioBeatEvent } from "@/lib/audio-detector";
import { robotBrain, ChatMessage } from "@/lib/robot-brain";
import { aiBrain } from "@/lib/ai-brain";
import { DANCE_LESSONS, DanceLesson } from "@/lib/dance-coach";
import { storyEngine, STORY_CHAPTERS, QuestChapter } from "@/lib/story-engine";
import { phoneAudioBridge } from "@/lib/phone-audio-bridge";

function getHeadingLabel(yaw: number): string {
  let deg = Math.round(((((yaw * 180) / Math.PI) % 360) + 360) % 360);
  if (deg >= 337.5 || deg < 22.5) return "South";
  if (deg >= 22.5 && deg < 67.5) return "South-West";
  if (deg >= 67.5 && deg < 112.5) return "West";
  if (deg >= 112.5 && deg < 157.5) return "North-West";
  if (deg >= 157.5 && deg < 202.5) return "North";
  if (deg >= 202.5 && deg < 247.5) return "North-East";
  if (deg >= 247.5 && deg < 292.5) return "East";
  return "South-East";
}

export type CameraView =
  | "follow"
  | "overview"
  | "closeup"
  | "fountain"
  | "gazebo"
  | "lake"
  | "bench"
  | "top";

export const CAMERA_OPTIONS: { id: CameraView; label: string }[] = [
  { id: "follow", label: "Follow Companion" },
  { id: "closeup", label: "Face Focus" },
  { id: "overview", label: "Park Overview" },
  { id: "fountain", label: "Water Fountain" },
  { id: "gazebo", label: "Cedar Gazebo" },
  { id: "lake", label: "Lakeside Pier" },
  { id: "bench", label: "Garden Bench" },
  { id: "top", label: "Top-Down Map" },
];

// SMOOTH CAMERA CONTROLLER (Full Zoom Freedom + Dynamic Tracking)
function CameraDirector({
  cameraView,
  orbitRef,
  robotPos,
  robotYaw,
  isCompanionBusy,
  onIntroComplete,
  onIntroStage,
  skipIntro,
}: {
  cameraView: CameraView;
  orbitRef: React.RefObject<any>;
  robotPos: [number, number, number];
  robotYaw: number;
  isCompanionBusy: boolean;
  onIntroComplete: () => void;
  onIntroStage: (stage: number) => void;
  skipIntro: boolean;
}) {
  const lastRobotPos = useRef<[number, number, number]>([...robotPos]);
  const lastRobotYaw = useRef(robotYaw);
  const hasEngagedChaseCamera = useRef(false);
  const hasQueuedInitialChase = useRef(false);
  const introStartedAt = useRef<number | null>(null);
  const introFinished = useRef(false);
  const tourPosition = useRef(new THREE.Vector3());
  const tourTarget = useRef(new THREE.Vector3());
  const chasePosition = useRef(new THREE.Vector3());
  const chaseTarget = useRef(new THREE.Vector3());
  const lastIntroStage = useRef(-1);

  useFrame(({ clock }, delta) => {
    if (!orbitRef.current) return;
    const controls = orbitRef.current;

    if (!introFinished.current) {
      if (introStartedAt.current === null) introStartedAt.current = clock.elapsedTime;
      const elapsed = skipIntro ? 21 : clock.elapsedTime - introStartedAt.current;
      const shots = [
        { at: 0, stage: 0, pos: [-2.4, 4.4, 14.5], target: [0, 1.2, 4.8], fov: 50 },
        { at: 3.2, stage: 0, pos: [0, 20, 34], target: [0, 1, 0], fov: 60 },
        { at: 6.5, stage: 1, pos: [-16, 13, 32], target: [-35, 0.5, 19], fov: 53 },
        { at: 10, stage: 2, pos: [-8, 14, -3], target: [-22, 1, -18], fov: 51 },
        { at: 13.5, stage: 3, pos: [16, 15, -6], target: [28, 1, -22], fov: 53 },
        { at: 16.7, stage: 4, pos: [17, 13, 34], target: [28, 1, 20], fov: 51 },
        { at: 19.2, stage: 5, pos: [-2.4, 3.6, 11.7], target: [0, 1.25, 4.8], fov: 47 },
        { at: 21, stage: 5, pos: [-2.4, 3.6, 11.7], target: [0, 1.25, 4.8], fov: 47 },
      ];
      const nextIndex = shots.findIndex((shot) => shot.at > elapsed);
      const end = nextIndex === -1 ? shots[shots.length - 1] : shots[nextIndex];
      const start = nextIndex <= 0 ? shots[0] : shots[nextIndex - 1];
      const progress = Math.min(1, Math.max(0, (elapsed - start.at) / Math.max(0.001, end.at - start.at)));
      const eased = THREE.MathUtils.smootherstep(progress, 0, 1);
      tourPosition.current.set(
        THREE.MathUtils.lerp(start.pos[0], end.pos[0], eased),
        THREE.MathUtils.lerp(start.pos[1], end.pos[1], eased),
        THREE.MathUtils.lerp(start.pos[2], end.pos[2], eased),
      );
      tourTarget.current.set(
        THREE.MathUtils.lerp(start.target[0], end.target[0], eased),
        THREE.MathUtils.lerp(start.target[1], end.target[1], eased),
        THREE.MathUtils.lerp(start.target[2], end.target[2], eased),
      );
      if (start.stage !== lastIntroStage.current) {
        lastIntroStage.current = start.stage;
        onIntroStage(start.stage);
      }
      controls.enabled = false;
      controls.maxDistance = 76;
      controls.object.position.copy(tourPosition.current);
      controls.object.fov = THREE.MathUtils.lerp(start.fov, end.fov, eased);
      controls.object.updateProjectionMatrix();
      controls.target.copy(tourTarget.current);
      controls.update();

      if (elapsed >= 21) {
        introFinished.current = true;
        controls.enabled = true;
        controls.maxDistance = 42;
        controls.object.fov = 47;
        controls.object.updateProjectionMatrix();
        onIntroComplete();
      }
      return;
    }

    if (cameraView === "follow") {
      // Preserve the opening frame through the first commanded action. Once the
      // initial move or dance completes, switch cleanly into game-style follow.
      const dx = robotPos[0] - lastRobotPos.current[0];
      const dz = robotPos[2] - lastRobotPos.current[2];
      const headingDelta = Math.abs(
        Math.atan2(
          Math.sin(robotYaw - lastRobotYaw.current),
          Math.cos(robotYaw - lastRobotYaw.current),
        ),
      );
      const forwardX = Math.sin(robotYaw);
      const forwardZ = Math.cos(robotYaw);
      chaseTarget.current.set(robotPos[0], robotPos[1] + 1.25, robotPos[2]);
      chasePosition.current.set(
        robotPos[0] - forwardX * 7.2,
        robotPos[1] + 3.4,
        robotPos[2] - forwardZ * 7.2,
      );

      if (!hasEngagedChaseCamera.current) {
        if (isCompanionBusy) hasQueuedInitialChase.current = true;

        if (hasQueuedInitialChase.current && !isCompanionBusy) {
          controls.target.copy(chaseTarget.current);
          controls.object.position.copy(chasePosition.current);
          controls.update();
          hasEngagedChaseCamera.current = true;
        }
      } else if (Math.abs(dx) > 0.0001 || Math.abs(dz) > 0.0001 || headingDelta > 0.0001) {

        // Fast target tracking keeps the companion centered; the slightly slower
        // camera movement creates the polished trailing motion of modern game cameras.
        const targetSmoothing = 1 - Math.exp(-12 * delta);
        const cameraSmoothing = 1 - Math.exp(-7 * delta);
        controls.target.lerp(chaseTarget.current, targetSmoothing);
        controls.object.position.lerp(chasePosition.current, cameraSmoothing);
        controls.update();
      }
    }
    lastRobotPos.current = [...robotPos];
    lastRobotYaw.current = robotYaw;
  });

  return null;
}

// Lightweight, low-lying atmospheric mist. It gives the distant garden layers
// depth without using expensive post-processing or particle simulation.
function CinematicMist() {
  const patches = useRef<THREE.Group[]>([]);
  const mist = [
    { x: -31, z: -19, scale: 1.2, speed: 0.16 },
    { x: 24, z: -27, scale: 1.05, speed: 0.13 },
    { x: -38, z: 26, scale: 1.35, speed: 0.11 },
    { x: 33, z: 31, scale: 1.18, speed: 0.14 },
  ];

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    patches.current.forEach((patch, index) => {
      const config = mist[index];
      if (patch && config) {
        patch.position.x = config.x + Math.sin(t * config.speed + index) * 2.2;
        patch.rotation.z = Math.sin(t * config.speed * 0.7 + index) * 0.08;
      }
    });
  });

  return (
    <group>
      {mist.map((patch, index) => (
        <group
          key={index}
          ref={(node) => {
            if (node) patches.current[index] = node;
          }}
          position={[patch.x, 0.11, patch.z]}
          scale={patch.scale}
        >
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[13, 32]} />
            <meshBasicMaterial
              color="#e9fbfc"
              transparent
              opacity={0.1}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[3.5, 0.01, -1.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[8, 28]} />
            <meshBasicMaterial
              color="#d9f3f4"
              transparent
              opacity={0.07}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CinematicIntro({ stage, onSkip }: { stage: number; onSkip: () => void }) {
  const scenes = [
    { eyebrow: "ATLAS PRESENTS", title: "Grand Cyber Park", detail: "A living world, built to explore." },
    { eyebrow: "SCENIC DISTRICT 01", title: "Lakeside Promenade", detail: "Water, gardens, and a quiet place to pause." },
    { eyebrow: "SCENIC DISTRICT 02", title: "Sakura Garden", detail: "A blooming sanctuary at the edge of the plaza." },
    { eyebrow: "SCENIC DISTRICT 03", title: "Evergreen Ridge", detail: "Training grounds beneath the pines." },
    { eyebrow: "SCENIC DISTRICT 04", title: "Cedar Pavilion", detail: "A gathering place in the heart of the park." },
    { eyebrow: "YOUR COMPANION", title: "The journey begins here.", detail: "Take control whenever you are ready." },
  ];
  const scene = scenes[stage] ?? scenes[0];
  return (
    <div className="cinematic-intro" aria-live="polite">
      <div className="cinematic-brand" aria-label="Atlas">
        <span className="cinematic-brand-eyebrow">YOUR AI COMPANION</span>
        <span className="cinematic-brand-title">Atlas</span>
      </div>
      <div className="cinematic-caption" key={scene.title}>
        <p>{scene.eyebrow}</p>
        <h1>{scene.title}</h1>
        <span>{scene.detail}</span>
      </div>
      <button className="cinematic-skip" onClick={onSkip}>Skip intro</button>
    </div>
  );
}

export default function RobotStudio() {
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [cameraView, setCameraView] = useState<CameraView>("follow");
  const [showCameraMenu, setShowCameraMenu] = useState(false);
  const [showLogDrawer, setShowLogDrawer] = useState(false);
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [actionCategory, setActionCategory] = useState<
    "all" | "move" | "stunts" | "dance" | "places"
  >("all");

  // UI Visibility toggles
  const [showMap, setShowMap] = useState(true);
  const [showExpandedMap, setShowExpandedMap] = useState(false);
  const [controlDeckTab, setControlDeckTab] = useState<"camera" | "keys">(
    "camera",
  );
  const [showControlDeck, setShowControlDeck] = useState(true);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [isIntroTour, setIsIntroTour] = useState(true);
  const [introStage, setIntroStage] = useState(0);

  // Avatar Selection ("human" as default realistic stylish companion, "robot" as Tesla Optimus)
  const [avatarType, setAvatarType] = useState<"human" | "robot">("human");

  // Continuous Hands-Free Duplex Voice Conversation
  const [isContinuousVoice, setIsContinuousVoice] = useState(false);
  const [showPhoneAudio, setShowPhoneAudio] = useState(false);
  const [phoneLink, setPhoneLink] = useState("");
  const [phoneQr, setPhoneQr] = useState("");
  const [phoneAudioStatus, setPhoneAudioStatus] = useState("Not paired");

  // Chronicles of Cyber Park - Story Engine State
  const [storyState, setStoryState] = useState({
    currentChapter: storyEngine.getCurrentChapter(),
    chapterIndex: 0,
    totalChapters: STORY_CHAPTERS.length,
    completedIds: [] as string[],
    isFinished: false,
    distanceToTarget: 10,
  });
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [activeStoryDialogue, setActiveStoryDialogue] = useState<{
    title: string;
    subtitle: string;
    text: string;
    badge?: string;
  } | null>(null);

  // Audio Music Detection state
  const [isMicMusicListening, setIsMicMusicListening] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [isFilePlaying, setIsFilePlaying] = useState(false);
  const [currentBpm, setCurrentBpm] = useState(120);

  // Choreographer live state
  const [status, setStatus] = useState<{
    isBusy: boolean;
    currentAction: string;
    stepNumber: number;
    totalSteps: number;
    pos: [number, number, number];
    yaw: number;
    isSitting: boolean;
    obstacleAlert?: string | null;
  }>({
    isBusy: false,
    currentAction: "Idle in Park",
    stepNumber: 1,
    totalSteps: 1,
    pos: [0, 0, 4.8],
    yaw: 0,
    isSitting: false,
    obstacleAlert: null,
  });

  // Messages & Conversation
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-1",
      sender: "robot",
      text: "Atlas Humanoid Cyber Companion online in Grand Cyber Park (240m x 240m). Use your keyboard [W][A][S][D] / [Arrows] to walk, [Space] to jump, [Shift] to sprint, [C] to sit/stand, or use the Angle Pad to look around near me!",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: "chat",
    },
  ]);

  const orbitRef = useRef<any>(null);
  const phoneStreamAudioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Locomotion triggers (shared by computer keyboard & on-screen HUD keys)
  const triggerMoveForward = (sprint = false) => {
    choreographer.moveForward(sprint ? 6 : 3, sprint);
  };
  const triggerMoveBackward = () => {
    choreographer.moveBackward(2);
  };
  const triggerTurnLeft = () => {
    choreographer.turnLeft(30);
  };
  const triggerTurnRight = () => {
    choreographer.turnRight(30);
  };
  const triggerJump = () => {
    choreographer.jump();
  };
  const triggerSitStand = () => {
    if (status.isSitting) choreographer.standUp();
    else choreographer.sitOnBench();
  };
  const triggerBackflip = () => {
    choreographer.parseAndQueue("do a backflip and superhero landing");
  };
  const triggerDance = () => {
    choreographer.parseAndQueue("dance hip hop");
  };

  // GLOBAL COMPUTER KEYBOARD LOCOMOTION LISTENER
  useEffect(() => {
    const isInputActive = () => {
      const active = document.activeElement;
      return (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active?.getAttribute("contenteditable") === "true"
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInputActive()) return;

      const code = e.code;
      setActiveKeys((prev) => new Set(prev).add(code));

      if (code === "KeyW" || code === "ArrowUp") {
        e.preventDefault();
        choreographer.setManualInput({ forward: true, sprint: e.shiftKey });
      } else if (code === "KeyS" || code === "ArrowDown") {
        e.preventDefault();
        choreographer.setManualInput({ backward: true, sprint: e.shiftKey });
      } else if (code === "KeyA" || code === "ArrowLeft") {
        e.preventDefault();
        choreographer.setManualInput({ left: true });
      } else if (code === "KeyD" || code === "ArrowRight") {
        e.preventDefault();
        choreographer.setManualInput({ right: true });
      } else if (code === "Space") {
        e.preventDefault();
        if (!e.repeat) triggerJump();
      } else if (code === "ShiftLeft" || code === "ShiftRight") {
        choreographer.setManualInput({ sprint: true });
      } else if (code === "KeyC") {
        e.preventDefault();
        if (!e.repeat) triggerSitStand();
      } else if (code === "KeyB") {
        e.preventDefault();
        if (!e.repeat) triggerBackflip();
      } else if (code === "KeyX") {
        e.preventDefault();
        if (!e.repeat) triggerDance();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.delete(e.code);
        return next;
      });
      if (e.code === "KeyW" || e.code === "ArrowUp") choreographer.setManualInput({ forward: false });
      if (e.code === "KeyS" || e.code === "ArrowDown") choreographer.setManualInput({ backward: false });
      if (e.code === "KeyA" || e.code === "ArrowLeft") choreographer.setManualInput({ left: false });
      if (e.code === "KeyD" || e.code === "ArrowRight") choreographer.setManualInput({ right: false });
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") choreographer.setManualInput({ sprint: false });
    };

    const clearMovement = () =>
      choreographer.setManualInput({ forward: false, backward: false, left: false, right: false, sprint: false });

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", clearMovement);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", clearMovement);
      clearMovement();
    };
  }, []);

  useEffect(() => {
    speechService.playChime("startup");

    choreographer.setStatusListener((s) => {
      setStatus(s);

      // Check story quest progression
      const storyRes = storyEngine.checkPlayerPosition(s.pos);
      if (storyRes.justCompleted && storyRes.chapter) {
        speechService.speak(storyRes.chapter.completionDialogue, () => {
          choreographer.parseAndQueue(storyRes.chapter!.rewardAction);
        });
        setActiveStoryDialogue({
          title: "Quest Milestone Achieved! 🏆",
          subtitle: storyRes.chapter.title,
          text: storyRes.chapter.completionDialogue,
          badge: storyRes.chapter.rewardBadge,
        });
      }
    });
    phoneAudioBridge.onCommand((command) => void handleSubmit(command));
    phoneAudioBridge.onRemoteStream((stream) => {
      if (phoneStreamAudioRef.current) {
        phoneStreamAudioRef.current.srcObject = stream;
        phoneStreamAudioRef.current.play().catch(() => {});
      }
      setPhoneAudioStatus("Phone microphone connected");
    });
    phoneAudioBridge.onStatus(setPhoneAudioStatus);
    const relaySpeech = (event: Event) => {
      const text = (event as CustomEvent<string>).detail;
      if (text) phoneAudioBridge.send("speech", text);
    };
    window.addEventListener("atlas-speech", relaySpeech);

    storyEngine.setStoryListener((st) => {
      setStoryState(st);
    });

    const unsubLip = speechService.onLipSync((lip) => {
      setIsSpeaking(lip.speaking);
    });

    const unsubAudio = audioDetector.subscribe((ev: AudioBeatEvent) => {
      if (ev.bpm) setCurrentBpm(ev.bpm);
    });

    return () => {
      unsubLip();
      unsubAudio();
      audioDetector.stopMicListening();
      audioDetector.stopAudioFile();
      speechService.stopSpeaking();
      speechService.setContinuousMode(false);
      window.removeEventListener("atlas-speech", relaySpeech);
      phoneAudioBridge.onCommand(null);
      phoneAudioBridge.onRemoteStream(null);
      phoneAudioBridge.onStatus(null);
      phoneAudioBridge.close();
    };
  }, []);

  const createPhoneOffer = async () => {
    try {
      const pairing = await phoneAudioBridge.createPairing();
      setPhoneLink(pairing.link);
      setPhoneQr(await QRCode.toDataURL(pairing.link, { width: 220, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } }));
      setPhoneAudioStatus("Scan the QR code or open the secure pairing link on your phone.");
    } catch { setPhoneAudioStatus("Could not create the phone pairing session."); }
  };

  useEffect(() => {
    if (!activeStoryDialogue) return;
    const timer = setTimeout(() => {
      setActiveStoryDialogue(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [activeStoryDialogue]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Camera preset controls with smooth transitions
  const setCameraPreset = (view: CameraView) => {
    setCameraView(view);
    if (!orbitRef.current) return;
    const controls = orbitRef.current;

    if (view === "follow") {
      const forwardX = Math.sin(status.yaw);
      const forwardZ = Math.cos(status.yaw);
      controls.target.set(status.pos[0], status.pos[1] + 1.2, status.pos[2]);
      controls.object.position.set(
        status.pos[0] - forwardX * 7.2,
        status.pos[1] + 3.6,
        status.pos[2] - forwardZ * 7.2,
      );
    } else if (view === "overview") {
      controls.target.set(0, 1.5, 3.0);
      controls.object.position.set(15.5, 13.0, 22.0);
    } else if (view === "closeup") {
      controls.target.set(status.pos[0], status.pos[1] + 1.4, status.pos[2]);
      controls.object.position.set(
        status.pos[0],
        status.pos[1] + 1.6,
        status.pos[2] + 2.4,
      );
    } else if (view === "fountain") {
      controls.target.set(
        PARK_LANDMARKS.fountain[0],
        1.2,
        PARK_LANDMARKS.fountain[2],
      );
      controls.object.position.set(
        PARK_LANDMARKS.fountain[0],
        3.2,
        PARK_LANDMARKS.fountain[2] + 6.8,
      );
    } else if (view === "gazebo") {
      controls.target.set(
        PARK_LANDMARKS.gazebo[0],
        1.6,
        PARK_LANDMARKS.gazebo[2],
      );
      controls.object.position.set(
        PARK_LANDMARKS.gazebo[0] - 5.5,
        4.2,
        PARK_LANDMARKS.gazebo[2] + 8.5,
      );
    } else if (view === "lake") {
      controls.target.set(
        PARK_LANDMARKS.lakePier[0],
        0.8,
        PARK_LANDMARKS.lakePier[2],
      );
      controls.object.position.set(
        PARK_LANDMARKS.lakePier[0] + 6.5,
        3.8,
        PARK_LANDMARKS.lakePier[2] + 7.5,
      );
    } else if (view === "bench") {
      controls.target.set(
        PARK_LANDMARKS.mainBench[0],
        0.8,
        PARK_LANDMARKS.mainBench[2],
      );
      controls.object.position.set(
        PARK_LANDMARKS.mainBench[0] + 2.8,
        2.4,
        PARK_LANDMARKS.mainBench[2] + 4.2,
      );
    } else if (view === "top") {
      controls.target.set(0, 0, 0);
      controls.object.position.set(0, 42.0, 4.0);
    }
    controls.update();
  };

  // Dedicated Camera Orbit Angle Controller (The Angle Pad)
  const adjustCameraAngle = (deltaTheta: number, deltaPhi: number) => {
    if (!orbitRef.current) return;
    const controls = orbitRef.current;
    const cam = controls.object;
    const target = controls.target;
    const offset = new THREE.Vector3().subVectors(cam.position, target);
    let radius = offset.length();
    if (radius < 0.5) radius = 2.0;
    let theta = Math.atan2(offset.x, offset.z);
    let phi = Math.acos(Math.max(-0.999, Math.min(0.999, offset.y / radius)));

    theta += deltaTheta;
    phi = Math.max(0.12, Math.min(Math.PI / 2 - 0.05, phi + deltaPhi));

    offset.x = radius * Math.sin(phi) * Math.sin(theta);
    offset.y = radius * Math.cos(phi);
    offset.z = radius * Math.sin(phi) * Math.cos(theta);

    cam.position.copy(target).add(offset);
    cam.lookAt(target);
    controls.update();
  };

  // Smoothly Focus View Near Robot (Close-up)
  const focusNearRobot = () => {
    if (!orbitRef.current) return;
    const controls = orbitRef.current;
    const cam = controls.object;
    controls.target.set(status.pos[0], status.pos[1] + 1.25, status.pos[2]);
    cam.position.set(status.pos[0], status.pos[1] + 1.6, status.pos[2] + 2.6);
    cam.lookAt(controls.target);
    controls.update();
    setCameraView("closeup");
  };

  // Dedicated Zoom In / Out Controls
  const handleZoomIn = () => {
    if (!orbitRef.current) return;
    const controls = orbitRef.current;
    const cam = controls.object;
    const target = controls.target;
    const dist = cam.position.distanceTo(target);
    if (dist > 1.2) {
      cam.position.lerp(target, 0.28);
      controls.update();
    }
  };

  const handleZoomOut = () => {
    if (!orbitRef.current) return;
    const controls = orbitRef.current;
    const cam = controls.object;
    const target = controls.target;
    const dir = new THREE.Vector3()
      .subVectors(cam.position, target)
      .normalize();
    cam.position.addScaledVector(dir, 3.2);
    controls.update();
  };

  const handleResetCamera = () => {
    setCameraPreset(cameraView);
  };

  // Handle Command Submission
  const handleSubmit = async (textToRun = inputText) => {
    const text = textToRun.trim();
    if (!text) return;

    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setMessages((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        sender: "user",
        text,
        timestamp: time,
        type: "chat",
      },
    ]);
    setInputText("");

    const nearby = LANDMARK_ITEMS.reduce(
      (closest, item) => {
        const d = Math.hypot(
          status.pos[0] - item.pos[0],
          status.pos[2] - item.pos[2],
        );
        return d < closest.dist ? { name: item.name, dist: d } : closest;
      },
      { name: "Grand Plaza", dist: Infinity },
    );

    const response = await aiBrain.thinkAndAct(
      text,
      {
        avatarType,
        position: status.pos,
        yaw: status.yaw,
        nearbyLandmark: nearby.name,
        currentQuest: storyState.currentChapter.subtitle,
      },
      () => {
        setIsSpeaking(true);
      },
    );

    if (response.camera && response.camera !== cameraView) {
      setCameraPreset(response.camera);
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `r-${Date.now()}`,
        sender: "robot",
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        type: "chat",
        plan: response.plan,
      },
    ]);
  };

  // DIRECT TAP-TO-TALK
  const toggleVoice = () => {
    if (isContinuousVoice) {
      speechService.setContinuousMode(false);
      setIsContinuousVoice(false);
      setIsListening(false);
      return;
    }

    if (isListening) {
      speechService.commitSpeechResult();
      setIsListening(false);
    } else {
      speechService.stopSpeaking();
      speechService.listen(
        (finalTranscript) => {
          setIsListening(false);
          setInputText(finalTranscript);
          handleSubmit(finalTranscript);
        },
        (interim) => {
          setInputText(interim);
        },
        (active) => setIsListening(active),
      );
    }
  };

  // HANDS-FREE CONTINUOUS DUPLEX VOICE CONVERSATION
  const toggleContinuousVoice = () => {
    if (isContinuousVoice) {
      speechService.setContinuousMode(false);
      setIsContinuousVoice(false);
      setIsListening(false);
      speechService.speak("Hands-free continuous voice paused.");
    } else {
      speechService.stopSpeaking();
      setIsContinuousVoice(true);
      setIsListening(true);
      const greeting =
        avatarType === "human"
          ? "Continuous conversation active! Talk to me anytime, I am listening."
          : "Duplex voice channel open. Speak freely, I will listen and execute.";

      speechService.speak(greeting, () => {
        speechService.setContinuousMode(true, async (transcript) => {
          setIsListening(false);
          setInputText(transcript);
          await handleSubmit(transcript);
        }, (active) => {
          setIsListening(active);
          if (!active && !speechService.isContinuousMode()) {
            setIsContinuousVoice(false);
            const error = speechService.getLastListeningError();
            if (error) {
              setMessages((prev) => [
                ...prev,
                {
                  id: `voice-error-${Date.now()}`,
                  sender: "robot",
                  text: `Voice input stopped (${error}). In Chrome/Edge, allow microphone access and reload. You can still type a command.`,
                  timestamp: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  type: "chat",
                },
              ]);
            }
          }
        }, (interim) => setInputText(interim));
      });
    }
  };

  // Toggle Live Room Music Listener
  const toggleMicMusic = async () => {
    if (isMicMusicListening) {
      audioDetector.stopMicListening();
      setIsMicMusicListening(false);
    } else {
      const ok = await audioDetector.startMicListening();
      if (ok) {
        setIsMicMusicListening(true);
        speechService.speak(
          "Listening for room music! Play any song and I will groove.",
        );
      }
    }
  };

  // Audio File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = await audioDetector.loadAudioFile(file);
    setUploadedFileName(name);
    audioDetector.playAudioFile();
    setIsFilePlaying(true);
    choreographer.parseAndQueue("dance on hip hop to uploaded music");
    speechService.speak(`Loaded ${name}. Let's groove in the park!`);
  };

  const toggleUploadedMusic = () => {
    if (isFilePlaying) {
      audioDetector.pauseAudioFile();
      setIsFilePlaying(false);
    } else {
      audioDetector.playAudioFile();
      setIsFilePlaying(true);
      choreographer.parseAndQueue("dance on beat");
    }
  };

  const startDanceLesson = (lesson: DanceLesson) => {
    setShowCoachModal(false);
    speechService.speak(lesson.narration, () => {
      choreographer.parseAndQueue(`dance ${lesson.title}`);
    });
  };

  // Architectural Map coordinate calculation (covers 240m park, [-46, +46] meter active landmarks)
  const mapSpan = 46;
  const mapRobotX = Math.max(
    8,
    Math.min(92, 50 + (status.pos[0] / mapSpan) * 42),
  );
  const mapRobotY = Math.max(
    8,
    Math.min(92, 50 + (status.pos[2] / mapSpan) * 42),
  );

  const toArchitecturalMap = (coord: [number, number, number]) => {
    const rx = Math.max(8, Math.min(92, 50 + (coord[0] / mapSpan) * 42));
    const ry = Math.max(8, Math.min(92, 50 + (coord[2] / mapSpan) * 42));
    return { left: `${rx}%`, top: `${ry}%` };
  };

  const getDistanceMeters = (targetPos: [number, number, number]) => {
    const dx = status.pos[0] - targetPos[0];
    const dz = status.pos[2] - targetPos[2];
    return Math.round(Math.hypot(dx, dz));
  };

  const LANDMARK_ITEMS = [
    {
      id: "fountain",
      name: "Grand Water Fountain",
      shortName: "Fountain",
      zone: "Central Plaza",
      pos: PARK_LANDMARKS.fountain,
      color: "#0284c7",
      icon: Waves,
      action: "walk to the water fountain",
    },
    {
      id: "lakePier",
      name: "Lakeside Pier & Dock",
      shortName: "Lake Pier",
      zone: "Scenic Lagoon",
      pos: PARK_LANDMARKS.lakePier,
      color: "#0ea5e9",
      icon: Waves,
      action: "walk to the lake pier",
    },
    {
      id: "gazebo",
      name: "Classical Wooden Gazebo",
      shortName: "Gazebo",
      zone: "Cedar Pavilion",
      pos: PARK_LANDMARKS.gazebo,
      color: "#d97706",
      icon: Home,
      action: "walk to the gazebo",
    },
    {
      id: "cherryTree",
      name: "Sakura Cherry Blossom Grove",
      shortName: "Sakura Grove",
      zone: "Zen Shinto Garden",
      pos: PARK_LANDMARKS.cherryTree,
      color: "#ec4899",
      icon: Flower2,
      action: "walk to the cherry blossom tree",
    },
    {
      id: "pineGrove",
      name: "Austrian Pine Mountain Woods",
      shortName: "Pine Forest",
      zone: "Evergreen Ridge",
      pos: PARK_LANDMARKS.pineGrove,
      color: "#15803d",
      icon: Trees,
      action: "walk to the pine tree",
    },
    {
      id: "workoutStation",
      name: "Calisthenics Gym Station",
      shortName: "Workout Gym",
      zone: "Outdoor Fitness",
      pos: PARK_LANDMARKS.workoutStation,
      color: "#e11d48",
      icon: Dumbbell,
      action: "walk to the workout station and do pushups",
    },
    {
      id: "willowStream",
      name: "Arched Willow Footbridge",
      shortName: "Willow Bridge",
      zone: "River Crossing",
      pos: PARK_LANDMARKS.willowStream,
      color: "#0d9488",
      icon: Navigation,
      action: "walk to the willow stream",
    },
    {
      id: "mainBench",
      name: "Teak Rest Bench",
      shortName: "Teak Bench",
      zone: "Garden Terrace",
      pos: PARK_LANDMARKS.mainBench,
      color: "#b45309",
      icon: Armchair,
      action: "go and sit on the bench",
    },
  ];

  return (
    <div className={`apple-studio ${isIntroTour ? "is-intro-tour" : ""}`}>
      {/* APPLE VISIONOS GLASS TOPBAR */}
      <header className="apple-topbar">
        {/* Topbar Left: Brand & Avatar Switcher */}
        <div className="topbar-left">
          <div className="brand-group">
            <div className="apple-logo-badge">
              {avatarType === "human" ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className="brand-titles">
              <span className="product-name">Atlas</span>
              <span className="product-badge">
                {avatarType === "human" ? "Human Companion" : "Tesla Optimus"}
              </span>
            </div>
          </div>

          <div className="avatar-switcher-capsule">
            <button
              className={`avatar-choice-btn ${avatarType === "human" ? "active" : ""}`}
              onClick={() => {
                setAvatarType("human");
                speechService.speak("Human companion activated.");
              }}
              title="Switch to Stylish Human Companion"
            >
              <User size={12} />
              <span>Human</span>
            </button>
            <button
              className={`avatar-choice-btn ${avatarType === "robot" ? "active" : ""}`}
              onClick={() => {
                setAvatarType("robot");
                speechService.speak("Tesla Optimus robot activated.");
              }}
              title="Switch to Tesla Optimus Robot"
            >
              <Bot size={12} />
              <span>Robot</span>
            </button>
          </div>
        </div>

        {/* Topbar Center: Camera View Selector & Dynamic Quest Island */}
        <div className="topbar-center">
          {/* VisionOS Camera Perspective Selector */}
          <div className="camera-select-wrapper">
            <button
              className="capsule clickable camera-select-pill"
              onClick={() => setShowCameraMenu(!showCameraMenu)}
              title="Switch Camera Preset View"
            >
              <Eye size={12} className="text-blue" />
              <span>
                {CAMERA_OPTIONS.find((c) => c.id === cameraView)?.label ||
                  "Follow Companion"}
              </span>
              <ChevronDown
                size={11}
                className={`transition-transform duration-200 ${
                  showCameraMenu ? "rotate-180 text-blue" : "text-muted"
                }`}
              />
            </button>

            {showCameraMenu && (
              <div className="camera-dropdown-menu">
                {CAMERA_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    className={`camera-menu-item ${
                      cameraView === opt.id ? "active" : ""
                    }`}
                    onClick={() => {
                      setCameraPreset(opt.id);
                      setShowCameraMenu(false);
                    }}
                  >
                    <Eye
                      size={12}
                      className={
                        cameraView === opt.id ? "text-blue" : "text-muted"
                      }
                    />
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div
            className="capsule story-quest-capsule clickable"
            onClick={() => setShowStoryModal(true)}
            title="Chronicles of Cyber Park - Open Quest Journal"
          >
            <Trophy size={13} className="text-amber-400" />
            <span>
              {storyState.isFinished
                ? "Quests Complete! 🏆"
                : `${storyState.currentChapter.subtitle} · ${storyState.distanceToTarget}m`}
            </span>
          </div>

          {status.obstacleAlert && (
            <div
              className="capsule obstacle-badge-capsule animate-pulse"
              title="Obstacle Proximity Barrier"
            >
              <ShieldAlert size={12} className="text-amber-500" />
              <span>{status.obstacleAlert}</span>
            </div>
          )}
        </div>

        {/* Topbar Right: Telemetry & Actions */}
        <div className="topbar-right">
          <div
            className="capsule heading-capsule"
            title="Live Character Heading and GPS Position"
          >
            <Compass size={12} className="text-blue" />
            <span>
              {Math.round(((((status.yaw * 180) / Math.PI) % 360) + 360) % 360)}
              ° {getHeadingLabel(status.yaw)}
            </span>
          </div>

          <div
            className={`capsule clickable ${isContinuousVoice ? "continuous-voice-active" : ""}`}
            onClick={toggleContinuousVoice}
            title={
              isContinuousVoice
                ? "Continuous Duplex Voice Active (Click to pause)"
                : "Enable Continuous Hands-Free Voice"
            }
          >
            <Mic
              size={12}
              className={isContinuousVoice ? "text-cyan-400 animate-pulse" : ""}
            />
            <span>{isContinuousVoice ? "Hands-Free: On" : "Hands-Free"}</span>
          </div>

          <button
            className={`apple-icon-btn ${showPhoneAudio ? "active" : ""}`}
            onClick={() => setShowPhoneAudio(!showPhoneAudio)}
            title="Pair phone microphone and speaker"
          >
            <Smartphone size={15} />
          </button>

          <button
            className={`apple-icon-btn ${isMicMusicListening ? "active" : ""}`}
            onClick={toggleMicMusic}
            title={
              isMicMusicListening ? "Room Beats: Live" : "Listen Room Beats"
            }
          >
            <Radio
              size={15}
              className={isMicMusicListening ? "text-blue" : ""}
            />
          </button>

          <button
            className="apple-icon-btn"
            onClick={() => setShowCoachModal(true)}
            title="AI Movement & Dance Coach"
          >
            <GraduationCap size={15} />
          </button>

          <button
            className={`apple-icon-btn ${audioMuted ? "active" : ""}`}
            onClick={() => {
              const nextMute = !audioMuted;
              setAudioMuted(nextMute);
              speechService.setMuted(nextMute);
            }}
            title={audioMuted ? "Unmute Audio & Voice" : "Mute Audio & Voice"}
          >
            {audioMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          <button
            className="apple-icon-btn"
            onClick={() => {
              choreographer.stopAll();
              if (status.isSitting) choreographer.standUp();
              speechService.playChime("complete");
            }}
            title="Reset to Idle Position"
          >
            <RotateCcw size={15} />
          </button>

          <button
            className={`apple-icon-btn ${showLogDrawer ? "active" : ""}`}
            onClick={() => setShowLogDrawer(!showLogDrawer)}
            title="Toggle Dialogue & Kinematics Log"
          >
            <MessageSquare size={15} />
          </button>
        </div>
      </header>

      {/* 3D FULL-BLEED GRAND CYBER PARK VIEWPORT */}
      <div className="viewport-stage">
        <audio ref={phoneStreamAudioRef} autoPlay />
        {showPhoneAudio && (
          <aside className="apple-drawer" style={{ right: 24, top: 76, bottom: "auto", width: 400, zIndex: 40 }}>
            <div className="drawer-head">
              <div className="drawer-title-group"><Smartphone size={16} className="text-blue" /><span className="drawer-title">Phone audio bridge</span></div>
              <button className="drawer-close-btn" onClick={() => setShowPhoneAudio(false)}>✕</button>
            </div>
            <div style={{ padding: 18, display: "grid", gap: 12 }}>
              <p style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.5 }}>Use your phone as Atlas’s wireless microphone, speaker, or both. Pair in one scan—no pasted offers or answers. WebRTC carries the audio directly; Socket.IO only introduces the two devices.</p>
              <button className="apple-icon-btn" style={{ width: "100%", height: 38, fontWeight: 650 }} onClick={createPhoneOffer}>Create secure phone pairing</button>
              {phoneQr && <div style={{ display: "grid", justifyItems: "center", gap: 8, padding: 12, borderRadius: 14, background: "#fff", border: "1px solid var(--line)" }}><img src={phoneQr} alt="QR code to pair this phone with Atlas" width={180} height={180} /><span style={{ fontSize: 11, color: "var(--muted)" }}>Scan with your phone camera</span></div>}
              {phoneLink && <><label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>Pairing link</label><div style={{ display: "flex", gap: 8 }}><input value={phoneLink} readOnly aria-label="Phone pairing link" style={{ minWidth: 0, flex: 1, fontSize: 11, padding: "9px 10px", borderRadius: 8, border: "1px solid var(--line)" }} /><button className="apple-icon-btn" style={{ height: 34, padding: "0 11px" }} onClick={() => navigator.clipboard.writeText(phoneLink)}>Copy</button></div></>}
              <span aria-live="polite" style={{ fontSize: 12, color: "var(--blue)", lineHeight: 1.4 }}>{phoneAudioStatus}</span>
            </div>
          </aside>
        )}
        {isIntroTour && (
          <CinematicIntro
            stage={introStage}
            onSkip={() => setIsIntroTour(false)}
          />
        )}
        {/* ARCHITECTURAL PARK MINI-MAP (Clear zones, visible spots, distances, & click-to-walk) */}
        {showMap ? (
          <>
          <div className="map-side-panel-stack">
          <div className="park-architectural-map-card">
            <div className="map-head">
              <div className="map-title-group">
                <Compass size={14} className="text-blue" />
                <span className="map-title">Architectural Map</span>
                <span className="map-scale-chip">240m Park</span>
              </div>
              <div className="map-actions">
                <button
                  className="map-action-btn"
                  onClick={() => setShowExpandedMap(true)}
                  title="Expand Full Park Blueprint"
                >
                  <Maximize2 size={12} />
                </button>
                <button
                  className="map-action-btn"
                  onClick={() => setShowMap(false)}
                  title="Minimize Map"
                >
                  <Minimize2 size={12} />
                </button>
              </div>
            </div>

            {/* Visual 2D Architectural Layout Container */}
            <div className="architectural-canvas">
              {/* Grid guide lines */}
              <div className="map-grid-overlay" />

              {/* Zone: Central Grand Marble Plaza */}
              <div
                className="zone-marble-plaza"
                title="Grand Central Marble Plaza (24m)"
              />

              {/* Zone: Scenic Lake Lagoon */}
              <div
                className="zone-lake-lagoon"
                title="Scenic Lake Lagoon & Wooden Pier"
              />

              {/* Zone: Winding Willow Stream */}
              <div
                className="zone-willow-stream"
                title="Winding River Stream & Arched Bridge"
              />

              {/* Zone: Sakura Cherry Blossom Grove */}
              <div
                className="zone-sakura-grove"
                title="Sakura Cherry Blossom Shrine"
              />

              {/* Zone: Austrian Pine Woods */}
              <div
                className="zone-pine-woods"
                title="Tall Austrian Pine Mountain Woods"
              />

              {/* Zone: Classical Gazebo Pavilion */}
              <div
                className="zone-gazebo-pavilion"
                title="Classical Cedar Gazebo Pavilion"
              />

              {/* Zone: Calisthenics Gym */}
              <div
                className="zone-gym-station"
                title="Outdoor Calisthenics Gym"
              />

              {/* Interactive Landmark Pins */}
              {LANDMARK_ITEMS.map((lm) => {
                const dist = getDistanceMeters(lm.pos);
                const IconComponent = lm.icon;
                return (
                  <div
                    key={lm.id}
                    className={`landmark-pin-group ${lm.id}-pin`}
                    style={toArchitecturalMap(lm.pos)}
                    onClick={() => handleSubmit(lm.action)}
                    title={`${lm.name} (${dist}m) · Click to walk`}
                  >
                    <div className="pin-dot" style={{ borderColor: lm.color }}>
                      <IconComponent size={9} style={{ color: lm.color }} />
                    </div>
                    <div className="pin-label-badge">
                      <span className="pin-name">{lm.shortName}</span>
                      <span className="pin-dist">{dist}m</span>
                    </div>
                  </div>
                );
              })}

              {/* LIVE 60FPS ROBOT ARCHITECTURAL BLIP */}
              <div
                className="robot-map-avatar"
                style={{
                  left: `${mapRobotX}%`,
                  top: `${mapRobotY}%`,
                  transform: `translate(-50%, -50%) rotate(${status.yaw}rad)`,
                }}
              >
                <span className="robot-pulse-ring" />
                <span className="robot-heading-arrow" />
                <span className="robot-core-blip" />
              </div>
            </div>

            {/* Quick Landmark Navigator Strip with Live Distances */}
            <div className="map-quick-nav">
              {LANDMARK_ITEMS.slice(0, 6).map((lm) => {
                const dist = getDistanceMeters(lm.pos);
                return (
                  <button
                    key={lm.id}
                    className="quick-spot-btn"
                    onClick={() => handleSubmit(lm.action)}
                    title={`Navigate to ${lm.name}`}
                  >
                    <span>{lm.shortName}</span>
                    <span className="spot-dist">{dist}m</span>
                  </button>
                );
              })}
            </div>

          </div>
          <aside className="map-creator-credit" aria-label="Project creators">
            <div className="creator-credit-label">
              <Award size={15} />
              <span>Created with care by</span>
            </div>
            <div className="creator-list">
              {[
                "Aditya Sarode",
                "Sanket Mesta",
                "Saloni B",
                "Aditi Patil",
                "Swayam R",
              ].map((creator, index) => (
                <span className="creator-chip" key={creator}>
                  <span className={`creator-initial creator-${index}`}>
                    {creator.charAt(0)}
                  </span>
                  {creator}
                </span>
              ))}
            </div>
          </aside>
          </div>
          </>
        ) : (
          <button
            className="map-restore-btn"
            onClick={() => setShowMap(true)}
            title="Open Architectural Park Map"
          >
            <Compass size={16} className="text-blue" />
            <span>Park Map</span>
          </button>
        )}

        {/* BOTTOM-LEFT: UNIFIED CYBER CONTROL DECK (Viewing Angle Pad & Keyboard Controls in one clean card) */}
        {showControlDeck ? (
          <div className="unified-control-deck">
            {/* Top Bar with Segmented Tab Switcher */}
            <div className="deck-header">
              <div className="deck-tabs">
                <button
                  className={`deck-tab-btn ${controlDeckTab === "camera" ? "active" : ""}`}
                  onClick={() => setControlDeckTab("camera")}
                  title="Switch to Camera Viewing Angle Pad"
                >
                  <Eye size={12} />
                  <span>Angle</span>
                </button>
                <button
                  className={`deck-tab-btn ${controlDeckTab === "keys" ? "active" : ""}`}
                  onClick={() => setControlDeckTab("keys")}
                  title="Switch to Keyboard Keys & Controls"
                >
                  <Keyboard size={12} />
                  <span>Keys</span>
                </button>
              </div>
              <button
                className="deck-min-btn"
                onClick={() => setShowControlDeck(false)}
                title="Minimize Deck"
              >
                <Minimize2 size={11} />
              </button>
            </div>

            {/* TAB 1: CAMERA VIEWING ANGLE */}
            {controlDeckTab === "camera" && (
              <div className="deck-body camera-deck">
                {/* 4-Way Seeing Angle Directional Controls */}
                <div className="angle-grid">
                  <button
                    className="angle-btn up"
                    onClick={() => adjustCameraAngle(0, -0.18)}
                    title="Tilt Seeing Angle Up"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <div className="angle-mid">
                    <button
                      className="angle-btn left"
                      onClick={() => adjustCameraAngle(-0.32, 0)}
                      title="Orbit Seeing Angle Left"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <button
                      className="angle-btn center-focus"
                      onClick={focusNearRobot}
                      title="Focus Near Robot (Close-up view)"
                    >
                      <Crosshair size={13} />
                      <span>Near</span>
                    </button>
                    <button
                      className="angle-btn right"
                      onClick={() => adjustCameraAngle(0.32, 0)}
                      title="Orbit Seeing Angle Right"
                    >
                      <ArrowRight size={16} />
                    </button>
                  </div>
                  <button
                    className="angle-btn down"
                    onClick={() => adjustCameraAngle(0, 0.18)}
                    title="Tilt Seeing Angle Down"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>

                {/* Quick Shortcuts */}
                <div className="angle-shortcuts">
                  <button
                    className="angle-shortcut-btn"
                    onClick={handleZoomIn}
                    title="Zoom In (+)"
                  >
                    <Plus size={12} />
                    <span>In</span>
                  </button>
                  <button
                    className="angle-shortcut-btn"
                    onClick={handleZoomOut}
                    title="Zoom Out (-)"
                  >
                    <Minus size={12} />
                    <span>Out</span>
                  </button>
                  <button
                    className="angle-shortcut-btn"
                    onClick={() => adjustCameraAngle(Math.PI, 0)}
                    title="Orbit 180° to Opposite Side"
                  >
                    <Orbit size={12} />
                    <span>180°</span>
                  </button>
                  <button
                    className="angle-shortcut-btn"
                    onClick={handleResetCamera}
                    title="Recenter Camera View"
                  >
                    <RotateCcw size={12} />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: KEYBOARD CONTROLS & SHORTCUTS */}
            {controlDeckTab === "keys" && (
              <div className="deck-body keys-deck">
                <div className="key-legend-grid">
                  <button
                    className={`key-chip ${activeKeys.has("KeyW") || activeKeys.has("ArrowUp") ? "active-key" : ""}`}
                    onClick={() => triggerMoveForward(false)}
                    title="Walk Forward [W / ↑]"
                  >
                    <kbd>W</kbd>
                    <kbd>↑</kbd>
                    <span>Walk</span>
                  </button>
                  <button
                    className={`key-chip ${activeKeys.has("KeyS") || activeKeys.has("ArrowDown") ? "active-key" : ""}`}
                    onClick={triggerMoveBackward}
                    title="Step Backward [S / ↓]"
                  >
                    <kbd>S</kbd>
                    <kbd>↓</kbd>
                    <span>Back</span>
                  </button>
                  <button
                    className={`key-chip ${activeKeys.has("KeyA") || activeKeys.has("ArrowLeft") ? "active-key" : ""}`}
                    onClick={triggerTurnLeft}
                    title="Turn Left [A / ←]"
                  >
                    <kbd>A</kbd>
                    <kbd>←</kbd>
                    <span>Left</span>
                  </button>
                  <button
                    className={`key-chip ${activeKeys.has("KeyD") || activeKeys.has("ArrowRight") ? "active-key" : ""}`}
                    onClick={triggerTurnRight}
                    title="Turn Right [D / →]"
                  >
                    <kbd>D</kbd>
                    <kbd>→</kbd>
                    <span>Right</span>
                  </button>
                  <button
                    className={`key-chip ${activeKeys.has("Space") ? "active-key" : ""}`}
                    onClick={triggerJump}
                    title="Ballistic Jump [Space]"
                  >
                    <kbd>Space</kbd>
                    <span>Jump</span>
                  </button>
                  <button
                    className={`key-chip ${activeKeys.has("ShiftLeft") || activeKeys.has("ShiftRight") ? "active-key" : ""}`}
                    onClick={() => triggerMoveForward(true)}
                    title="Fast Sprint [Shift]"
                  >
                    <kbd>Shift</kbd>
                    <span>Sprint</span>
                  </button>
                  <button
                    className={`key-chip ${activeKeys.has("KeyC") ? "active-key" : ""}`}
                    onClick={triggerSitStand}
                    title="Sit on Bench or Stand Up [C]"
                  >
                    <kbd>C</kbd>
                    <span>{status.isSitting ? "Stand" : "Sit"}</span>
                  </button>
                  <button
                    className={`key-chip ${activeKeys.has("KeyB") ? "active-key" : ""}`}
                    onClick={triggerBackflip}
                    title="Backflip & Superhero Landing [B]"
                  >
                    <kbd>B</kbd>
                    <span>Flip</span>
                  </button>
                  <button
                    className={`key-chip ${activeKeys.has("KeyX") ? "active-key" : ""}`}
                    onClick={triggerDance}
                    title="Hip Hop Dance [X]"
                  >
                    <kbd>X</kbd>
                    <span>Dance</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            className="unified-deck-restore-btn"
            onClick={() => setShowControlDeck(true)}
            title="Open Controls (Angle Pad & Keyboard Keys)"
          >
            <Eye size={15} className="text-blue" />
            <Keyboard size={15} />
            <span>Controls</span>
          </button>
        )}

        {/* Dynamic Voice Waveform HUD Indicator */}
        {isSpeaking && (
          <div className="speech-hud-capsule">
            <div className="soundwave-bars">
              <span className="bar b1" />
              <span className="bar b2" />
              <span className="bar b3" />
              <span className="bar b4" />
            </div>
            <span>
              {avatarType === "human" ? "Companion Speaking" : "Atlas Speaking"}
            </span>
          </div>
        )}

        {/* STORY CHAPTER MILESTONE HUD BANNER */}
        {activeStoryDialogue && (
          <div className="story-milestone-banner">
            <div className="milestone-badge-icon">
              <Award size={20} className="text-amber-400" />
            </div>
            <div className="milestone-content">
              <div className="milestone-header">
                <span className="milestone-title">
                  {activeStoryDialogue.title}
                </span>
                {activeStoryDialogue.badge && (
                  <span className="milestone-badge-tag">
                    {activeStoryDialogue.badge}
                  </span>
                )}
              </div>
              <p className="milestone-text">{activeStoryDialogue.text}</p>
            </div>
            <button
              className="milestone-close-btn"
              onClick={() => setActiveStoryDialogue(null)}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* 3D WebGL Three.js Canvas */}
        <Canvas
          shadows="basic"
          camera={{ position: [-2.4, 3.6, 11.7], fov: 47 }}
          dpr={[1, 1.35]}
          gl={{
            antialias: false,
            powerPreference: "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
          }}
        >
          <fog attach="fog" args={["#c7e0e4", 38, 142]} />
          <hemisphereLight args={["#dff3ff", "#315b3b", 1.15]} />
          <ambientLight intensity={0.72} />
          <directionalLight
            position={[12, 22, 10]}
            intensity={3.4}
            color="#fff8ed"
            castShadow
            shadow-normalBias={0.035}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-near={0.5}
            shadow-camera-far={50}
            shadow-camera-left={-28}
            shadow-camera-right={28}
            shadow-camera-top={28}
            shadow-camera-bottom={-28}
          />
          <directionalLight
            position={[-10, 12, -8]}
            intensity={0.7}
            color="#dbeafe"
          />

          <Sky
            distance={450000}
            sunPosition={[12, 22, 10]}
            inclination={0.62}
            azimuth={0.28}
            turbidity={7}
            rayleigh={1.4}
            mieCoefficient={0.006}
            mieDirectionalG={0.82}
          />

          <CinematicMist />

          {/* Grand Cyber Park Environment (Fountain, Lake, Pier, Gazebo, Sakura, Forest, Benches, Gardens) */}
          <ParkEnvironment activeChapterIndex={storyState.chapterIndex} />

          {/* CHARACTER AVATAR: STYLISH HUMAN COMPANION OR TESLA OPTIMUS */}
          <Suspense fallback={null}>
            {avatarType === "human" ? (
              <HumanCharacterModel />
            ) : (
              <TeslaOptimusModel />
            )}
          </Suspense>

          {/* Dynamic Camera Director */}
          <CameraDirector
            cameraView={cameraView}
            orbitRef={orbitRef}
            robotPos={status.pos}
            robotYaw={status.yaw}
            isCompanionBusy={status.isBusy}
            onIntroComplete={() => setIsIntroTour(false)}
            onIntroStage={setIntroStage}
            skipIntro={!isIntroTour}
          />

          <OrbitControls
            ref={orbitRef}
            enablePan={true}
            enableZoom={true}
            zoomSpeed={1.2}
            minDistance={0.6}
            maxDistance={42}
            maxPolarAngle={Math.PI / 2 - 0.04}
          />
        </Canvas>
      </div>

      {/* FLOATING DIALOGUE & KINEMATICS LOG DRAWER */}
      {showLogDrawer && (
        <aside className="apple-drawer">
          <div className="drawer-head">
            <div className="drawer-title-group">
              <MessageSquare size={16} className="text-blue" />
              <span className="drawer-title">Dialogue & Kinematics</span>
            </div>
            <button
              className="drawer-close-btn"
              onClick={() => setShowLogDrawer(false)}
            >
              ✕
            </button>
          </div>

          <div className="drawer-scroll" ref={chatScrollRef}>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`drawer-msg ${m.sender === "robot" ? "robot" : "user"}`}
              >
                <div className="msg-header">
                  <strong>
                    {m.sender === "robot" ? "Atlas Humanoid" : "You"}
                  </strong>
                  <time>{m.timestamp}</time>
                </div>
                <p>{m.text}</p>
                {m.plan && (
                  <div className="plan-badge-list">
                    {m.plan.phases.map((ph, idx) => (
                      <span key={idx} className="plan-chip">
                        {idx + 1}. {ph.name} ({ph.duration}s)
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* APPLE VISIONOS DYNAMIC ISLAND & ACTION BAR */}
      <div className="dynamic-island-wrapper">
        {/* Quick Action Category Tabs */}
        <div className="category-pill-row">
          <button
            className={`cat-btn ${actionCategory === "all" ? "active" : ""}`}
            onClick={() => setActionCategory("all")}
          >
            Featured
          </button>
          <button
            className={`cat-btn ${actionCategory === "move" ? "active" : ""}`}
            onClick={() => setActionCategory("move")}
          >
            Locomotion
          </button>
          <button
            className={`cat-btn ${actionCategory === "places" ? "active" : ""}`}
            onClick={() => setActionCategory("places")}
          >
            Park Places
          </button>
          <button
            className={`cat-btn ${actionCategory === "stunts" ? "active" : ""}`}
            onClick={() => setActionCategory("stunts")}
          >
            Stunts
          </button>
          <button
            className={`cat-btn ${actionCategory === "dance" ? "active" : ""}`}
            onClick={() => setActionCategory("dance")}
          >
            Dance
          </button>
        </div>

        {/* Suggestion Action Pills (Curated per category, scrollbar strictly hidden) */}
        <div className="suggestion-pills">
          {actionCategory === "all" && (
            <>
              <button onClick={() => handleSubmit("come forward 8 steps")}>
                <Footprints size={12} /> Come Forward
              </button>
              <button
                onClick={() => handleSubmit("step forward 5 steps sprint")}
              >
                <Zap size={12} /> Sprint
              </button>
              <button
                onClick={() => handleSubmit("walk to the water fountain")}
              >
                <Waves size={12} /> Fountain
              </button>
              <button onClick={() => handleSubmit("do a backflip")}>
                <Sparkles size={12} /> Backflip
              </button>
              <button onClick={() => handleSubmit("dance hip hop")}>
                <Sparkles size={12} /> Hip-Hop
              </button>
            </>
          )}

          {actionCategory === "move" && (
            <>
              <button onClick={() => handleSubmit("come forward 8 steps")}>
                <Footprints size={12} /> Come Forward
              </button>
              <button
                onClick={() => handleSubmit("step forward 5 steps sprint")}
              >
                <Zap size={12} /> Sprint Forward
              </button>
              <button onClick={() => handleSubmit("turn around 180 degrees")}>
                Turn 180°
              </button>
              <button onClick={() => handleSubmit("step back 4 steps")}>
                Step Back
              </button>
            </>
          )}

          {actionCategory === "places" && (
            <>
              <button
                onClick={() => handleSubmit("walk to the water fountain")}
              >
                <Waves size={12} /> Fountain
              </button>
              <button onClick={() => handleSubmit("walk to the gazebo")}>
                <Home size={12} /> Gazebo
              </button>
              <button onClick={() => handleSubmit("walk to the lake pier")}>
                <Waves size={12} /> Lakeside Pier
              </button>
              <button onClick={() => handleSubmit("go and sit on the bench")}>
                <Armchair size={12} /> Sit on Bench
              </button>
              <button
                onClick={() => handleSubmit("walk to the cherry blossom tree")}
              >
                <Flower2 size={12} /> Sakura Grove
              </button>
              <button
                onClick={() =>
                  handleSubmit("walk to the workout station and do pushups")
                }
              >
                <Dumbbell size={12} /> Gym Station
              </button>
            </>
          )}

          {actionCategory === "stunts" && (
            <>
              <button onClick={() => handleSubmit("do a backflip")}>
                <Sparkles size={12} /> Backflip
              </button>
              <button
                onClick={() => handleSubmit("three point superhero landing")}
              >
                Superhero Landing
              </button>
              <button
                onClick={() =>
                  handleSubmit("high karate kick and boxing combo")
                }
              >
                Karate Kick
              </button>
              <button onClick={() => handleSubmit("formal royal bow")}>
                Royal Bow
              </button>
              <button onClick={() => handleSubmit("crisp military salute")}>
                Military Salute
              </button>
              <button onClick={() => handleSubmit("do 5 pushups on the grass")}>
                5 Pushups
              </button>
              <button onClick={() => handleSubmit("applaud and cheer")}>
                Clap & Cheer
              </button>
            </>
          )}

          {actionCategory === "dance" && (
            <>
              <button onClick={() => handleSubmit("dance hip hop")}>
                <Sparkles size={12} /> Hip-Hop
              </button>
              <button onClick={() => handleSubmit("cyberpunk air guitar solo")}>
                Air Guitar
              </button>
              <button onClick={() => handleSubmit("moonwalk and spin")}>
                Moonwalk
              </button>
              <button onClick={() => handleSubmit("thriller zombie dance")}>
                Zombie Walk
              </button>
              <button onClick={() => handleSubmit("zen yoga balance")}>
                Yoga Balance
              </button>
            </>
          )}
        </div>

        {/* Active Obstacle Safety Banner */}
        {status.obstacleAlert && (
          <div className="active-obstacle-pill">
            <ShieldAlert size={14} className="text-amber-500 animate-pulse" />
            <span>
              Collision Guard: <strong>{status.obstacleAlert}</strong> ahead ·
              Safe Path Maintained
            </span>
          </div>
        )}

        {/* Dynamic Capsule Command Bar */}
        <div className="dynamic-island">
          {/* Siri-style Interactive Mic Orb */}
          <button
            className={`capsule-mic-btn ${isListening ? "listening" : ""} ${isContinuousVoice ? "continuous-glowing" : ""}`}
            onClick={toggleVoice}
            title={
              isContinuousVoice
                ? "Continuous Duplex Voice Active (Tap to pause)"
                : isListening
                  ? "Listening... Speak your command"
                  : "Tap to speak (Auto-runs when speech ends)"
            }
          >
            {isListening ? (
              <span className="mic-pulse-ring">
                <MicOff size={18} />
              </span>
            ) : (
              <Mic size={18} />
            )}
          </button>

          {/* Hands-Free Duplex Continuous Voice Toggle */}
          <button
            className={`capsule-btn ${isContinuousVoice ? "continuous-active" : ""}`}
            onClick={toggleContinuousVoice}
            title={
              isContinuousVoice
                ? "Hands-Free Continuous Conversation is ACTIVE (Tap to pause)"
                : "Enable Hands-Free Continuous Voice (Talk freely anytime)"
            }
          >
            <Radio
              size={16}
              className={isContinuousVoice ? "text-cyan-400" : ""}
            />
          </button>

          {/* Upload Audio Song */}
          <button
            className="capsule-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Upload audio track to make companion dance"
          >
            <Upload size={16} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept="audio/*"
            onChange={handleFileUpload}
          />

          {/* Uploaded Audio Chip */}
          {uploadedFileName && (
            <button
              className="track-chip"
              onClick={toggleUploadedMusic}
              title={isFilePlaying ? "Pause song" : "Play song"}
            >
              {isFilePlaying ? <Pause size={12} /> : <Play size={12} />}
              <span className="track-name">{uploadedFileName}</span>
            </button>
          )}

          {/* Natural Language Prompt Input */}
          <input
            className="capsule-input"
            type="text"
            placeholder={
              isContinuousVoice
                ? "Continuous Voice active: Speak freely anytime into your mic..."
                : isListening
                  ? "Listening to your voice... (Auto-runs immediately when you finish)"
                  : avatarType === "human"
                    ? 'Talk to your companion: "walk to sakura grove", "do a dance", "backflip", "tell me a joke"...'
                    : 'Command Atlas: "come forward 6 steps", "backflip", "salute", "walk to gazebo"...'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
          />

          {/* Send Action Button */}
          <button
            className="capsule-send-btn"
            onClick={() => handleSubmit()}
            disabled={!inputText.trim()}
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* AI MOVEMENT & DANCE COACH MODAL */}
      {showCoachModal && (
        <div
          className="apple-modal-backdrop"
          onClick={() => setShowCoachModal(false)}
        >
          <div
            className="apple-modal coach-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-title-row">
              <div className="modal-title-group">
                <GraduationCap size={20} className="text-blue" />
                <h3>AI Movement & Dance Coach</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowCoachModal(false)}
              >
                ✕
              </button>
            </div>
            <p className="modal-subtext">
              Atlas teaches choreography with voice narration and demonstrates
              every maneuver across Grand Cyber Park!
            </p>
            <div className="lesson-grid">
              {DANCE_LESSONS.map((lesson) => (
                <div
                  key={lesson.id}
                  className="lesson-card"
                  onClick={() => startDanceLesson(lesson)}
                >
                  <div className="lesson-card-head">
                    <strong>{lesson.title}</strong>
                    <span className="difficulty-pill">{lesson.difficulty}</span>
                  </div>
                  <small className="lesson-meta">
                    {lesson.genre} · {lesson.tempoBpm} BPM
                  </small>
                  <p className="lesson-desc">{lesson.narration}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EXPANDED ARCHITECTURAL PARK BLUEPRINT MODAL */}
      {showExpandedMap && (
        <div
          className="apple-modal-backdrop"
          onClick={() => setShowExpandedMap(false)}
        >
          <div
            className="apple-modal park-blueprint-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-title-row">
              <div className="modal-title-group">
                <Compass size={20} className="text-blue" />
                <h3>
                  Grand Cyber Park Master Architectural Blueprint (240m × 240m)
                </h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowExpandedMap(false)}
              >
                ✕
              </button>
            </div>
            <p className="modal-subtext">
              High-precision scenic top-down masterplan with all zones,
              landmarks, vegetation, and live Atlas GPS tracking. Click any
              landmark to navigate there immediately!
            </p>

            <div className="blueprint-map-large">
              <div className="blueprint-grid-overlay" />
              <div className="blueprint-map-chrome" aria-hidden="true">
                <span className="blueprint-north-mark">N</span>
                <span className="blueprint-map-caption">LIVE PARK RELIEF</span>
                <span className="blueprint-scale-mark"><i /> 40 m</span>
              </div>

              {/* Zones */}
              <div
                className="zone-marble-plaza large"
                title="Grand Central Marble Plaza (24m)"
              />
              <div
                className="zone-lake-lagoon large"
                title="Scenic Lake Lagoon & Wooden Pier"
              />
              <div
                className="zone-willow-stream large"
                title="Winding River Stream & Arched Bridge"
              />
              <div
                className="zone-sakura-grove large"
                title="Sakura Cherry Blossom Shrine"
              />
              <div
                className="zone-pine-woods large"
                title="Tall Austrian Pine Mountain Woods"
              />
              <div
                className="zone-gazebo-pavilion large"
                title="Classical Cedar Gazebo Pavilion"
              />
              <div
                className="zone-gym-station large"
                title="Outdoor Calisthenics Gym"
              />

              {/* Landmark Pins */}
              {LANDMARK_ITEMS.map((lm) => {
                const dist = getDistanceMeters(lm.pos);
                const IconComponent = lm.icon;
                return (
                  <div
                    key={`large-${lm.id}`}
                    className={`blueprint-pin-group large-pin ${lm.id}-pin`}
                    style={toArchitecturalMap(lm.pos)}
                    onClick={() => {
                      setShowExpandedMap(false);
                      handleSubmit(lm.action);
                    }}
                    title={`${lm.name} (${dist}m) · Click to walk`}
                  >
                    <div
                      className="pin-dot-large"
                      style={{ borderColor: lm.color }}
                    >
                      <IconComponent size={14} style={{ color: lm.color }} />
                    </div>
                    <div className="pin-card-popup">
                      <strong>{lm.name}</strong>
                      <small>
                        {lm.zone} · {dist}m away
                      </small>
                    </div>
                  </div>
                );
              })}

              {/* Live Robot Avatar Blip */}
              <div
                className="robot-map-avatar large"
                style={{
                  left: `${mapRobotX}%`,
                  top: `${mapRobotY}%`,
                  transform: `translate(-50%, -50%) rotate(${status.yaw}rad)`,
                }}
              >
                <span className="robot-pulse-ring large" />
                <span className="robot-heading-arrow large" />
                <span className="robot-core-blip large" />
              </div>
            </div>

            <div className="blueprint-landmark-grid">
              {LANDMARK_ITEMS.map((lm) => {
                const dist = getDistanceMeters(lm.pos);
                const IconComponent = lm.icon;
                return (
                  <div
                    key={`grid-${lm.id}`}
                    className="blueprint-card-item"
                    onClick={() => {
                      setShowExpandedMap(false);
                      handleSubmit(lm.action);
                    }}
                  >
                    <div
                      className="item-icon-box"
                      style={{
                        background: `${lm.color}18`,
                        borderColor: lm.color,
                      }}
                    >
                      <IconComponent size={16} style={{ color: lm.color }} />
                    </div>
                    <div className="item-text">
                      <strong>{lm.shortName}</strong>
                      <span>
                        {lm.zone} · {dist}m
                      </span>
                    </div>
                    <button className="item-nav-action">Walk</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE GAME STORY & QUEST JOURNAL MODAL */}
      {showStoryModal && (
        <div
          className="apple-modal-backdrop"
          onClick={() => setShowStoryModal(false)}
        >
          <div
            className="apple-modal story-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-title-row">
              <div className="modal-title-group">
                <Trophy size={22} className="text-amber-400" />
                <div>
                  <h3 className="text-base font-semibold">
                    Chronicles of Cyber Park
                  </h3>
                  <p className="text-xs opacity-70">
                    Interactive Park Storyline & Exploratory Game Quests
                  </p>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowStoryModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="story-chapters-list">
              {STORY_CHAPTERS.map((ch, idx) => {
                const isCompleted = storyState.completedIds.includes(ch.id);
                const isCurrent =
                  idx === storyState.chapterIndex && !storyState.isFinished;
                return (
                  <div
                    key={ch.id}
                    className={`story-chapter-card ${isCurrent ? "current" : ""} ${isCompleted ? "completed" : ""}`}
                  >
                    <div className="chapter-indicator">
                      {isCompleted ? (
                        <CheckCircle2 size={20} className="text-emerald-400" />
                      ) : (
                        <span className="chapter-num">{idx + 1}</span>
                      )}
                    </div>
                    <div className="chapter-details">
                      <div className="chapter-title-row">
                        <h4>{ch.title}</h4>
                        <span className="chapter-zone">{ch.subtitle}</span>
                      </div>
                      <p className="chapter-desc">{ch.objectiveText}</p>
                      <div className="chapter-footer">
                        <span className="chapter-reward">
                          <Award size={13} className="text-amber-400" />{" "}
                          {ch.rewardBadge}
                        </span>
                        <div className="chapter-actions">
                          <button
                            className="chapter-action-btn narrate"
                            onClick={() => {
                              speechService.speak(ch.introDialogue);
                            }}
                            title="Hear voice narration"
                          >
                            <Volume1 size={13} /> Narrate
                          </button>
                          {isCurrent && (
                            <button
                              className="chapter-action-btn walk"
                              onClick={() => {
                                setShowStoryModal(false);
                                const cmdMap: Record<string, string> = {
                                  fountain: "walk to the water fountain",
                                  cherryTree: "walk to the cherry blossom tree",
                                  lakePier: "walk to the lake pier",
                                  gazebo: "walk to the gazebo",
                                };
                                const targetCmd =
                                  cmdMap[ch.landmarkKey] ||
                                  "come forward 6 steps";
                                handleSubmit(targetCmd);
                              }}
                              title="Auto-walk character to quest waypoint"
                            >
                              <Navigation size={13} /> Auto-Walk
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
