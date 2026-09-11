"use client";

/* © 2026 Aditya Sarode. All rights reserved. */

import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { choreographer, RobotJointState } from "@/lib/action-choreographer";
import { speechService, LipSyncData } from "@/lib/speech-service";

export const TeslaOptimusModel = React.memo(function TeslaOptimusModel() {
  const rootRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const visorMouthRef = useRef<THREE.Group>(null);
  const leftShoulderRef = useRef<THREE.Group>(null);
  const leftElbowRef = useRef<THREE.Group>(null);
  const leftHandRef = useRef<THREE.Group>(null);
  const rightShoulderRef = useRef<THREE.Group>(null);
  const rightElbowRef = useRef<THREE.Group>(null);
  const rightHandRef = useRef<THREE.Group>(null);
  const leftHipRef = useRef<THREE.Group>(null);
  const leftKneeRef = useRef<THREE.Group>(null);
  const rightHipRef = useRef<THREE.Group>(null);
  const rightKneeRef = useRef<THREE.Group>(null);
  const leftFootRef = useRef<THREE.Group>(null);
  const rightFootRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);

  const [lipData, setLipData] = useState<LipSyncData>({
    speaking: false,
    amplitude: 0,
    viseme: "closed",
  });

  useEffect(() => {
    const unsub = speechService.onLipSync((d) => setLipData(d));
    return unsub;
  }, []);

  const shockwaveRef = useRef<THREE.Mesh>(null);

  // 60FPS FRAME-BY-FRAME CONTINUOUS GROUND TRANSLATION & FULL KINEMATIC LOOP
  useFrame((state, delta) => {
    const now = performance.now();
    const t = state.clock.elapsedTime;

    // Evaluate live physics coordinates & kinematic DOFs at 60 FPS!
    const jointState: RobotJointState = choreographer.update(delta, now);

    if (rootRef.current) {
      // Set real-world coordinates on every frame!
      rootRef.current.position.set(
        jointState.worldPos[0],
        jointState.worldPos[1] +
          jointState.jumpY -
          (jointState.squat || 0) * 0.45,
        jointState.worldPos[2],
      );
      rootRef.current.rotation.set(jointState.rootPitch, jointState.yaw, 0);
    }

    // Dynamic Visor Waveform / Mouth Light
    if (visorMouthRef.current) {
      const amp = lipData.speaking ? lipData.amplitude : 0;
      visorMouthRef.current.scale.set(1.0 + amp * 0.9, 0.2 + amp * 2.4, 1);
    }

    // Shockwave expansion on dynamic impacts/landings
    if (shockwaveRef.current) {
      if (jointState.shockwave > 0.05) {
        const scale = 1 + (1 - jointState.shockwave) * 4.5;
        shockwaveRef.current.scale.set(scale, scale, 1);
        (shockwaveRef.current.material as THREE.MeshBasicMaterial).opacity =
          jointState.shockwave * 0.75;
        shockwaveRef.current.visible = true;
      } else {
        shockwaveRef.current.visible = false;
      }
    }

    // Kinematic Articulation
    if (jointState.isSitting) {
      // SEATED ON BENCH (Fold knees 90°, rest hands comfortably on lap)
      if (torsoRef.current) torsoRef.current.rotation.set(-0.06, 0, 0);
      if (headRef.current)
        headRef.current.rotation.set(-0.02, Math.sin(t * 0.8) * 0.1, 0);
      if (leftHipRef.current) leftHipRef.current.rotation.set(1.57, 0, 0);
      if (rightHipRef.current) rightHipRef.current.rotation.set(1.57, 0, 0);
      if (leftKneeRef.current) leftKneeRef.current.rotation.set(1.57, 0, 0);
      if (rightKneeRef.current) rightKneeRef.current.rotation.set(1.57, 0, 0);
      if (leftShoulderRef.current)
        leftShoulderRef.current.rotation.set(0.6, 0, 0.1);
      if (rightShoulderRef.current)
        rightShoulderRef.current.rotation.set(0.6, 0, -0.1);
      if (leftElbowRef.current) leftElbowRef.current.rotation.set(1.0, 0, 0);
      if (rightElbowRef.current) rightElbowRef.current.rotation.set(1.0, 0, 0);
    } else {
      // FULL MULTI-AXIS PROCEDURAL KINEMATICS (Supports custom actions, gestures, and locomotion)
      const hasCustomKinematics =
        Math.abs(jointState.torsoPitch) > 0.01 ||
        Math.abs(jointState.torsoRoll) > 0.01 ||
        Math.abs(jointState.headPitch) > 0.01 ||
        Math.abs(jointState.headYaw) > 0.01 ||
        Math.abs(jointState.leftArmPitch) > 0.01 ||
        Math.abs(jointState.rightArmPitch) > 0.01 ||
        Math.abs(jointState.leftLegPitch) > 0.01 ||
        Math.abs(jointState.rightLegPitch) > 0.01 ||
        Math.abs(jointState.squat) > 0.01;

      // Torso Pitch, Roll & Yaw
      if (torsoRef.current) {
        torsoRef.current.rotation.x = THREE.MathUtils.damp(
          torsoRef.current.rotation.x,
          jointState.torsoPitch,
          18,
          delta,
        );
        torsoRef.current.rotation.z = THREE.MathUtils.damp(
          torsoRef.current.rotation.z,
          jointState.torsoRoll,
          18,
          delta,
        );
        torsoRef.current.rotation.y = THREE.MathUtils.damp(
          torsoRef.current.rotation.y,
          jointState.torsoYaw,
          18,
          delta,
        );
      }

      // Head Pitch, Yaw & Roll
      if (headRef.current) {
        const idleHead = !hasCustomKinematics ? Math.sin(t * 0.7) * 0.06 : 0;
        headRef.current.rotation.x = THREE.MathUtils.damp(
          headRef.current.rotation.x,
          jointState.headPitch,
          18,
          delta,
        );
        headRef.current.rotation.y = THREE.MathUtils.damp(
          headRef.current.rotation.y,
          jointState.headYaw + idleHead,
          18,
          delta,
        );
        headRef.current.rotation.z = THREE.MathUtils.damp(
          headRef.current.rotation.z,
          jointState.headRoll,
          18,
          delta,
        );
      }

      // Left Arm & Elbow
      if (leftShoulderRef.current) {
        leftShoulderRef.current.rotation.x = THREE.MathUtils.damp(
          leftShoulderRef.current.rotation.x,
          jointState.leftArmPitch,
          20,
          delta,
        );
        leftShoulderRef.current.rotation.z = THREE.MathUtils.damp(
          leftShoulderRef.current.rotation.z,
          jointState.leftArmRoll + 0.06,
          20,
          delta,
        );
      }
      if (leftElbowRef.current) {
        leftElbowRef.current.rotation.x = THREE.MathUtils.damp(
          leftElbowRef.current.rotation.x,
          jointState.leftElbow,
          20,
          delta,
        );
      }
      if (leftHandRef.current) {
        leftHandRef.current.rotation.y = THREE.MathUtils.damp(
          leftHandRef.current.rotation.y,
          jointState.leftHandRotate,
          20,
          delta,
        );
      }

      // Right Arm & Elbow
      if (rightShoulderRef.current) {
        rightShoulderRef.current.rotation.x = THREE.MathUtils.damp(
          rightShoulderRef.current.rotation.x,
          jointState.rightArmPitch,
          20,
          delta,
        );
        rightShoulderRef.current.rotation.z = THREE.MathUtils.damp(
          rightShoulderRef.current.rotation.z,
          jointState.rightArmRoll - 0.06,
          20,
          delta,
        );
      }
      if (rightElbowRef.current) {
        rightElbowRef.current.rotation.x = THREE.MathUtils.damp(
          rightElbowRef.current.rotation.x,
          jointState.rightElbow,
          20,
          delta,
        );
      }
      if (rightHandRef.current) {
        rightHandRef.current.rotation.y = THREE.MathUtils.damp(
          rightHandRef.current.rotation.y,
          jointState.rightHandRotate,
          20,
          delta,
        );
      }

      // Left Leg & Knee
      if (leftHipRef.current) {
        leftHipRef.current.rotation.x = THREE.MathUtils.damp(
          leftHipRef.current.rotation.x,
          jointState.leftLegPitch,
          20,
          delta,
        );
      }
      if (leftKneeRef.current) {
        const squatKnee = (jointState.squat || 0) * 1.2;
        leftKneeRef.current.rotation.x = THREE.MathUtils.damp(
          leftKneeRef.current.rotation.x,
          jointState.leftKnee + squatKnee,
          20,
          delta,
        );
      }
      if (leftFootRef.current) {
        leftFootRef.current.rotation.x = THREE.MathUtils.damp(
          leftFootRef.current.rotation.x,
          -jointState.leftLegPitch * 0.48 - jointState.leftKnee * 0.18,
          20,
          delta,
        );
      }

      // Right Leg & Knee
      if (rightHipRef.current) {
        rightHipRef.current.rotation.x = THREE.MathUtils.damp(
          rightHipRef.current.rotation.x,
          jointState.rightLegPitch,
          20,
          delta,
        );
      }
      if (rightKneeRef.current) {
        const squatKnee = (jointState.squat || 0) * 1.2;
        rightKneeRef.current.rotation.x = THREE.MathUtils.damp(
          rightKneeRef.current.rotation.x,
          jointState.rightKnee + squatKnee,
          20,
          delta,
        );
      }
      if (rightFootRef.current) {
        rightFootRef.current.rotation.x = THREE.MathUtils.damp(
          rightFootRef.current.rotation.x,
          -jointState.rightLegPitch * 0.48 - jointState.rightKnee * 0.18,
          20,
          delta,
        );
      }

      // Subtle organic idle breathing when stationary
      if (!hasCustomKinematics && torsoRef.current) {
        const breath = Math.sin(t * 2.2) * 0.015;
        torsoRef.current.position.y = breath;
      }
    }
  });

  // TESLA OPTIMUS MATERIALS
  const pearlWhiteArmor = (
    <meshStandardMaterial color="#f8f9fa" metalness={0.4} roughness={0.16} />
  );
  const darkCarbonCore = (
    <meshStandardMaterial color="#121417" metalness={0.9} roughness={0.25} />
  );
  const titaniumJoints = (
    <meshStandardMaterial color="#2d3139" metalness={0.92} roughness={0.2} />
  );
  const obsidianFaceVisor = (
    <meshStandardMaterial color="#050608" metalness={0.98} roughness={0.04} />
  );
  const teslaCyanOptics = (
    <meshStandardMaterial
      color="#00f2ff"
      emissive="#00f2ff"
      emissiveIntensity={3.5}
    />
  );
  const teslaEmblemGlow = (
    <meshStandardMaterial
      color="#0071e3"
      emissive="#0071e3"
      emissiveIntensity={2.8}
    />
  );

  return (
    <group ref={rootRef}>
      {/* 1. ILLUMINATED GROUND NAVIGATION BEACON & FORWARD ARROW (UNMISTAKABLE FRONT VS BACK) */}
      <group position={[0, 0.02, 0]}>
        {/* Dynamic Impact Shockwave Ring */}
        <mesh
          ref={shockwaveRef}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.005, 0]}
          visible={false}
        >
          <ringGeometry args={[0.3, 0.65, 32]} />
          <meshBasicMaterial color="#00f2ff" transparent opacity={0.7} />
        </mesh>
        {/* Forward Arrow pointing North/Heading */}
        <mesh position={[0, 0, 0.58]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.15, 0.34, 3]} />
          <meshBasicMaterial color="#0071e3" />
        </mesh>
        {/* Compass Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.48, 0.54, 36]} />
          <meshBasicMaterial color="#0071e3" transparent opacity={0.5} />
        </mesh>
      </group>

      {/* 2. PELVIS / BASE */}
      <group position={[0, 1.05, 0]}>
        <RoundedBox args={[0.48, 0.24, 0.32]} radius={0.06} castShadow>
          {darkCarbonCore}
        </RoundedBox>

        {/* 3. TORSO & CHEST */}
        <group ref={torsoRef} position={[0, 0.16, 0]}>
          {/* BACK: Carbon Fiber Spine Vertebrae */}
          <mesh position={[0, 0.18, -0.1]} castShadow>
            <cylinderGeometry args={[0.12, 0.16, 0.26, 12]} />
            {darkCarbonCore}
          </mesh>

          {/* Chest & Armor */}
          <group position={[0, 0.54, 0]}>
            <RoundedBox args={[0.74, 0.58, 0.38]} radius={0.12} castShadow>
              {pearlWhiteArmor}
            </RoundedBox>

            {/* FRONT: Glowing Tesla Shield / Reactor Emblem */}
            <mesh position={[0, 0.1, 0.2]} castShadow>
              <boxGeometry args={[0.09, 0.025, 0.01]} />
              {teslaEmblemGlow}
            </mesh>

            {/* BACK: Twin Rear Radiator Vents */}
            <mesh position={[-0.18, 0.12, -0.2]}>
              <boxGeometry args={[0.08, 0.22, 0.02]} />
              {darkCarbonCore}
            </mesh>
            <mesh position={[0.18, 0.12, -0.2]}>
              <boxGeometry args={[0.08, 0.22, 0.02]} />
              {darkCarbonCore}
            </mesh>

            {/* 4. NECK & HEAD */}
            <group position={[0, 0.38, 0]}>
              <mesh position={[0, 0.06, 0]}>
                <cylinderGeometry args={[0.08, 0.1, 0.14, 12]} />
                {titaniumJoints}
              </mesh>

              {/* HEAD */}
              <group ref={headRef} position={[0, 0.22, 0]}>
                <RoundedBox args={[0.42, 0.44, 0.38]} radius={0.1} castShadow>
                  {pearlWhiteArmor}
                </RoundedBox>

                {/* FRONT: Obsidian Face Visor */}
                <mesh position={[0, -0.02, 0.16]} rotation={[-0.08, 0, 0]}>
                  <boxGeometry args={[0.36, 0.34, 0.08]} />
                  {obsidianFaceVisor}
                </mesh>

                {/* FRONT: Dual Glowing Cyan Eyes */}
                <mesh position={[-0.09, 0.05, 0.21]}>
                  <sphereGeometry args={[0.022, 12, 12]} />
                  {teslaCyanOptics}
                </mesh>
                <mesh position={[0.09, 0.05, 0.21]}>
                  <sphereGeometry args={[0.022, 12, 12]} />
                  {teslaCyanOptics}
                </mesh>

                {/* FRONT: Waveform Mouth Light */}
                <group ref={visorMouthRef} position={[0, -0.08, 0.21]}>
                  <mesh>
                    <boxGeometry args={[0.18, 0.015, 0.005]} />
                    {teslaEmblemGlow}
                  </mesh>
                </group>
              </group>
            </group>

            {/* 5. ARMS */}
            <group ref={leftShoulderRef} position={[-0.46, 0.2, 0]}>
              <mesh>
                <sphereGeometry args={[0.11, 16, 16]} />
                {titaniumJoints}
              </mesh>
              <group position={[-0.04, -0.26, 0]}>
                <RoundedBox args={[0.14, 0.36, 0.16]} radius={0.05} castShadow>
                  {pearlWhiteArmor}
                </RoundedBox>
                <group ref={leftElbowRef} position={[0, -0.22, 0]}>
                  <mesh rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.07, 0.07, 0.12, 12]} />
                    {titaniumJoints}
                  </mesh>
                  <group ref={leftHandRef} position={[0, -0.24, 0]}>
                    <RoundedBox
                      args={[0.12, 0.32, 0.14]}
                      radius={0.04}
                      castShadow
                    >
                      {pearlWhiteArmor}
                    </RoundedBox>
                    <mesh position={[0, -0.2, 0]}>
                      <boxGeometry args={[0.08, 0.12, 0.05]} />
                      {darkCarbonCore}
                    </mesh>
                  </group>
                </group>
              </group>
            </group>

            <group ref={rightShoulderRef} position={[0.46, 0.2, 0]}>
              <mesh>
                <sphereGeometry args={[0.11, 16, 16]} />
                {titaniumJoints}
              </mesh>
              <group position={[0.04, -0.26, 0]}>
                <RoundedBox args={[0.14, 0.36, 0.16]} radius={0.05} castShadow>
                  {pearlWhiteArmor}
                </RoundedBox>
                <group ref={rightElbowRef} position={[0, -0.22, 0]}>
                  <mesh rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.07, 0.07, 0.12, 12]} />
                    {titaniumJoints}
                  </mesh>
                  <group ref={rightHandRef} position={[0, -0.24, 0]}>
                    <RoundedBox
                      args={[0.12, 0.32, 0.14]}
                      radius={0.04}
                      castShadow
                    >
                      {pearlWhiteArmor}
                    </RoundedBox>
                    <mesh position={[0, -0.2, 0]}>
                      <boxGeometry args={[0.08, 0.12, 0.05]} />
                      {darkCarbonCore}
                    </mesh>
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>

        {/* 6. LEGS */}
        <group ref={leftHipRef} position={[-0.18, -0.08, 0]}>
          <group position={[0, -0.3, 0]}>
            <RoundedBox args={[0.18, 0.44, 0.19]} radius={0.05} castShadow>
              {pearlWhiteArmor}
            </RoundedBox>
            <group ref={leftKneeRef} position={[0, -0.26, 0]}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.08, 0.08, 0.15, 12]} />
                {titaniumJoints}
              </mesh>
              <group position={[0, -0.28, 0]}>
                <RoundedBox args={[0.16, 0.4, 0.17]} radius={0.04} castShadow>
                  {darkCarbonCore}
                </RoundedBox>
                {/* FRONT Knee Cap */}
                <mesh position={[0, 0.18, 0.1]}>
                  <boxGeometry args={[0.12, 0.1, 0.03]} />
                  {pearlWhiteArmor}
                </mesh>
                {/* Boot & Forward Toes */}
                <group ref={leftFootRef} position={[0, -0.24, 0.08]}>
                  <RoundedBox args={[0.16, 0.1, 0.34]} radius={0.03} castShadow>
                    {darkCarbonCore}
                  </RoundedBox>
                </group>
              </group>
            </group>
          </group>
        </group>

        <group ref={rightHipRef} position={[0.18, -0.08, 0]}>
          <group position={[0, -0.3, 0]}>
            <RoundedBox args={[0.18, 0.44, 0.19]} radius={0.05} castShadow>
              {pearlWhiteArmor}
            </RoundedBox>
            <group ref={rightKneeRef} position={[0, -0.26, 0]}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.08, 0.08, 0.15, 12]} />
                {titaniumJoints}
              </mesh>
              <group position={[0, -0.28, 0]}>
                <RoundedBox args={[0.16, 0.4, 0.17]} radius={0.04} castShadow>
                  {darkCarbonCore}
                </RoundedBox>
                {/* FRONT Knee Cap */}
                <mesh position={[0, 0.18, 0.1]}>
                  <boxGeometry args={[0.12, 0.1, 0.03]} />
                  {pearlWhiteArmor}
                </mesh>
                {/* Boot & Forward Toes */}
                <group ref={rightFootRef} position={[0, -0.24, 0.08]}>
                  <RoundedBox args={[0.16, 0.1, 0.34]} radius={0.03} castShadow>
                    {darkCarbonCore}
                  </RoundedBox>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
});
