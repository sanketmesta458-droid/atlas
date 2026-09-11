"use client";

/* © 2026 Aditya Sarode. All rights reserved. */

import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { choreographer, RobotJointState } from "@/lib/action-choreographer";
import { speechService, LipSyncData } from "@/lib/speech-service";

export const HumanCharacterModel = React.memo(function HumanCharacterModel() {
  const rootRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Group>(null);
  const rightEyeRef = useRef<THREE.Group>(null);

  const torsoRef = useRef<THREE.Group>(null);
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

  const [lipData, setLipData] = useState<LipSyncData>({
    speaking: false,
    amplitude: 0,
    viseme: "closed",
  });

  useEffect(() => {
    const unsub = speechService.onLipSync((d) => setLipData(d));
    return unsub;
  }, []);

  // 60FPS KINEMATIC SIMULATION LOOP
  useFrame((state, delta) => {
    const now = performance.now();
    const t = state.clock.elapsedTime;

    // Retrieve physical coordinates and full joint articulation
    const jointState: RobotJointState = choreographer.update(delta, now);

    if (rootRef.current) {
      rootRef.current.position.set(
        jointState.worldPos[0],
        jointState.worldPos[1] +
          jointState.jumpY -
          (jointState.squat || 0) * 0.45,
        jointState.worldPos[2],
      );
      rootRef.current.rotation.set(jointState.rootPitch, jointState.yaw, 0);
    }

    // Dynamic Human Speech & Lip-Sync
    if (mouthRef.current) {
      if (lipData.speaking) {
        const openY = 0.2 + lipData.amplitude * 2.2;
        const openX = 1.0 + (lipData.viseme === "wide" ? 0.35 : 0.0);
        mouthRef.current.scale.set(openX, openY, 1);
      } else {
        mouthRef.current.scale.set(1, 0.15, 1);
      }
    }

    // Natural Eye Blinking
    const blinkCycle = Math.sin(t * 1.6);
    const isBlinking = blinkCycle > 0.96;
    if (leftEyeRef.current && rightEyeRef.current) {
      const eyeScaleY = isBlinking ? 0.1 : 1.0;
      leftEyeRef.current.scale.y = eyeScaleY;
      rightEyeRef.current.scale.y = eyeScaleY;
    }

    // Articulation Logic
    if (jointState.isSitting) {
      // Natural Bench Sitting: folded 90 deg knees, hands resting on lap
      if (torsoRef.current) torsoRef.current.rotation.set(-0.06, 0, 0);
      if (headRef.current)
        headRef.current.rotation.set(-0.04, Math.sin(t * 0.8) * 0.08, 0);
      if (leftHipRef.current) leftHipRef.current.rotation.set(1.57, 0, 0.05);
      if (rightHipRef.current) rightHipRef.current.rotation.set(1.57, 0, -0.05);
      if (leftKneeRef.current) leftKneeRef.current.rotation.set(1.57, 0, 0);
      if (rightKneeRef.current) rightKneeRef.current.rotation.set(1.57, 0, 0);
      if (leftShoulderRef.current)
        leftShoulderRef.current.rotation.set(0.65, 0, 0.12);
      if (rightShoulderRef.current)
        rightShoulderRef.current.rotation.set(0.65, 0, -0.12);
      if (leftElbowRef.current) leftElbowRef.current.rotation.set(1.05, 0, 0);
      if (rightElbowRef.current) rightElbowRef.current.rotation.set(1.05, 0, 0);
    } else {
      const hasCustomKinematics =
        Math.abs(jointState.torsoPitch) > 0.01 ||
        Math.abs(jointState.torsoRoll) > 0.01 ||
        Math.abs(jointState.headPitch) > 0.01 ||
        Math.abs(jointState.headYaw) > 0.01 ||
        Math.abs(jointState.leftArmPitch) > 0.01 ||
        Math.abs(jointState.rightArmPitch) > 0.01 ||
        Math.abs(jointState.leftLegPitch) > 0.01 ||
        Math.abs(jointState.rightLegPitch) > 0.01;

      // Natural Human Breathing & Torso Articulation
      const breath = !hasCustomKinematics ? Math.sin(t * 2.2) * 0.015 : 0;

      if (torsoRef.current) {
        torsoRef.current.rotation.x = THREE.MathUtils.damp(
          torsoRef.current.rotation.x,
          jointState.torsoPitch + breath,
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

      // Head Pitch, Yaw & Roll with natural idle micro-movements
      if (headRef.current) {
        const idleLook = !hasCustomKinematics ? Math.sin(t * 0.9) * 0.04 : 0;
        headRef.current.rotation.x = THREE.MathUtils.damp(
          headRef.current.rotation.x,
          jointState.headPitch,
          18,
          delta,
        );
        headRef.current.rotation.y = THREE.MathUtils.damp(
          headRef.current.rotation.y,
          jointState.headYaw + idleLook,
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

      // Left Arm & Forearm
      if (leftShoulderRef.current) {
        leftShoulderRef.current.rotation.x = THREE.MathUtils.damp(
          leftShoulderRef.current.rotation.x,
          jointState.leftArmPitch,
          18,
          delta,
        );
        leftShoulderRef.current.rotation.z = THREE.MathUtils.damp(
          leftShoulderRef.current.rotation.z,
          0.08 + jointState.leftArmRoll,
          18,
          delta,
        );
      }
      if (leftElbowRef.current) {
        leftElbowRef.current.rotation.x = THREE.MathUtils.damp(
          leftElbowRef.current.rotation.x,
          jointState.leftElbow,
          18,
          delta,
        );
      }
      if (leftHandRef.current) {
        leftHandRef.current.rotation.y = THREE.MathUtils.damp(
          leftHandRef.current.rotation.y,
          jointState.leftHandRotate,
          18,
          delta,
        );
      }

      // Right Arm & Forearm
      if (rightShoulderRef.current) {
        rightShoulderRef.current.rotation.x = THREE.MathUtils.damp(
          rightShoulderRef.current.rotation.x,
          jointState.rightArmPitch,
          18,
          delta,
        );
        rightShoulderRef.current.rotation.z = THREE.MathUtils.damp(
          rightShoulderRef.current.rotation.z,
          -0.08 - jointState.rightArmRoll,
          18,
          delta,
        );
      }
      if (rightElbowRef.current) {
        rightElbowRef.current.rotation.x = THREE.MathUtils.damp(
          rightElbowRef.current.rotation.x,
          jointState.rightElbow,
          18,
          delta,
        );
      }
      if (rightHandRef.current) {
        rightHandRef.current.rotation.y = THREE.MathUtils.damp(
          rightHandRef.current.rotation.y,
          jointState.rightHandRotate,
          18,
          delta,
        );
      }

      // Left Leg & Knee
      if (leftHipRef.current) {
        leftHipRef.current.rotation.x = THREE.MathUtils.damp(
          leftHipRef.current.rotation.x,
          jointState.leftLegPitch,
          18,
          delta,
        );
      }
      if (leftKneeRef.current) {
        leftKneeRef.current.rotation.x = THREE.MathUtils.damp(
          leftKneeRef.current.rotation.x,
          jointState.leftKnee,
          18,
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
          18,
          delta,
        );
      }
      if (rightKneeRef.current) {
        rightKneeRef.current.rotation.x = THREE.MathUtils.damp(
          rightKneeRef.current.rotation.x,
          jointState.rightKnee,
          18,
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
    }
  });

  // HUMAN CHARACTER MATERIALS
  const skinTone = (
    <meshStandardMaterial color="#f0b98e" roughness={0.65} metalness={0.05} />
  );
  const hairMaterial = (
    <meshStandardMaterial color="#1e1b18" roughness={0.85} metalness={0.1} />
  );
  const jacketMain = (
    <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.15} />
  );
  const jacketAccent = (
    <meshStandardMaterial color="#0071e3" roughness={0.4} metalness={0.25} />
  );
  const shirtWhite = (
    <meshStandardMaterial color="#f8fafc" roughness={0.8} />
  );
  const pantsDark = (
    <meshStandardMaterial color="#0f172a" roughness={0.7} />
  );
  const sneakerWhite = (
    <meshStandardMaterial color="#ffffff" roughness={0.4} />
  );
  const sneakerSole = (
    <meshStandardMaterial color="#0284c7" roughness={0.3} />
  );
  const eyeMaterial = (
    <meshStandardMaterial color="#1e293b" roughness={0.1} metalness={0.2} />
  );
  const lipMaterial = (
    <meshStandardMaterial color="#d9777f" roughness={0.5} />
  );

  return (
    <group ref={rootRef}>
      {/* GROUND HEADING RING & FORWARD ARROW */}
      <group position={[0, 0.02, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.38, 0.44, 32]} />
          <meshBasicMaterial color="#0071e3" transparent opacity={0.45} />
        </mesh>
        <mesh position={[0, 0, 0.52]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.12, 0.28, 3]} />
          <meshBasicMaterial color="#0071e3" />
        </mesh>
      </group>

      {/* PELVIS / HIPS */}
      <group position={[0, 0.98, 0]}>
        <RoundedBox args={[0.38, 0.2, 0.26]} radius={0.06} castShadow>
          {pantsDark}
        </RoundedBox>

        {/* TORSO & JACKET */}
        <group ref={torsoRef} position={[0, 0.12, 0]}>
          {/* Lower Waist */}
          <mesh position={[0, 0.12, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.19, 0.22, 16]} />
            {shirtWhite}
          </mesh>

          {/* Main Chest & Athletic Tech Jacket */}
          <group position={[0, 0.36, 0]}>
            <RoundedBox args={[0.54, 0.48, 0.32]} radius={0.09} castShadow>
              {jacketMain}
            </RoundedBox>

            {/* Front Jacket Zipper & Collar */}
            <mesh position={[0, 0.02, 0.165]} castShadow>
              <boxGeometry args={[0.035, 0.44, 0.015]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.14, 0.166]}>
              <boxGeometry args={[0.08, 0.14, 0.01]} />
              {shirtWhite}
            </mesh>

            {/* Athletic Shoulder Accent Stripes */}
            <mesh position={[-0.22, 0.18, 0]}>
              <boxGeometry args={[0.1, 0.04, 0.3]} />
              {jacketAccent}
            </mesh>
            <mesh position={[0.22, 0.18, 0]}>
              <boxGeometry args={[0.1, 0.04, 0.3]} />
              {jacketAccent}
            </mesh>

            {/* NECK */}
            <group position={[0, 0.28, 0]}>
              <mesh position={[0, 0.05, 0]} castShadow>
                <cylinderGeometry args={[0.085, 0.095, 0.12, 16]} />
                {skinTone}
              </mesh>

              {/* HEAD */}
              <group ref={headRef} position={[0, 0.22, 0]}>
                {/* Face & Cranium Base */}
                <RoundedBox args={[0.28, 0.32, 0.28]} radius={0.08} castShadow>
                  {skinTone}
                </RoundedBox>

                {/* Stylish Hair (Volumetric modern styled haircut) */}
                <group position={[0, 0.1, -0.02]}>
                  {/* Top Hair Volume */}
                  <RoundedBox args={[0.31, 0.18, 0.3]} radius={0.07} castShadow>
                    {hairMaterial}
                  </RoundedBox>
                  {/* Front Styled Bangs / Tuft */}
                  <mesh position={[0, 0.08, 0.13]} rotation={[-0.25, 0, 0]}>
                    <coneGeometry args={[0.16, 0.14, 5]} />
                    {hairMaterial}
                  </mesh>
                  {/* Left & Right Sideburns */}
                  <mesh position={[-0.145, -0.08, 0.02]}>
                    <boxGeometry args={[0.03, 0.14, 0.12]} />
                    {hairMaterial}
                  </mesh>
                  <mesh position={[0.145, -0.08, 0.02]}>
                    <boxGeometry args={[0.03, 0.14, 0.12]} />
                    {hairMaterial}
                  </mesh>
                </group>

                {/* Left & Right Ears */}
                <mesh position={[-0.15, -0.01, 0]}>
                  <sphereGeometry args={[0.045, 8, 8]} />
                  {skinTone}
                </mesh>
                <mesh position={[0.15, -0.01, 0]}>
                  <sphereGeometry args={[0.045, 8, 8]} />
                  {skinTone}
                </mesh>

                {/* Eyebrows */}
                <mesh position={[-0.065, 0.065, 0.142]} rotation={[0, 0, 0.05]}>
                  <boxGeometry args={[0.06, 0.012, 0.01]} />
                  {hairMaterial}
                </mesh>
                <mesh position={[0.065, 0.065, 0.142]} rotation={[0, 0, -0.05]}>
                  <boxGeometry args={[0.06, 0.012, 0.01]} />
                  {hairMaterial}
                </mesh>

                {/* Expressive Human Eyes */}
                <group ref={leftEyeRef} position={[-0.065, 0.035, 0.14]}>
                  {/* Sclera */}
                  <mesh>
                    <sphereGeometry args={[0.024, 12, 12]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.1} />
                  </mesh>
                  {/* Pupil / Iris */}
                  <mesh position={[0, 0, 0.018]}>
                    <sphereGeometry args={[0.012, 10, 10]} />
                    {eyeMaterial}
                  </mesh>
                </group>

                <group ref={rightEyeRef} position={[0.065, 0.035, 0.14]}>
                  <mesh>
                    <sphereGeometry args={[0.024, 12, 12]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.1} />
                  </mesh>
                  <mesh position={[0, 0, 0.018]}>
                    <sphereGeometry args={[0.012, 10, 10]} />
                    {eyeMaterial}
                  </mesh>
                </group>

                {/* Nose */}
                <mesh position={[0, -0.015, 0.152]} rotation={[-0.15, 0, 0]}>
                  <coneGeometry args={[0.024, 0.048, 4]} />
                  {skinTone}
                </mesh>

                {/* Dynamic Mouth with Real-time Speech Sync */}
                <group ref={mouthRef} position={[0, -0.075, 0.142]}>
                  <mesh>
                    <boxGeometry args={[0.075, 0.018, 0.008]} />
                    {lipMaterial}
                  </mesh>
                </group>
              </group>
            </group>

            {/* LEFT ARM */}
            <group ref={leftShoulderRef} position={[-0.34, 0.16, 0]}>
              {/* Shoulder joint & Sleeve */}
              <mesh position={[0, -0.12, 0]} castShadow>
                <cylinderGeometry args={[0.08, 0.07, 0.24, 14]} />
                {jacketMain}
              </mesh>
              {/* Forearm & Hand */}
              <group ref={leftElbowRef} position={[0, -0.24, 0]}>
                <mesh position={[0, -0.11, 0]} castShadow>
                  <cylinderGeometry args={[0.065, 0.055, 0.22, 14]} />
                  {skinTone}
                </mesh>
                {/* Smart Watch on Left Wrist */}
                <mesh position={[0, -0.18, 0]}>
                  <cylinderGeometry args={[0.068, 0.068, 0.035, 16]} />
                  <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.1} />
                </mesh>
                {/* Natural Human Hand */}
                <group ref={leftHandRef} position={[0, -0.26, 0]}>
                  <RoundedBox args={[0.07, 0.1, 0.045]} radius={0.015} castShadow>
                    {skinTone}
                  </RoundedBox>
                </group>
              </group>
            </group>

            {/* RIGHT ARM */}
            <group ref={rightShoulderRef} position={[0.34, 0.16, 0]}>
              <mesh position={[0, -0.12, 0]} castShadow>
                <cylinderGeometry args={[0.08, 0.07, 0.24, 14]} />
                {jacketMain}
              </mesh>
              <group ref={rightElbowRef} position={[0, -0.24, 0]}>
                <mesh position={[0, -0.11, 0]} castShadow>
                  <cylinderGeometry args={[0.065, 0.055, 0.22, 14]} />
                  {skinTone}
                </mesh>
                {/* Hand */}
                <group ref={rightHandRef} position={[0, -0.26, 0]}>
                  <RoundedBox args={[0.07, 0.1, 0.045]} radius={0.015} castShadow>
                    {skinTone}
                  </RoundedBox>
                </group>
              </group>
            </group>
          </group>
        </group>

        {/* LEFT LEG */}
        <group ref={leftHipRef} position={[-0.13, -0.1, 0]}>
          {/* Thigh */}
          <mesh position={[0, -0.22, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.075, 0.38, 16]} />
            {pantsDark}
          </mesh>
          {/* Shin & Foot */}
          <group ref={leftKneeRef} position={[0, -0.42, 0]}>
            <mesh position={[0, -0.2, 0]} castShadow>
              <cylinderGeometry args={[0.072, 0.06, 0.38, 16]} />
              {pantsDark}
            </mesh>
            {/* Sneaker */}
            <group ref={leftFootRef} position={[0, -0.42, 0.06]}>
              {/* Sneaker Body */}
              <RoundedBox args={[0.12, 0.1, 0.26]} radius={0.025} castShadow>
                {sneakerWhite}
              </RoundedBox>
              {/* Sole */}
              <mesh position={[0, -0.055, 0]}>
                <boxGeometry args={[0.13, 0.025, 0.28]} />
                {sneakerSole}
              </mesh>
            </group>
          </group>
        </group>

        {/* RIGHT LEG */}
        <group ref={rightHipRef} position={[0.13, -0.1, 0]}>
          <mesh position={[0, -0.22, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.075, 0.38, 16]} />
            {pantsDark}
          </mesh>
          <group ref={rightKneeRef} position={[0, -0.42, 0]}>
            <mesh position={[0, -0.2, 0]} castShadow>
              <cylinderGeometry args={[0.072, 0.06, 0.38, 16]} />
              {pantsDark}
            </mesh>
            {/* Sneaker */}
            <group ref={rightFootRef} position={[0, -0.42, 0.06]}>
              <RoundedBox args={[0.12, 0.1, 0.26]} radius={0.025} castShadow>
                {sneakerWhite}
              </RoundedBox>
              <mesh position={[0, -0.055, 0]}>
                <boxGeometry args={[0.13, 0.025, 0.28]} />
                {sneakerSole}
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
});
