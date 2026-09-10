"use client";

/* © 2026 Aditya Sarode. All rights reserved. */

export type QuestChapter = {
  id: string;
  title: string;
  subtitle: string;
  landmarkKey:
    | "fountain"
    | "cherryTree"
    | "lakePier"
    | "gazebo"
    | "workoutStation";
  targetPos: [number, number, number];
  radius: number;
  objectiveText: string;
  introDialogue: string;
  completionDialogue: string;
  rewardAction: string;
  rewardBadge: string;
};

export const STORY_CHAPTERS: QuestChapter[] = [
  {
    id: "ch-1",
    title: "Chapter 1: The Fountain Awakening",
    subtitle: "Central Grand Plaza",
    landmarkKey: "fountain",
    targetPos: [0, 0, 4.5],
    radius: 3.5,
    objectiveText:
      "Approach the Grand Marble Fountain to activate the park crystal.",
    introDialogue:
      "Welcome, Explorer! Our journey begins at the Central Fountain. Approach the sparkling fountain to wake the park crystal.",
    completionDialogue:
      "Magnificent! The crystal resonates with vibrant cyan energy. The park waters are now alive!",
    rewardAction: "wave hello",
    rewardBadge: "Crystal Seeker",
  },
  {
    id: "ch-2",
    title: "Chapter 2: The Sakura Shrine Secret",
    subtitle: "Northwest Cherry Grove",
    landmarkKey: "cherryTree",
    targetPos: [-22.0, 0, -18.0],
    radius: 4.5,
    objectiveText:
      "Journey northwest along the paved promenade to the Torii Gate & Sakura Tree.",
    introDialogue:
      "Head northwest through the gardens to the ancient Sakura Tree. Legend says the Torii Gate guards ancient cyber wisdom.",
    completionDialogue:
      "You have arrived at the sacred Torii Gate! Pink cherry blossoms drift gently around you in harmony.",
    rewardAction: "bow politely",
    rewardBadge: "Sakura Guardian",
  },
  {
    id: "ch-3",
    title: "Chapter 3: The Lakeside Reflection",
    subtitle: "West Waterfront Boardwalk",
    landmarkKey: "lakePier",
    targetPos: [-32.0, 0, 18.0],
    radius: 3.8,
    objectiveText: "Walk out onto the wooden pier over the scenic lake.",
    introDialogue:
      "Proceed west to the Waterfront Pier. Stand over the deep blue lake waters to reflect and recharge your energy.",
    completionDialogue:
      "Breathtaking view! The sun glimmers over the water lilies and moored rowboats. Your focus is restored.",
    rewardAction: "zen yoga balance",
    rewardBadge: "Lakeside Wanderer",
  },
  {
    id: "ch-4",
    title: "Chapter 4: The Gazebo Summit Celebration",
    subtitle: "East Pavilion & Grand Finale",
    landmarkKey: "gazebo",
    targetPos: [28.0, 0, 20.0],
    radius: 4.2,
    objectiveText:
      "Advance east to the Classical Cedar Gazebo and celebrate our grand journey!",
    introDialogue:
      "For our final summit, cross the grand boulevard to the Cedar Gazebo on the east lawn. A celebration awaits!",
    completionDialogue:
      "Incredible achievement! You have traversed the grand expanse of Cyber Park, conquered every trail, and reached the summit!",
    rewardAction: "dance hip hop",
    rewardBadge: "Master of Cyber Park",
  },
];

export class StoryEngine {
  private currentChapterIndex: number = 0;
  private completedChapterIds: Set<string> = new Set();
  private hasSpokenIntro: boolean = false;
  private onStoryUpdate:
    | ((state: {
        currentChapter: QuestChapter;
        chapterIndex: number;
        totalChapters: number;
        completedIds: string[];
        isFinished: boolean;
        distanceToTarget: number;
      }) => void)
    | null = null;

  public setStoryListener(
    cb: (state: {
      currentChapter: QuestChapter;
      chapterIndex: number;
      totalChapters: number;
      completedIds: string[];
      isFinished: boolean;
      distanceToTarget: number;
    }) => void,
  ) {
    this.onStoryUpdate = cb;
  }

  public getCurrentChapter(): QuestChapter {
    return STORY_CHAPTERS[
      Math.min(this.currentChapterIndex, STORY_CHAPTERS.length - 1)
    ];
  }

  public isFinished(): boolean {
    return this.completedChapterIds.size >= STORY_CHAPTERS.length;
  }

  public checkPlayerPosition(playerPos: [number, number, number]): {
    justCompleted: boolean;
    chapter?: QuestChapter;
    dist: number;
  } {
    const chapter = this.getCurrentChapter();
    const dist = Math.hypot(
      playerPos[0] - chapter.targetPos[0],
      playerPos[2] - chapter.targetPos[2],
    );

    this.notify(dist);

    if (dist <= chapter.radius && !this.completedChapterIds.has(chapter.id)) {
      this.completedChapterIds.add(chapter.id);
      const finishedChapter = chapter;

      if (this.currentChapterIndex < STORY_CHAPTERS.length - 1) {
        this.currentChapterIndex++;
        this.hasSpokenIntro = false;
      }

      this.notify(dist);
      return { justCompleted: true, chapter: finishedChapter, dist };
    }

    return { justCompleted: false, dist };
  }

  public advanceToChapter(index: number) {
    if (index >= 0 && index < STORY_CHAPTERS.length) {
      this.currentChapterIndex = index;
      this.hasSpokenIntro = false;
      this.notify(10);
    }
  }

  public markIntroSpoken() {
    this.hasSpokenIntro = true;
  }

  public shouldSpeakIntro(): boolean {
    return !this.hasSpokenIntro;
  }

  private notify(dist: number) {
    if (this.onStoryUpdate) {
      this.onStoryUpdate({
        currentChapter: this.getCurrentChapter(),
        chapterIndex: this.currentChapterIndex,
        totalChapters: STORY_CHAPTERS.length,
        completedIds: Array.from(this.completedChapterIds),
        isFinished: this.isFinished(),
        distanceToTarget: Math.round(dist),
      });
    }
  }
}

export const storyEngine = new StoryEngine();
