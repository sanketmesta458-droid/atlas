"use client";

/* © 2026 Aditya Sarode. All rights reserved. */

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { PARK_APPROACH_POINTS, PARK_LANDMARKS } from "@/lib/action-choreographer";

export { PARK_LANDMARKS };

import { STORY_CHAPTERS } from "@/lib/story-engine";

export const ParkEnvironment = React.memo(function ParkEnvironment({
  activeChapterIndex = 0,
}: {
  activeChapterIndex?: number;
}) {
  return (
    <group>
      {/* 1. EXPANSIVE SCENIC LAWN TERRAIN (240m x 240m) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[240, 240]} />
        <meshStandardMaterial
          color="#2e5c38"
          roughness={0.88}
          metalness={0.02}
        />
      </mesh>

      {/* Decorative Outer Stone Perimeter Walls (236m x 236m) */}
      <PerimeterWall />

      {/* 2. CENTRAL GRAND MARBLE PLAZA AROUND WATER FOUNTAIN */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.005, 0]}
        receiveShadow
      >
        <circleGeometry args={[9.5, 64]} />
        <meshStandardMaterial
          color="#f1f5f9"
          roughness={0.75}
          metalness={0.08}
        />
      </mesh>
      {/* Outer Plaza Radial Cobblestone Ring */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.006, 0]}
        receiveShadow
      >
        <ringGeometry args={[9.2, 10.2, 64]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.85} />
      </mesh>
      {/* Inner Decorative Plaza Inlay */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.007, 0]}
        receiveShadow
      >
        <ringGeometry args={[4.8, 5.2, 48]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
      </mesh>

      {/* 3. CONTINUOUS ARCHITECTURAL PROMENADES & FOOTPATHS */}
      {/* Cardinal Avenues (Promenades extending out from Grand Plaza) */}
      <ContinuousWalkway start={[0, 0, 9.8]} end={[0, 0, 48]} width={2.6} />
      <ContinuousWalkway start={[0, 0, -9.8]} end={[0, 0, -48]} width={2.6} />
      <ContinuousWalkway start={[9.8, 0, 0]} end={[48, 0, 0]} width={2.6} />
      <ContinuousWalkway start={[-9.8, 0, 0]} end={[-48, 0, 0]} width={2.6} />

      {/* Branching Arterial Pathways to Specific Landmarks */}
      <ContinuousWalkway
        start={[6.8, 0, 7.0]}
        end={PARK_APPROACH_POINTS.mainBench}
        width={1.8}
      />
      <ContinuousWalkway
        start={[-6.8, 0, 7.0]}
        end={PARK_APPROACH_POINTS.northBench}
        width={1.8}
      />
      <ContinuousWalkway
        start={[8.8, 0, 4.2]}
        end={PARK_APPROACH_POINTS.gazebo}
        width={2.2}
      />
      <ContinuousWalkway
        start={[-8.8, 0, 4.2]}
        end={PARK_APPROACH_POINTS.lakePier}
        width={2.2}
      />
      <ContinuousWalkway
        start={[-7.0, 0, -7.0]}
        end={PARK_APPROACH_POINTS.cherryTree}
        width={2.0}
      />
      <ContinuousWalkway
        start={[7.0, 0, -7.0]}
        end={PARK_APPROACH_POINTS.pineGrove}
        width={2.0}
      />
      <ContinuousWalkway
        start={[6.5, 0, -7.5]}
        end={PARK_APPROACH_POINTS.workoutStation}
        width={2.0}
      />
      <ContinuousWalkway
        start={[-6.5, 0, 7.5]}
        end={PARK_APPROACH_POINTS.willowStream}
        width={2.0}
      />

      {/* Cross-Park Connecting Promenades */}
      <ContinuousWalkway
        start={PARK_APPROACH_POINTS.cherryTree}
        end={[-32.0, 0, 0]}
        width={1.8}
      />
      <ContinuousWalkway
        start={[-32.0, 0, 0]}
        end={PARK_APPROACH_POINTS.lakePier}
        width={1.8}
      />
      <ContinuousWalkway
        start={PARK_APPROACH_POINTS.pineGrove}
        end={[28.0, 0, 0]}
        width={1.8}
      />
      <ContinuousWalkway
        start={[28.0, 0, 0]}
        end={PARK_APPROACH_POINTS.gazebo}
        width={1.8}
      />
      <ContinuousWalkway
        start={PARK_APPROACH_POINTS.gazebo}
        end={[12, 0, 32]}
        width={1.8}
      />
      <ContinuousWalkway
        start={[12, 0, 32]}
        end={PARK_APPROACH_POINTS.willowStream}
        width={1.8}
      />
      <ContinuousWalkway start={[0, 0, 32]} end={[-16, 0, 35]} width={1.8} />

      {/* 4. CENTRAL TIERED WATER FOUNTAIN */}
      <GrandWaterFountain position={PARK_LANDMARKS.fountain} />

      {/* 5. REFLECTIVE SCENIC LAKE & WOODEN LAKESIDE PIER */}
      {/* Lake center at [-35, 0, 19], so pier at [3.0, 0, -1.0] aligns with PARK_LANDMARKS.lakePier [-32, 0, 18] */}
      <ScenicLakeAndPier position={[-35, 0, 19]} />

      {/* 6. WINDING STREAM & ARCHED WOODEN FOOTBRIDGE */}
      <WindingRiverStream />
      <ArchedFootbridge
        position={PARK_LANDMARKS.willowStream}
        rotation={[0, -0.35, 0]}
      />

      {/* 7. CLASSICAL OCTAGONAL WOODEN GAZEBO */}
      <ParkGazebo position={PARK_LANDMARKS.gazebo} />

      {/* 8. OUTDOOR CALISTHENICS & WORKOUT STATION */}
      <WorkoutGymStation position={PARK_LANDMARKS.workoutStation} />

      {/* 9. PARK BENCHES */}
      {/* Main Teak Bench East */}
      <ParkBench
        position={PARK_LANDMARKS.mainBench}
        rotation={[0, -Math.PI / 2, 0]}
      />
      {/* North Garden Bench */}
      <ParkBench
        position={PARK_LANDMARKS.northBench}
        rotation={[0, Math.PI / 3, 0]}
      />
      {/* Lake View Bench */}
      <ParkBench position={[-28, 0, 12]} rotation={[0, Math.PI / 4, 0]} />
      {/* Gazebo Lawn Bench */}
      <ParkBench position={[22, 0, 24]} rotation={[0, -Math.PI * 0.75, 0]} />
      {/* Sakura Grove Bench */}
      <ParkBench position={[-25, 0, -14]} rotation={[0, 0.4, 0]} />
      {/* Pine Grove Vista Bench */}
      <ParkBench position={[24, 0, -18]} rotation={[0, -0.6, 0]} />

      {/* 10. BOTANICAL GARDENS & FLOWER FIELDS */}
      <LavenderField position={[4.5, 0, 14.5]} />
      <LavenderField position={[-4.5, 0, -14.5]} />
      <LavenderField position={[16.5, 0, 6.5]} />
      <RoseGarden position={[-5.2, 0, 12.5]} />
      <RoseGarden position={[12.5, 0, -6.5]} />
      <RoseGarden position={[-16.5, 0, -8.5]} />
      {/* South Garden Hedges (Flanking the South Promenade) */}
      <HedgeRow
        position={[-5.8, 0, 14.5]}
        length={6.5}
        rotation={[0, Math.PI / 2, 0]}
      />
      <HedgeRow
        position={[5.8, 0, 14.5]}
        length={6.5}
        rotation={[0, Math.PI / 2, 0]}
      />

      {/* North Garden Hedges (Flanking the North Promenade) */}
      <HedgeRow
        position={[-5.8, 0, -14.5]}
        length={6.5}
        rotation={[0, Math.PI / 2, 0]}
      />
      <HedgeRow
        position={[5.8, 0, -14.5]}
        length={6.5}
        rotation={[0, Math.PI / 2, 0]}
      />

      {/* East & West Lawn Topiary Hedges */}
      <HedgeRow position={[18, 0, 5.5]} length={8} rotation={[0, 0, 0]} />
      <HedgeRow position={[18, 0, -5.5]} length={8} rotation={[0, 0, 0]} />
      <HedgeRow position={[-18, 0, 5.5]} length={8} rotation={[0, 0, 0]} />
      <HedgeRow position={[-18, 0, -5.5]} length={8} rotation={[0, 0, 0]} />

      {/* 11. DIVERSE FOREST & TREES */}
      {/* Flowering Pink Sakura Cherry Blossom Grove */}
      <SakuraGrove center={PARK_LANDMARKS.cherryTree} />

      {/* Tall Austrian Pine Evergreen Forest */}
      <PineForest center={PARK_LANDMARKS.pineGrove} />

      {/* Weeping Willows along Lake Edge */}
      <WeepingWillowTree position={[-17.5, 0, 5.5]} scale={1.3} />
      <WeepingWillowTree position={[-12.5, 0, 14.5]} scale={1.2} />
      <WeepingWillowTree position={[-18.5, 0, 11.5]} scale={1.4} />

      {/* Sprawling Mature Oak Shade Trees */}
      <OakTree position={[-7.5, 0, 2.5]} scale={1.25} />
      <OakTree position={[7.5, 0, 4.5]} scale={1.35} />
      <OakTree position={[2.5, 0, -10.5]} scale={1.15} />
      <OakTree position={[-9.5, 0, -11.5]} scale={1.3} />
      <OakTree position={[14.5, 0, -8.5]} scale={1.2} />
      <OakTree position={[14.0, 0, 13.5]} scale={1.3} />

      {/* Golden Autumn Maple Trees */}
      <AutumnMapleTree position={[4.5, 0, 9.5]} scale={1.2} />
      <AutumnMapleTree position={[-6.5, 0, 8.5]} scale={1.1} />
      <AutumnMapleTree position={[9.5, 0, -3.5]} scale={1.25} />

      {/* 12. VINTAGE EUROPEAN STREET LAMPS WITH WARM ILLUMINATION */}
      <ParkLampPost position={[2.8, 0, 3.4]} />
      <ParkLampPost position={[-2.8, 0, -3.4]} />
      <ParkLampPost position={[4.2, 0, -5.2]} />
      <ParkLampPost position={[-4.2, 0, 5.8]} />
      <ParkLampPost position={[9.5, 0, 6.0]} />
      <ParkLampPost position={[-10.2, 0, 7.2]} />
      <ParkLampPost position={[5.5, 0, -10.5]} />
      <ParkLampPost position={[-6.5, 0, 12.8]} />

      {/* 13. PARK WAYFINDING TOTEM / SOLAR KIOSK */}
      <ParkWayfindingTotem position={[1.8, 0, 6.8]} />
      <ParkWayfindingTotem position={[-1.8, 0, -6.8]} />

      {/* 15. OUTER PARK DISTRICTS — give the wide lawn a sense of discovery */}
      <GrandParkEntrance position={[0, 0, -104]} />
      <GardenLoopPath />
      <PlaygroundGarden position={[58, 0, -42]} />
      <PicnicMeadow position={[-58, 0, -45]} />
      <CommunityGarden position={[58, 0, 42]} />
      <GlassConservatory position={[-58, 0, 46]} />
      <EventPavilion position={[0, 0, 72]} />
      <SculptureGarden position={[0, 0, -66]} />
      <WildflowerMeadow position={[-76, 0, -4]} />
      <WildflowerMeadow position={[77, 0, 4]} flip />
      <ParkGardenDistricts />
      <TreeLinedBoundary />
      <OuterParkLighting />

      {/* 14. INTERACTIVE GAME QUEST WAYPOINT BEACONS */}
      {STORY_CHAPTERS.map((chapter, idx) => (
        <QuestWaypointBeacon
          key={chapter.id}
          position={chapter.targetPos}
          isActive={idx === activeChapterIndex}
          isCompleted={idx < activeChapterIndex}
          label={chapter.subtitle}
        />
      ))}
    </group>
  );
});

// A stone gateway creates a clear arrival moment at the southern edge.
function GrandParkEntrance({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <ContinuousWalkway start={[-0.01, 0, 0]} end={[0, 0, 21]} width={4.2} />
      {[-4.2, 4.2].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 1.65, 0]} castShadow>
            <boxGeometry args={[0.85, 3.3, 0.85]} />
            <meshStandardMaterial color="#d6d3d1" roughness={0.72} />
          </mesh>
          <mesh position={[0, 3.35, 0]} castShadow>
            <boxGeometry args={[1.18, 0.25, 1.18]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.7} />
          </mesh>
          <mesh position={[0, 3.7, 0]}>
            <sphereGeometry args={[0.2, 12, 12]} />
            <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.3} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 3.1, 0]} castShadow>
        <boxGeometry args={[7.7, 0.38, 0.55]} />
        <meshStandardMaterial color="#475569" roughness={0.58} metalness={0.2} />
      </mesh>
      <mesh position={[0, 2.78, 0.3]}>
        <boxGeometry args={[3.4, 0.54, 0.06]} />
        <meshStandardMaterial color="#0f766e" emissive="#064e3b" emissiveIntensity={0.18} />
      </mesh>
      <FlowerBorder position={[-7.2, 0, 3.4]} length={6.5} />
      <FlowerBorder position={[7.2, 0, 3.4]} length={6.5} />
    </group>
  );
}

function GardenLoopPath() {
  return (
    <group>
      {/* A broad circuit ties the new destination gardens to the central park. */}
      <ContinuousWalkway start={[-44, 0, -43]} end={[0, 0, -66]} width={2} />
      <ContinuousWalkway start={[0, 0, -66]} end={[45, 0, -43]} width={2} />
      <ContinuousWalkway start={[45, 0, -43]} end={[58, 0, 42]} width={2} />
      <ContinuousWalkway start={[58, 0, 42]} end={[0, 0, 72]} width={2} />
      <ContinuousWalkway start={[0, 0, 72]} end={[-58, 0, 46]} width={2} />
      <ContinuousWalkway start={[-58, 0, 46]} end={[-44, 0, -43]} width={2} />
    </group>
  );
}

function PlaygroundGarden({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[18, 15]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.9} />
      </mesh>
      <mesh position={[-4.8, 1.65, 0]} castShadow><boxGeometry args={[0.16, 3.3, 0.16]} /><meshStandardMaterial color="#ef4444" /></mesh>
      <mesh position={[-1.8, 1.65, 0]} castShadow><boxGeometry args={[0.16, 3.3, 0.16]} /><meshStandardMaterial color="#ef4444" /></mesh>
      <mesh position={[-3.3, 3.05, 0]} castShadow><boxGeometry args={[3.2, 0.14, 0.14]} /><meshStandardMaterial color="#2563eb" /></mesh>
      {[-4.05, -2.55].map((x) => <group key={x} position={[x, 2.2, 0]}><mesh><boxGeometry args={[0.52, 0.08, 0.26]} /><meshStandardMaterial color="#38bdf8" /></mesh><mesh position={[0, -0.8, 0]}><cylinderGeometry args={[0.025, 0.025, 1.55, 8]} /><meshStandardMaterial color="#475569" /></mesh></group>)}
      <mesh position={[3.4, 1.1, -1.8]} rotation={[0, 0.35, 0]} castShadow><boxGeometry args={[1.25, 0.12, 4.6]} /><meshStandardMaterial color="#f97316" /></mesh>
      <mesh position={[3.4, 0.55, -3.85]} rotation={[0.35, 0, 0]}><boxGeometry args={[1.5, 0.18, 0.5]} /><meshStandardMaterial color="#facc15" /></mesh>
      <mesh position={[4.6, 1.1, 3.4]} castShadow><cylinderGeometry args={[1.45, 1.45, 0.35, 16]} /><meshStandardMaterial color="#8b5cf6" roughness={0.6} /></mesh>
      <FlowerBorder position={[0, 0, 8.3]} length={13} />
      <FlowerBorder position={[0, 0, -8.3]} length={13} />
    </group>
  );
}

function PicnicMeadow({ position }: { position: [number, number, number] }) {
  return <group position={position}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}><circleGeometry args={[10, 32]} /><meshStandardMaterial color="#65a30d" roughness={0.95} /></mesh>
    {[[-3, -2], [3.5, 1.5], [0.5, 4.8]].map(([x, z], i) => <PicnicTable key={i} position={[x, 0, z]} rotation={[0, i * 0.8, 0]} />)}
    <ParkBench position={[-7.5, 0, 2]} rotation={[0, Math.PI / 2, 0]} />
    <OakTree position={[-8, 0, -6]} scale={1.25} />
    <OakTree position={[7.5, 0, -6]} scale={1.15} />
    <FlowerBorder position={[0, 0, 9.2]} length={13} />
  </group>;
}

function PicnicTable({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) {
  return <group position={position} rotation={rotation}>
    <mesh position={[0, 1.02, 0]} castShadow><boxGeometry args={[2.4, 0.14, 1.05]} /><meshStandardMaterial color="#92400e" roughness={0.78} /></mesh>
    {[-0.75, 0.75].map((z) => <mesh key={z} position={[0, 0.55, z]} castShadow><boxGeometry args={[2.4, 0.12, 0.36]} /><meshStandardMaterial color="#a16207" roughness={0.78} /></mesh>)}
    {[-0.85, 0.85].map((x) => <mesh key={x} position={[x, 0.5, 0]} rotation={[0, 0, 0.25]}><boxGeometry args={[0.12, 1, 0.12]} /><meshStandardMaterial color="#78350f" /></mesh>)}
  </group>;
}

function CommunityGarden({ position }: { position: [number, number, number] }) {
  return <group position={position}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}><planeGeometry args={[19, 16]} /><meshStandardMaterial color="#bbf7d0" roughness={0.95} /></mesh>
    {[[-4, -3], [0, -3], [4, -3], [-4, 2], [0, 2], [4, 2]].map(([x, z], i) => <group key={i} position={[x, 0, z]}>
      <mesh position={[0, 0.26, 0]} castShadow><boxGeometry args={[3.1, 0.5, 3.4]} /><meshStandardMaterial color="#a16207" roughness={0.85} /></mesh>
      <mesh position={[0, 0.53, 0]}><boxGeometry args={[2.75, 0.08, 3.05]} /><meshStandardMaterial color={i % 2 ? "#4d7c0f" : "#3f6212"} roughness={0.92} /></mesh>
      {[[-0.8, -0.7], [0.7, -0.25], [-0.2, 0.85]].map(([px, pz], j) => <mesh key={j} position={[px, 0.78, pz]}><sphereGeometry args={[0.22, 8, 8]} /><meshStandardMaterial color={j === 1 ? "#ef4444" : "#facc15"} /></mesh>)}
    </group>)}
    <GardenArch position={[0, 0, 7]} />
    <WateringStation position={[-7, 0, 5]} />
  </group>;
}

function GardenArch({ position }: { position: [number, number, number] }) {
  return <group position={position}>
    {[-1.25, 1.25].map((x) => <mesh key={x} position={[x, 1.5, 0]} castShadow><cylinderGeometry args={[0.08, 0.08, 3, 10]} /><meshStandardMaterial color="#f8fafc" /></mesh>)}
    <mesh position={[0, 2.9, 0]}><torusGeometry args={[1.25, 0.08, 8, 20, Math.PI]} /><meshStandardMaterial color="#f8fafc" /></mesh>
    {[-1, -0.45, 0.45, 1].map((x) => <mesh key={x} position={[x, 2.15, 0.04]}><sphereGeometry args={[0.28, 8, 8]} /><meshStandardMaterial color="#ec4899" /></mesh>)}
  </group>;
}

function WateringStation({ position }: { position: [number, number, number] }) {
  return <group position={position}><mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.45, 0.5, 1, 12]} /><meshStandardMaterial color="#38bdf8" metalness={0.35} /></mesh><mesh position={[0.3, 1.25, 0]} rotation={[0, 0, -0.35]}><torusGeometry args={[0.32, 0.05, 8, 12, Math.PI]} /><meshStandardMaterial color="#f8fafc" /></mesh></group>;
}

function GlassConservatory({ position }: { position: [number, number, number] }) {
  return <group position={position}>
    <mesh position={[0, 0.12, 0]} castShadow><boxGeometry args={[15, 0.24, 10]} /><meshStandardMaterial color="#94a3b8" roughness={0.7} /></mesh>
    {[[-6.8, 0], [6.8, 0], [0, -4.3], [0, 4.3]].map(([x, z], i) => <mesh key={i} position={[x, 2.4, z]} castShadow><boxGeometry args={[0.2, 4.6, i < 2 ? 8.8 : 13.6]} /><meshStandardMaterial color="#f8fafc" metalness={0.55} /></mesh>)}
    <mesh position={[0, 2.6, 0]} castShadow><boxGeometry args={[13.5, 4.9, 8.5]} /><meshStandardMaterial color="#bae6fd" transparent opacity={0.26} roughness={0.1} metalness={0.5} /></mesh>
    <mesh position={[0, 5.35, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[7.8, 3.1, 4]} /><meshStandardMaterial color="#dbeafe" transparent opacity={0.42} roughness={0.15} metalness={0.45} /></mesh>
    {[[-3, -1], [0, 1], [3, -1], [-1, 2]].map(([x, z], i) => <group key={i} position={[x, 0, z]}><mesh position={[0, 0.7, 0]}><cylinderGeometry args={[0.18, 0.25, 1.4, 10]} /><meshStandardMaterial color="#166534" /></mesh><mesh position={[0, 1.5, 0]}><sphereGeometry args={[0.75, 10, 10]} /><meshStandardMaterial color={i % 2 ? "#f472b6" : "#22c55e"} /></mesh></group>)}
  </group>;
}

function EventPavilion({ position }: { position: [number, number, number] }) {
  return <group position={position}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}><circleGeometry args={[11, 40]} /><meshStandardMaterial color="#e7e5e4" roughness={0.82} /></mesh>
    <mesh position={[0, 0.42, 0]} castShadow><cylinderGeometry args={[5.2, 5.6, 0.8, 28]} /><meshStandardMaterial color="#78350f" roughness={0.78} /></mesh>
    <mesh position={[0, 0.87, 0]}><cylinderGeometry args={[4.75, 4.75, 0.12, 28]} /><meshStandardMaterial color="#fef3c7" roughness={0.7} /></mesh>
    {[0, 1, 2, 3, 4, 5].map((i) => { const a = i * Math.PI / 3; return <mesh key={i} position={[Math.cos(a) * 7.4, 1.9, Math.sin(a) * 7.4]}><sphereGeometry args={[0.19, 10, 10]} /><meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={1.2} /></mesh>; })}
    <ParkBench position={[-7, 0, 0]} rotation={[0, Math.PI / 2, 0]} /><ParkBench position={[7, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />
  </group>;
}

function SculptureGarden({ position }: { position: [number, number, number] }) {
  return <group position={position}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}><circleGeometry args={[9, 32]} /><meshStandardMaterial color="#d1fae5" roughness={0.9} /></mesh>
    <mesh position={[0, 0.5, 0]} castShadow><cylinderGeometry args={[2.2, 2.5, 1, 20]} /><meshStandardMaterial color="#64748b" roughness={0.55} /></mesh>
    <mesh position={[0, 3.2, 0]} rotation={[0.35, 0.4, 0.15]} castShadow><torusKnotGeometry args={[1.4, 0.3, 80, 12]} /><meshStandardMaterial color="#f59e0b" metalness={0.75} roughness={0.2} /></mesh>
    {[-6, 6].map((x) => <FlowerBorder key={x} position={[x, 0, 0]} length={4.8} rotation={[0, Math.PI / 2, 0]} />)}
  </group>;
}

function WildflowerMeadow({ position, flip = false }: { position: [number, number, number]; flip?: boolean }) {
  const flowers = Array.from({ length: 26 }, (_, i) => [((i * 31) % 93) / 10 - 4.5, ((i * 17) % 71) / 10 - 3.5]);
  return <group position={position} rotation={[0, flip ? Math.PI : 0, 0]}>{flowers.map(([x, z], i) => <group key={i} position={[x, 0, z]}><mesh position={[0, 0.23, 0]}><cylinderGeometry args={[0.025, 0.04, 0.46, 6]} /><meshStandardMaterial color="#166534" /></mesh><mesh position={[0, 0.5, 0]}><sphereGeometry args={[0.13, 8, 8]} /><meshStandardMaterial color={["#facc15", "#f472b6", "#a855f7", "#fb7185"][i % 4]} /></mesh></group>)}</group>;
}

function FlowerBorder({ position, length, rotation = [0, 0, 0] }: { position: [number, number, number]; length: number; rotation?: [number, number, number] }) {
  const count = Math.max(4, Math.round(length / 0.48));
  return <group position={position} rotation={rotation}>{Array.from({ length: count }, (_, i) => <group key={i} position={[(i - (count - 1) / 2) * 0.48, 0, 0]}><mesh position={[0, 0.16, 0]}><sphereGeometry args={[0.18, 8, 8]} /><meshStandardMaterial color={i % 3 === 0 ? "#f43f5e" : i % 3 === 1 ? "#fbbf24" : "#a855f7"} /></mesh></group>)}</group>;
}

function TreeLinedBoundary() {
  const trees: [number, number, number][] = [
    [-96, 0, -82], [-78, 0, -91], [-55, 0, -86], [-28, 0, -92], [28, 0, -92], [55, 0, -86], [78, 0, -91], [96, 0, -82],
    [-97, 0, -48], [-97, 0, -12], [-97, 0, 28], [-95, 0, 73], [97, 0, -48], [97, 0, -12], [97, 0, 30], [95, 0, 74],
    [-82, 0, 95], [-48, 0, 96], [-20, 0, 93], [25, 0, 94], [50, 0, 96], [82, 0, 95],
  ];
  return <group>{trees.map(([x, y, z], i) => i % 3 === 0 ? <AutumnMapleTree key={i} position={[x, y, z]} scale={1.05 + (i % 2) * 0.13} /> : <OakTree key={i} position={[x, y, z]} scale={1.05 + (i % 3) * 0.1} />)}</group>;
}

function OuterParkLighting() {
  const lights: [number, number, number][] = [[-30, 0, -59], [30, 0, -59], [48, 0, -18], [49, 0, 18], [31, 0, 60], [-31, 0, 60], [-49, 0, 18], [-48, 0, -18], [0, 0, -86], [0, 0, 93]];
  return <group>{lights.map((position, i) => <ParkLampPost key={i} position={position} />)}</group>;
}

// Planted landscape rooms fill the wide park with intentional scenery while
// leaving the main promenades and all landmark approach paths clear.
function ParkGardenDistricts() {
  const districts: { position: [number, number, number]; tone: "oak" | "pine" | "sakura" }[] = [
    { position: [-43, 0, -32], tone: "sakura" },
    { position: [43, 0, -35], tone: "pine" },
    { position: [-44, 0, 42], tone: "oak" },
    { position: [42, 0, 44], tone: "sakura" },
    { position: [-8, 0, -43], tone: "pine" },
    { position: [13, 0, -46], tone: "oak" },
    { position: [-66, 0, 22], tone: "pine" },
    { position: [67, 0, 22], tone: "oak" },
  ];
  return (
    <group>
      {districts.map((district, index) => (
        <GardenDistrict key={index} {...district} />
      ))}
    </group>
  );
}

function GardenDistrict({ position, tone }: { position: [number, number, number]; tone: "oak" | "pine" | "sakura" }) {
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
        <circleGeometry args={[7.6, 28]} />
        <meshStandardMaterial color={tone === "sakura" ? "#fce7f3" : tone === "pine" ? "#dcfce7" : "#ecfccb"} roughness={0.94} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, 0]}>
        <ringGeometry args={[6.7, 7.05, 28]} />
        <meshStandardMaterial color="#d6c7a5" roughness={0.9} />
      </mesh>
      {tone === "sakura" ? (
        <>
          <CherryBlossomTree position={[-2.7, 0, -0.7]} scale={1.05} />
          <CherryBlossomTree position={[2.5, 0, 0.9]} scale={1.12} />
          <CherryBlossomTree position={[0.1, 0, 3.1]} scale={0.92} />
        </>
      ) : tone === "pine" ? (
        <>
          <PineTree position={[-2.8, 0, -0.6]} scale={1.15} />
          <PineTree position={[2.5, 0, 1.1]} scale={1.28} />
          <PineTree position={[0.2, 0, 3.2]} scale={1.0} />
        </>
      ) : (
        <>
          <OakTree position={[-2.6, 0, -0.7]} scale={0.98} />
          <OakTree position={[2.6, 0, 1.1]} scale={1.08} />
          <AutumnMapleTree position={[0, 0, 3.1]} scale={0.96} />
        </>
      )}
      <FlowerBorder position={[0, 0, -5.5]} length={5.6} />
      <ParkBench position={[0, 0, 5.4]} rotation={[0, Math.PI, 0]} />
    </group>
  );
}

// GRAND MULTI-TIER WATER FOUNTAIN WITH ANIMATED FOUNTAIN WATER
function GrandWaterFountain({
  position,
}: {
  position: [number, number, number];
}) {
  const waterRef = useRef<THREE.Mesh>(null);
  const sprayParticlesRef = useRef<THREE.Points>(null);

  // Animated water surface ripple
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (waterRef.current) {
      waterRef.current.rotation.z = t * 0.15;
    }
    if (sprayParticlesRef.current) {
      sprayParticlesRef.current.rotation.y = t * 0.4;
    }
  });

  // Fountain spray particles
  const particleGeo = useMemo(() => {
    const count = 48;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 0.2 + (i % 3) * 0.35;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = 2.0 + Math.sin(i * 1.5) * 0.45;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return geo;
  }, []);

  return (
    <group position={position}>
      {/* Base Marble Pool Wall */}
      <mesh position={[0, 0.26, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.5, 2.65, 0.52, 36]} />
        <meshStandardMaterial
          color="#cbd5e1"
          roughness={0.65}
          metalness={0.15}
        />
      </mesh>
      {/* Pool Basin Rim */}
      <mesh position={[0, 0.53, 0]} castShadow>
        <cylinderGeometry args={[2.7, 2.5, 0.08, 36]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.6} />
      </mesh>

      {/* Main Basin Water Pool */}
      <mesh
        ref={waterRef}
        position={[0, 0.45, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[2.42, 36]} />
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.08}
          metalness={0.9}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* Center Ornate Marble Column */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.65, 0.9, 20]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.65} />
      </mesh>

      {/* Middle Water Tier Bowl */}
      <mesh position={[0, 1.45, 0]} castShadow>
        <cylinderGeometry args={[1.35, 0.45, 0.3, 28]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.58, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.28, 28]} />
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.08}
          metalness={0.9}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* Upper Column */}
      <mesh position={[0, 1.95, 0]} castShadow>
        <cylinderGeometry args={[0.26, 0.38, 0.7, 16]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.65} />
      </mesh>

      {/* Topmost Finial Spout */}
      <mesh position={[0, 2.35, 0]} castShadow>
        <sphereGeometry args={[0.22, 20, 20]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Sparkling Water Spray Particles */}
      <points ref={sprayParticlesRef} geometry={particleGeo}>
        <pointsMaterial
          size={0.08}
          color="#e0f2fe"
          transparent
          opacity={0.85}
        />
      </points>
    </group>
  );
}

// SCENIC LAKE & WOODEN LAKESIDE PIER / DOCK
function ScenicLakeAndPier({
  position,
}: {
  position: [number, number, number];
}) {
  const lakeWaterRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (lakeWaterRef.current) {
      lakeWaterRef.current.position.y =
        0.08 + Math.sin(clock.elapsedTime * 1.2) * 0.015;
    }
  });

  return (
    <group position={position}>
      {/* Lake Basin Stone Bank Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[15.2, 16.8, 56]} />
        <meshStandardMaterial color="#64748b" roughness={0.9} />
      </mesh>

      {/* Reflective Deep Blue Lake Water Surface */}
      <mesh
        ref={lakeWaterRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.08, 0]}
      >
        <circleGeometry args={[15.6, 56]} />
        <meshStandardMaterial
          color="#0284c7"
          roughness={0.1}
          metalness={0.88}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Water Lilies & Lotus Blossom Clusters */}
      {[
        [-5.2, 3.8],
        [-4.4, 5.6],
        [-7.1, 1.8],
        [4.5, -5.2],
        [6.2, -3.4],
        [3.8, -7.5],
        [-3.5, -4.8],
        [-5.2, -6.4],
        [-2.0, 8.0],
        [1.5, 9.5],
      ].map(([lx, lz], idx) => (
        <group key={idx} position={[lx, 0.1, lz]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.42, 12]} />
            <meshStandardMaterial color="#15803d" roughness={0.7} />
          </mesh>
          {idx % 2 === 0 && (
            <mesh position={[0, 0.07, 0]}>
              <sphereGeometry args={[0.11, 8, 8]} />
              <meshStandardMaterial color="#f472b6" roughness={0.4} />
            </mesh>
          )}
        </group>
      ))}

      {/* Moored Wooden Rowboats on the Lake */}
      <RowBoat position={[-6.0, 0.12, -4.0]} rotation={[0, 0.45, 0]} />
      <RowBoat position={[5.0, 0.12, 6.5]} rotation={[0, -0.75, 0]} />

      {/* Extended Wooden Boardwalk & Pier (Landmark: lakePier) */}
      <group position={[3.0, 0, -1.0]}>
        {/* Pier Support Piling Posts */}
        {[-1.2, 1.2].map((px) => (
          <React.Fragment key={px}>
            {[-3.0, -1.0, 1.0, 3.0].map((pz) => (
              <mesh key={`${px}-${pz}`} position={[px, 0.35, pz]} castShadow>
                <cylinderGeometry args={[0.1, 0.12, 0.85, 10]} />
                <meshStandardMaterial color="#451a03" roughness={0.9} />
              </mesh>
            ))}
          </React.Fragment>
        ))}

        {/* Pier Timber Deck Planks */}
        {Array.from({ length: 18 }).map((_, i) => (
          <RoundedBox
            key={i}
            args={[2.8, 0.08, 0.38]}
            radius={0.015}
            position={[0, 0.72, -3.2 + i * 0.38]}
            castShadow
          >
            <meshStandardMaterial color="#92400e" roughness={0.8} />
          </RoundedBox>
        ))}

        {/* Pier Edge Mooring Bollards */}
        <mesh position={[-1.2, 0.88, 3.3]} castShadow>
          <cylinderGeometry args={[0.08, 0.09, 0.35, 10]} />
          <meshStandardMaterial
            color="#1e293b"
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>
        <mesh position={[1.2, 0.88, 3.3]} castShadow>
          <cylinderGeometry args={[0.08, 0.09, 0.35, 10]} />
          <meshStandardMaterial
            color="#1e293b"
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>

        {/* Safety Life Preserver Ring on Pier Post */}
        <group position={[1.2, 0.7, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.24, 0.07, 12, 24]} />
            <meshStandardMaterial color="#ea580c" roughness={0.4} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// MOORED WOODEN ROWBOAT ON LAKE
function RowBoat({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Boat Hull Floor */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[1.2, 0.1, 2.4]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
      {/* Boat Sides */}
      <mesh position={[-0.6, 0.22, 0]}>
        <boxGeometry args={[0.08, 0.28, 2.4]} />
        <meshStandardMaterial color="#92400e" roughness={0.8} />
      </mesh>
      <mesh position={[0.6, 0.22, 0]}>
        <boxGeometry args={[0.08, 0.28, 2.4]} />
        <meshStandardMaterial color="#92400e" roughness={0.8} />
      </mesh>
      {/* Bow and Stern */}
      <mesh position={[0, 0.22, 1.2]}>
        <boxGeometry args={[1.28, 0.28, 0.08]} />
        <meshStandardMaterial color="#92400e" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.22, -1.2]}>
        <boxGeometry args={[1.28, 0.28, 0.08]} />
        <meshStandardMaterial color="#92400e" roughness={0.8} />
      </mesh>
      {/* Wooden Seats */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[1.15, 0.04, 0.35]} />
        <meshStandardMaterial color="#b45309" roughness={0.7} />
      </mesh>
      {/* Oars */}
      <mesh position={[-0.65, 0.3, 0.2]} rotation={[0.2, 0, 0.4]}>
        <cylinderGeometry args={[0.02, 0.02, 1.4, 8]} />
        <meshStandardMaterial color="#d97706" roughness={0.6} />
      </mesh>
    </group>
  );
}

// WINDING RIVER STREAM CONNECTING TO LAKE
function WindingRiverStream() {
  return (
    <group position={[-26, 0.02, 28]}>
      <mesh rotation={[-Math.PI / 2, 0, 0.5]}>
        <planeGeometry args={[26, 4.2]} />
        <meshStandardMaterial
          color="#0284c7"
          roughness={0.12}
          metalness={0.85}
          transparent
          opacity={0.88}
        />
      </mesh>
    </group>
  );
}

// CLASSICAL ARCHED WOODEN FOOTBRIDGE OVER STREAM
function ArchedFootbridge({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Stream Bed */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[7, 2.4]} />
        <meshStandardMaterial
          color="#0369a1"
          roughness={0.15}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Arched Bridge Plank Ribs */}
      {Array.from({ length: 12 }).map((_, i) => {
        const t = (i / 11) * 2 - 1;
        const archY = Math.cos(t * Math.PI * 0.5) * 0.45 + 0.3;
        return (
          <RoundedBox
            key={i}
            args={[1.8, 0.08, 0.32]}
            radius={0.015}
            position={[0, archY, -1.8 + i * 0.33]}
            castShadow
          >
            <meshStandardMaterial color="#78350f" roughness={0.75} />
          </RoundedBox>
        );
      })}

      {/* Curved Timber Railings */}
      {[-0.85, 0.85].map((rx) => (
        <group key={rx} position={[rx, 0, 0]}>
          {[-1.6, -0.6, 0.6, 1.6].map((rz) => {
            const t = rz / 1.6;
            const archY = Math.cos(t * Math.PI * 0.5) * 0.45 + 0.3;
            return (
              <mesh key={rz} position={[0, archY + 0.38, rz]} castShadow>
                <cylinderGeometry args={[0.04, 0.04, 0.75, 8]} />
                <meshStandardMaterial color="#451a03" roughness={0.85} />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}

// OCTAGONAL WOODEN GAZEBO / PAVILION
function ParkGazebo({ position }: { position: [number, number, number] }) {
  const radius = 3.4;
  const columnCount = 8;

  return (
    <group position={position}>
      {/* Elevated Octagonal Stone Plinth */}
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius + 0.3, radius + 0.5, 0.36, 8]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
      </mesh>
      {/* Teak Deck Floor */}
      <mesh position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[radius, radius, 0.06, 8]} />
        <meshStandardMaterial color="#92400e" roughness={0.75} />
      </mesh>

      {/* 8 Classical Wooden Columns */}
      {Array.from({ length: columnCount }).map((_, i) => {
        const angle = (i / columnCount) * Math.PI * 2;
        const cx = Math.cos(angle) * (radius - 0.3);
        const cz = Math.sin(angle) * (radius - 0.3);
        return (
          <group key={i} position={[cx, 0, cz]}>
            <mesh position={[0, 1.65, 0]} castShadow>
              <cylinderGeometry args={[0.09, 0.12, 2.5, 12]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.4} />
            </mesh>
          </group>
        );
      })}

      {/* Grand Octagonal Cedar Shingle Roof */}
      <mesh position={[0, 3.7, 0]} castShadow>
        <coneGeometry args={[radius + 0.5, 1.6, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
      {/* Roof Top Finial */}
      <mesh position={[0, 4.65, 0]} castShadow>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Perimeter Balustrade Railings */}
      {Array.from({ length: columnCount - 1 }).map((_, i) => {
        const a1 = (i / columnCount) * Math.PI * 2;
        const a2 = ((i + 1) / columnCount) * Math.PI * 2;
        const mx = (Math.cos(a1) + Math.cos(a2)) * 0.5 * (radius - 0.3);
        const mz = (Math.sin(a1) + Math.sin(a2)) * 0.5 * (radius - 0.3);
        const angle = Math.atan2(
          Math.sin(a2) - Math.sin(a1),
          Math.cos(a2) - Math.cos(a1),
        );
        return (
          <mesh
            key={i}
            position={[mx, 0.8, mz]}
            rotation={[0, -angle, 0]}
            castShadow
          >
            <boxGeometry args={[1.9, 0.08, 0.08]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.5} />
          </mesh>
        );
      })}

      {/* Center Circular Teak Gazebo Bench */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <cylinderGeometry args={[1.2, 1.2, 0.1, 16]} />
        <meshStandardMaterial color="#b45309" roughness={0.7} />
      </mesh>
    </group>
  );
}

// OUTDOOR CALISTHENICS & WORKOUT STATION
function WorkoutGymStation({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      {/* Rubberized Gym Tile Base */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.015, 0]}
        receiveShadow
      >
        <planeGeometry args={[6.5, 6.5]} />
        <meshStandardMaterial color="#1e293b" roughness={0.92} />
      </mesh>

      {/* High Pull-Up Bar Frame */}
      <group position={[-1.5, 0, 0]}>
        <mesh position={[-0.9, 1.5, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 3.0, 12]} />
          <meshStandardMaterial
            color="#e11d48"
            metalness={0.8}
            roughness={0.25}
          />
        </mesh>
        <mesh position={[0.9, 1.5, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 3.0, 12]} />
          <meshStandardMaterial
            color="#e11d48"
            metalness={0.8}
            roughness={0.25}
          />
        </mesh>
        {/* Steel Pull-up Bar */}
        <mesh position={[0, 2.95, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 1.85, 12]} />
          <meshStandardMaterial
            color="#f8fafc"
            metalness={0.95}
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* Parallel Dip Bars */}
      <group position={[1.5, 0, 0]}>
        {[-0.45, 0.45].map((dx) => (
          <group key={dx} position={[dx, 0, 0]}>
            <mesh position={[0, 0.7, -0.7]} castShadow>
              <cylinderGeometry args={[0.04, 0.04, 1.4, 12]} />
              <meshStandardMaterial
                color="#e11d48"
                metalness={0.8}
                roughness={0.25}
              />
            </mesh>
            <mesh position={[0, 0.7, 0.7]} castShadow>
              <cylinderGeometry args={[0.04, 0.04, 1.4, 12]} />
              <meshStandardMaterial
                color="#e11d48"
                metalness={0.8}
                roughness={0.25}
              />
            </mesh>
            <mesh
              position={[0, 1.38, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              castShadow
            >
              <cylinderGeometry args={[0.04, 0.04, 1.45, 12]} />
              <meshStandardMaterial
                color="#f8fafc"
                metalness={0.95}
                roughness={0.1}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

// SAKURA CHERRY BLOSSOM GROVE
function SakuraGrove({ center }: { center: [number, number, number] }) {
  return (
    <group position={center}>
      {/* Traditional Japanese Torii Gate at entrance */}
      <ToriiGate position={[4.0, 0, 4.0]} rotation={[0, -Math.PI / 4, 0]} />

      <CherryBlossomTree position={[0, 0, 0]} scale={1.35} />
      <CherryBlossomTree position={[-3.5, 0, 3.2]} scale={1.15} />
      <CherryBlossomTree position={[3.6, 0, -2.8]} scale={1.25} />
      <CherryBlossomTree position={[-3.2, 0, -3.6]} scale={1.1} />
      <CherryBlossomTree position={[4.2, 0, 3.4]} scale={1.3} />
      <CherryBlossomTree position={[-5.8, 0, 0.5]} scale={1.05} />
      <CherryBlossomTree position={[0.5, 0, -5.5]} scale={1.2} />
      <CherryBlossomTree position={[-1.8, 0, 5.2]} scale={1.1} />

      {/* Japanese Stone Lantern (Toro) */}
      <group position={[1.5, 0, 2.8]}>
        <mesh position={[0, 0.15, 0]} castShadow>
          <boxGeometry args={[0.45, 0.3, 0.45]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.16, 0.45, 8]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.85, 0]} castShadow>
          <boxGeometry args={[0.4, 0.28, 0.4]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.85, 0]}>
          <boxGeometry args={[0.26, 0.22, 0.26]} />
          <meshStandardMaterial
            color="#ffedd5"
            emissive="#ffedd5"
            emissiveIntensity={2.0}
          />
        </mesh>
        <mesh position={[0, 1.1, 0]} castShadow>
          <coneGeometry args={[0.38, 0.22, 4]} />
          <meshStandardMaterial color="#64748b" roughness={0.85} />
        </mesh>
      </group>
    </group>
  );
}

// JAPANESE SHINTO TORII GATE
function ToriiGate({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Two Main Pillars */}
      {[-1.4, 1.4].map((px) => (
        <mesh key={px} position={[px, 1.8, 0]} castShadow>
          <cylinderGeometry args={[0.13, 0.16, 3.6, 12]} />
          <meshStandardMaterial color="#dc2626" roughness={0.6} />
        </mesh>
      ))}
      {/* Stone Pillar Bases */}
      {[-1.4, 1.4].map((px) => (
        <mesh key={`base-${px}`} position={[px, 0.18, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.26, 0.36, 12]} />
          <meshStandardMaterial color="#1e293b" roughness={0.85} />
        </mesh>
      ))}
      {/* Lower Crossbeam (Nuki) */}
      <mesh position={[0, 2.7, 0]} castShadow>
        <boxGeometry args={[3.2, 0.16, 0.16]} />
        <meshStandardMaterial color="#dc2626" roughness={0.6} />
      </mesh>
      {/* Upper Main Lintel Beam (Kasagi) */}
      <mesh position={[0, 3.65, 0]} castShadow>
        <boxGeometry args={[3.9, 0.24, 0.22]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.6} />
      </mesh>
      {/* Top Black Cap */}
      <mesh position={[0, 3.82, 0]}>
        <boxGeometry args={[4.05, 0.08, 0.26]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>
    </group>
  );
}

// PINE EVERGREEN FOREST
function PineForest({ center }: { center: [number, number, number] }) {
  return (
    <group position={center}>
      <PineTree position={[0, 0, 0]} scale={1.5} />
      <PineTree position={[-3.2, 0, 2.8]} scale={1.3} />
      <PineTree position={[3.6, 0, -2.4]} scale={1.4} />
      <PineTree position={[2.4, 0, 3.6]} scale={1.2} />
      <PineTree position={[-3.6, 0, -3.2]} scale={1.45} />
      <PineTree position={[-5.8, 0, 1.2]} scale={1.15} />
      <PineTree position={[5.4, 0, 1.8]} scale={1.35} />
      <PineTree position={[0.8, 0, -5.8]} scale={1.25} />
      <PineTree position={[-1.5, 0, 6.2]} scale={1.4} />
      <PineTree position={[4.5, 0, -5.2]} scale={1.1} />

      {/* Rugged Forest Granite Boulders */}
      {[
        [-1.8, 0.4, 1.5],
        [2.2, 0.5, -1.0],
        [-3.8, 0.35, -1.5],
        [1.5, 0.3, 4.2],
      ].map(([bx, by, bz], i) => (
        <mesh key={i} position={[bx, by, bz]} castShadow receiveShadow>
          <dodecahedronGeometry args={[0.55 + (i % 2) * 0.2, 0]} />
          <meshStandardMaterial color="#64748b" roughness={0.92} />
        </mesh>
      ))}
    </group>
  );
}

// CHERRY BLOSSOM TREE (Flowering Pink)
function CherryBlossomTree({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.28, 2.8, 12]} />
        <meshStandardMaterial color="#3f2e23" roughness={0.85} />
      </mesh>
      <group position={[0, 2.9, 0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <sphereGeometry args={[1.35, 14, 14]} />
          <meshStandardMaterial color="#f472b6" roughness={0.7} />
        </mesh>
        <mesh position={[0.35, 0.7, -0.25]} castShadow>
          <sphereGeometry args={[1.1, 12, 12]} />
          <meshStandardMaterial color="#ec4899" roughness={0.7} />
        </mesh>
        <mesh position={[-0.25, 1.3, 0.15]} castShadow>
          <sphereGeometry args={[0.9, 12, 12]} />
          <meshStandardMaterial color="#fbcfe8" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

// PINE EVERGREEN TREE
function PineTree({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.24, 2.4, 10]} />
        <meshStandardMaterial color="#2d1e14" roughness={0.85} />
      </mesh>
      {[
        { y: 2.2, r: 1.25, h: 1.45 },
        { y: 3.2, r: 0.98, h: 1.35 },
        { y: 4.15, r: 0.68, h: 1.15 },
      ].map((tier, idx) => (
        <mesh key={idx} position={[0, tier.y, 0]} castShadow>
          <coneGeometry args={[tier.r, tier.h, 10]} />
          <meshStandardMaterial color="#14532d" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// MATURE OAK SHADE TREE
function OakTree({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.32, 2.8, 12]} />
        <meshStandardMaterial color="#422006" roughness={0.85} />
      </mesh>
      <group position={[0, 3.1, 0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <sphereGeometry args={[1.4, 12, 12]} />
          <meshStandardMaterial color="#15803d" roughness={0.78} />
        </mesh>
        <mesh position={[0.4, 0.8, -0.3]} castShadow>
          <sphereGeometry args={[1.15, 12, 12]} />
          <meshStandardMaterial color="#166534" roughness={0.78} />
        </mesh>
        <mesh position={[-0.3, 1.4, 0.2]} castShadow>
          <sphereGeometry args={[0.95, 12, 12]} />
          <meshStandardMaterial color="#22c55e" roughness={0.78} />
        </mesh>
      </group>
    </group>
  );
}

// AUTUMN MAPLE TREE (Vibrant Orange/Red Foliage)
function AutumnMapleTree({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.3, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.26, 2.6, 12]} />
        <meshStandardMaterial color="#451a03" roughness={0.85} />
      </mesh>
      <group position={[0, 2.9, 0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <sphereGeometry args={[1.3, 12, 12]} />
          <meshStandardMaterial color="#ea580c" roughness={0.75} />
        </mesh>
        <mesh position={[0.3, 0.7, -0.2]} castShadow>
          <sphereGeometry args={[1.05, 12, 12]} />
          <meshStandardMaterial color="#dc2626" roughness={0.75} />
        </mesh>
        <mesh position={[-0.2, 1.3, 0.1]} castShadow>
          <sphereGeometry args={[0.85, 12, 12]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.75} />
        </mesh>
      </group>
    </group>
  );
}

// WEEPING WILLOW TREE (Graceful drooping branches)
function WeepingWillowTree({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.35, 3.0, 12]} />
        <meshStandardMaterial color="#362112" roughness={0.9} />
      </mesh>
      <group position={[0, 3.2, 0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[1.8, 1.2, 1.4, 16]} />
          <meshStandardMaterial color="#65a30d" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.8, 0]} castShadow>
          <cylinderGeometry args={[2.1, 1.8, 1.1, 16]} />
          <meshStandardMaterial color="#4d7c0f" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

// MODERN TEAK & STEEL PARK BENCH
function ParkBench({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Matte Black Steel Side Legs */}
      {[-0.95, 0.95].map((x) => (
        <group key={x} position={[x, 0.26, 0]}>
          <mesh position={[0, 0, -0.24]} castShadow>
            <boxGeometry args={[0.06, 0.52, 0.06]} />
            <meshStandardMaterial
              color="#0f172a"
              metalness={0.85}
              roughness={0.25}
            />
          </mesh>
          <mesh position={[0, 0, 0.24]} castShadow>
            <boxGeometry args={[0.06, 0.52, 0.06]} />
            <meshStandardMaterial
              color="#0f172a"
              metalness={0.85}
              roughness={0.25}
            />
          </mesh>
          <mesh position={[0, -0.24, 0]}>
            <boxGeometry args={[0.06, 0.04, 0.54]} />
            <meshStandardMaterial
              color="#0f172a"
              metalness={0.85}
              roughness={0.25}
            />
          </mesh>
          <mesh position={[0, 0.22, 0]}>
            <boxGeometry args={[0.06, 0.04, 0.54]} />
            <meshStandardMaterial
              color="#0f172a"
              metalness={0.85}
              roughness={0.25}
            />
          </mesh>
          <mesh position={[0, 0.56, -0.24]} rotation={[-0.14, 0, 0]}>
            <boxGeometry args={[0.05, 0.65, 0.05]} />
            <meshStandardMaterial
              color="#0f172a"
              metalness={0.85}
              roughness={0.25}
            />
          </mesh>
        </group>
      ))}

      {/* Teak Wood Seat Slats */}
      {[-0.18, -0.08, 0.02, 0.12, 0.22].map((z, i) => (
        <RoundedBox
          key={`seat-${i}`}
          args={[2.2, 0.04, 0.08]}
          radius={0.012}
          position={[0, 0.49, z]}
          castShadow
        >
          <meshStandardMaterial
            color="#b45309"
            roughness={0.65}
            metalness={0.08}
          />
        </RoundedBox>
      ))}

      {/* Teak Wood Backrest Slats */}
      {[0.64, 0.74, 0.84].map((y, i) => (
        <RoundedBox
          key={`back-${i}`}
          args={[2.2, 0.08, 0.04]}
          radius={0.012}
          position={[0, y, -0.24 - i * 0.015]}
          rotation={[-0.14, 0, 0]}
          castShadow
        >
          <meshStandardMaterial
            color="#b45309"
            roughness={0.65}
            metalness={0.08}
          />
        </RoundedBox>
      ))}
    </group>
  );
}

// VINTAGE EUROPEAN STREET LAMP
function ParkLampPost({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 0.4, 12]} />
        <meshStandardMaterial
          color="#0f172a"
          metalness={0.85}
          roughness={0.25}
        />
      </mesh>
      <mesh position={[0, 1.9, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.09, 3.1, 12]} />
        <meshStandardMaterial
          color="#0f172a"
          metalness={0.85}
          roughness={0.25}
        />
      </mesh>
      <mesh position={[0, 3.5, 0]}>
        <cylinderGeometry args={[0.2, 0.14, 0.38, 6]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 3.5, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color="#fef08a"
          emissive="#fef08a"
          emissiveIntensity={3.2}
        />
      </mesh>
      <pointLight
        position={[0, 3.5, 0]}
        intensity={8}
        distance={8.5}
        color="#fef08a"
      />
    </group>
  );
}

// CONTINUOUS ARCHITECTURAL WALKWAY / PROMENADE
function ContinuousWalkway({
  start,
  end,
  width = 2.0,
  curb = true,
}: {
  start: [number, number, number];
  end: [number, number, number];
  width?: number;
  curb?: boolean;
}) {
  const dx = end[0] - start[0];
  const dz = end[2] - start[2];
  const dist = Math.hypot(dx, dz);
  if (dist < 0.1) return null;

  const midX = (start[0] + end[0]) / 2;
  const midZ = (start[2] + end[2]) / 2;
  const angle = Math.atan2(dx, dz);
  const curbWidth = 0.16;

  return (
    <group position={[midX, 0.012, midZ]} rotation={[-Math.PI / 2, 0, angle]}>
      {/* Main Flagstone Paver Walkway Surface */}
      <mesh receiveShadow>
        <planeGeometry args={[width, dist]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.82} />
      </mesh>

      {/* Left Stone Curb Border */}
      {curb && (
        <mesh position={[-width / 2 + curbWidth / 2, 0, 0.003]}>
          <planeGeometry args={[curbWidth, dist]} />
          <meshStandardMaterial color="#64748b" roughness={0.9} />
        </mesh>
      )}

      {/* Right Stone Curb Border */}
      {curb && (
        <mesh position={[width / 2 - curbWidth / 2, 0, 0.003]}>
          <planeGeometry args={[curbWidth, dist]} />
          <meshStandardMaterial color="#64748b" roughness={0.9} />
        </mesh>
      )}
    </group>
  );
}

// STONE PATHWAY (Continuous Promenade)
function StonePath(props: {
  start: [number, number, number];
  end: [number, number, number];
  width?: number;
  curb?: boolean;
}) {
  return <ContinuousWalkway {...props} />;
}

// LAVENDER FIELD (Fragrant Purple Row)
function LavenderField({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {Array.from({ length: 6 }).map((_, i) => (
        <group key={i} position={[(i - 2.5) * 0.7, 0, 0]}>
          <mesh position={[0, 0.22, 0]} castShadow>
            <cylinderGeometry args={[0.26, 0.2, 0.44, 8]} />
            <meshStandardMaterial color="#166534" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.48, 0]}>
            <sphereGeometry args={[0.22, 8, 8]} />
            <meshStandardMaterial color="#a855f7" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ROSE GARDEN
function RoseGarden({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[2.4, 0.24, 1.2]} />
        <meshStandardMaterial color="#64748b" roughness={0.8} />
      </mesh>
      {[-0.8, 0, 0.8].map((x, i) => (
        <group key={i} position={[x, 0.3, 0]}>
          <mesh position={[0, 0.2, 0]} castShadow>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshStandardMaterial color="#15803d" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.42, 0]}>
            <sphereGeometry args={[0.16, 8, 8]} />
            <meshStandardMaterial color="#e11d48" roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// MANICURED TOPIARY HEDGE ROW
function HedgeRow({
  position,
  length,
  rotation,
}: {
  position: [number, number, number];
  length: number;
  rotation: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[length, 1.0, 0.65]} />
        <meshStandardMaterial color="#14532d" roughness={0.85} />
      </mesh>
    </group>
  );
}

// DECORATIVE PERIMETER WALL
function PerimeterWall() {
  const size = 118;
  return (
    <group position={[0, 0.45, 0]}>
      <mesh position={[0, 0, size]}>
        <boxGeometry args={[size * 2, 0.9, 0.8]} />
        <meshStandardMaterial color="#64748b" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0, -size]}>
        <boxGeometry args={[size * 2, 0.9, 0.8]} />
        <meshStandardMaterial color="#64748b" roughness={0.85} />
      </mesh>
      <mesh position={[size, 0, 0]}>
        <boxGeometry args={[0.8, 0.9, size * 2]} />
        <meshStandardMaterial color="#64748b" roughness={0.85} />
      </mesh>
      <mesh position={[-size, 0, 0]}>
        <boxGeometry args={[0.8, 0.9, size * 2]} />
        <meshStandardMaterial color="#64748b" roughness={0.85} />
      </mesh>
    </group>
  );
}

// PARK WAYFINDING SIGNPOST / SOLAR TOTEM
function ParkWayfindingTotem({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 2.2, 12]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Solar Panel Hat */}
      <mesh position={[0, 2.25, 0]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.45, 0.03, 0.35]} />
        <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Direction Signboards */}
      <mesh position={[0.35, 1.8, 0]} rotation={[0, 0, -0.05]} castShadow>
        <boxGeometry args={[0.7, 0.16, 0.03]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>
      <mesh position={[-0.35, 1.5, 0]} rotation={[0, 0, 0.05]} castShadow>
        <boxGeometry args={[0.7, 0.16, 0.03]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>
    </group>
  );
}

// INTERACTIVE STORY QUEST WAYPOINT BEACON
function QuestWaypointBeacon({
  position,
  isActive,
  isCompleted,
  label,
}: {
  position: [number, number, number];
  isActive: boolean;
  isCompleted: boolean;
  label: string;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const diamondRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.8;
      if (isActive) {
        const s = 1 + 0.12 * Math.sin(t * 3.2);
        ringRef.current.scale.set(s, s, s);
      }
    }
    if (diamondRef.current && isActive) {
      diamondRef.current.position.y = 1.3 + 0.18 * Math.sin(t * 2.4);
      diamondRef.current.rotation.y = t * 1.5;
    }
  });

  const ringColor = isCompleted ? "#10b981" : isActive ? "#06b6d4" : "#64748b";

  return (
    <group position={position}>
      {/* Dynamic Ground Hologram Ring */}
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.04, 0]}
      >
        <ringGeometry args={[1.5, 1.9, 32]} />
        <meshBasicMaterial
          color={ringColor}
          transparent
          opacity={isActive ? 0.85 : isCompleted ? 0.4 : 0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Hologram Light Pillar & Floating Diamond Beacon (Active Quest Only) */}
      {isActive && (
        <>
          {/* Vertical Cyan Translucent Pillar */}
          <mesh position={[0, 4.2, 0]}>
            <cylinderGeometry args={[0.12, 0.75, 8.5, 16, 1, true]} />
            <meshBasicMaterial
              color="#06b6d4"
              transparent
              opacity={0.32}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Floating Rotating Quest Diamond Crystal */}
          <mesh ref={diamondRef} position={[0, 1.3, 0]}>
            <octahedronGeometry args={[0.42]} />
            <meshStandardMaterial
              color="#22d3ee"
              emissive="#06b6d4"
              emissiveIntensity={0.85}
              roughness={0.15}
            />
          </mesh>

          {/* Soft Ground Glow Disc */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
            <circleGeometry args={[1.3, 24]} />
            <meshBasicMaterial
              color="#06b6d4"
              transparent
              opacity={0.18}
              side={THREE.DoubleSide}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
