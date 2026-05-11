import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { useChapters } from "../hooks/useNavigation";

export function HomePage() {
  const chapters = useChapters();

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">System Design</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          A comprehensive guide to modern system design, from building blocks to real-world architectures.
        </p>
      </div>

      <div className="grid gap-3">
        {chapters.map((chapter) => (
          <Link
            key={chapter.chapterIndex}
            to={`/${chapter.chapterSlug}/${chapter.lessons[0]?.slug ?? ""}`}
            className="group flex items-start gap-4 rounded-xl border border-border p-4 transition-colors hover:bg-accent"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
              {chapter.chapterIndex}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold group-hover:text-primary">{chapter.chapterTitle}</h2>
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5" />
                <span>
                  {chapter.lessons.length} lesson{chapter.lessons.length !== 1 && "s"}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
