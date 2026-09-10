'use client'

/* © 2026 Aditya Sarode. All rights reserved. */

export type DanceLesson = {
  id: string
  title: string
  genre: string
  difficulty: 'Beginner' | 'Intermediate' | 'Pro'
  tempoBpm: number
  steps: { name: string; cue: string; duration: number }[]
  narration: string
}

export const DANCE_LESSONS: DanceLesson[] = [
  {
    id: 'hiphop-groove',
    title: 'Street Hip-Hop Bounce',
    genre: 'Hip-Hop',
    difficulty: 'Beginner',
    tempoBpm: 120,
    steps: [
      { name: 'Knee Dip & Bounce', cue: 'Drop your center of gravity and pulse to the 808 bass kick', duration: 2.0 },
      { name: 'Alternating Arm Push', cue: 'Push left then right hand forward to the beat', duration: 2.0 },
      { name: 'Chest Pop & Lock', cue: 'Isolate the torso and contract on the snare clap', duration: 2.0 }
    ],
    narration: "Welcome to Hip-Hop groove coaching! Keep your knees loose, feel the heavy downbeat, and let your torso absorb the rhythm."
  },
  {
    id: 'salsa-cubana',
    title: 'Salsa Cubana Rhythm',
    genre: 'Latin',
    difficulty: 'Intermediate',
    tempoBpm: 128,
    steps: [
      { name: 'Basic 1-2-3 Forward', cue: 'Step forward left, recover right, bring feet together', duration: 2.0 },
      { name: 'Back 5-6-7 Stride', cue: 'Step back right, recover left, pause on 8', duration: 2.0 },
      { name: 'Arm Flare & Spin', cue: 'Raise right hand high and execute a fluid 180° pivot', duration: 2.0 }
    ],
    narration: "Salsa is all about rhythmic hip weight transfer! 1, 2, 3... 5, 6, 7. Let's move together!"
  },
  {
    id: 'moonwalk-glide',
    title: 'Michael Jackson Moonwalk',
    genre: 'Funk & Pop',
    difficulty: 'Pro',
    tempoBpm: 116,
    steps: [
      { name: 'Heel Pop & Toe Plant', cue: 'Lift right heel, keep left foot completely flat', duration: 1.8 },
      { name: 'Smooth Backwards Slide', cue: 'Glide left foot flat backwards past the right heel', duration: 2.0 },
      { name: 'Weight Switch Illusion', cue: 'Snap left heel up and slide right foot flat back', duration: 2.0 }
    ],
    narration: "The secret to the moonwalk is the weight illusion: the foot that looks like it is pushing is actually floating!"
  },
  {
    id: 'robot-isolation',
    title: 'Cybernetic Pop & Lock',
    genre: 'Robotics',
    difficulty: 'Intermediate',
    tempoBpm: 124,
    steps: [
      { name: 'Wrist 360 Snap', cue: 'Rotate hands rapidly and lock angles at 90 degrees', duration: 1.5 },
      { name: 'Head Micro-Glitch', cue: 'Nod and tilt head in rapid geometric increments', duration: 1.5 },
      { name: 'Pelvis & Knee Staccato', cue: 'Stop all momentum on the hi-hat tick', duration: 1.5 }
    ],
    narration: "Robotic popping requires mechanical precision. Tense your servos at the apex of every motion!"
  }
]
