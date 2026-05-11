import contentManifest from "@/data/content.json";
import type { Chapter, ContentManifest, Lesson, NavigationTarget } from "@/features/content/types";

const manifest: ContentManifest = contentManifest as ContentManifest;

export function getManifest(): ContentManifest {
  return manifest;
}

export function getChapter(chapterSlug: string): Chapter | undefined {
  return manifest.find((c) => c.chapterSlug === chapterSlug);
}

export function getLesson(chapterSlug: string, lessonSlug: string): { chapter: Chapter; lesson: Lesson } | undefined {
  const chapter = getChapter(chapterSlug);
  if (!chapter) return undefined;
  const lesson = chapter.lessons.find((l) => l.slug === lessonSlug);
  if (!lesson) return undefined;
  return { chapter, lesson };
}

const BASE = import.meta.env.BASE_URL;

export async function fetchLessonHtml(htmlFile: string): Promise<string> {
  const resp = await fetch(`${BASE}${htmlFile}`);
  if (!resp.ok) throw new Error(`Failed to load lesson: ${resp.statusText}`);
  return resp.text();
}

export function getAllLessonsFlat(): NavigationTarget[] {
  return manifest.flatMap((chapter) =>
    chapter.lessons.map((lesson) => ({
      chapterSlug: chapter.chapterSlug,
      lessonSlug: lesson.slug,
      title: lesson.title,
      chapterTitle: chapter.chapterTitle,
    }))
  );
}

export function getAdjacentLessons(
  chapterSlug: string,
  lessonSlug: string
): { prev: NavigationTarget | null; next: NavigationTarget | null } {
  const flat = getAllLessonsFlat();
  const idx = flat.findIndex((l) => l.chapterSlug === chapterSlug && l.lessonSlug === lessonSlug);
  return {
    prev: idx > 0 ? flat[idx - 1]! : null,
    next: idx < flat.length - 1 ? flat[idx + 1]! : null,
  };
}
