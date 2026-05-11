export interface Lesson {
  lessonIndex: number;
  title: string;
  slug: string;
  htmlFile: string;
}

export interface Chapter {
  chapterIndex: number;
  chapterTitle: string;
  chapterSlug: string;
  lessons: Lesson[];
}

export type ContentManifest = Chapter[];

export interface NavigationTarget {
  chapterSlug: string;
  lessonSlug: string;
  title: string;
  chapterTitle: string;
}
