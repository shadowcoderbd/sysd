import { useParams } from "react-router-dom";
import { getManifest } from "@/services/content.service";

export function useActiveRoute() {
  const { chapterSlug, lessonSlug } = useParams<{ chapterSlug: string; lessonSlug: string }>();
  return { chapterSlug, lessonSlug };
}

export function useChapters() {
  return getManifest();
}
