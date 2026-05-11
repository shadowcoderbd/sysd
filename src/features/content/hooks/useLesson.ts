import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchLessonHtml, getAdjacentLessons, getLesson } from "@/services/content.service";
import type { Chapter, Lesson, NavigationTarget } from "../types";

interface UseLessonResult {
  chapter: Chapter | undefined;
  lesson: Lesson | undefined;
  html: string;
  loading: boolean;
  error: string | null;
  prev: NavigationTarget | null;
  next: NavigationTarget | null;
}

export function useLesson(): UseLessonResult {
  const { chapterSlug, lessonSlug } = useParams<{ chapterSlug: string; lessonSlug: string }>();
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const result = chapterSlug && lessonSlug ? getLesson(chapterSlug, lessonSlug) : undefined;
  const { prev, next } =
    chapterSlug && lessonSlug
      ? getAdjacentLessons(chapterSlug, lessonSlug)
      : { prev: null, next: null };

  useEffect(() => {
    if (!result) {
      setLoading(false);
      setError("Lesson not found");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchLessonHtml(result.lesson.htmlFile)
      .then((data) => {
        if (!cancelled) {
          setHtml(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load lesson");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [result?.lesson.htmlFile]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    chapter: result?.chapter,
    lesson: result?.lesson,
    html,
    loading,
    error,
    prev,
    next,
  };
}
