import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import { getAllLessonsFlat } from "@/services/content.service";
import type { NavigationTarget } from "@/features/content/types";

const lessons = getAllLessonsFlat();
const fuse = new Fuse(lessons, {
  keys: ["title", "chapterTitle"],
  threshold: 0.4,
  includeScore: true,
});

export function useSearch() {
  const [query, setQuery] = useState("");

  const results: NavigationTarget[] = useMemo(() => {
    if (!query.trim()) return [];
    return fuse.search(query, { limit: 12 }).map((r) => r.item);
  }, [query]);

  return { query, setQuery, results };
}
