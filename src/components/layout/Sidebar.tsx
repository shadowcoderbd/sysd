import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChapters } from "@/features/content";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSidebar } from "@/contexts/SidebarContext";

export function Sidebar() {
  const chapters = useChapters();
  const { chapterSlug, lessonSlug } = useParams<{ chapterSlug: string; lessonSlug: string }>();
  const { close } = useSidebar();

  return (
    <ScrollArea className="h-full">
      <nav className="p-3">
        {chapters.map((chapter) => (
          <ChapterGroup
            key={chapter.chapterIndex}
            chapterIndex={chapter.chapterIndex}
            chapterTitle={chapter.chapterTitle}
            chapterSlug={chapter.chapterSlug}
            lessons={chapter.lessons}
            isActiveChapter={chapter.chapterSlug === chapterSlug}
            activeLessonSlug={chapterSlug === chapter.chapterSlug ? lessonSlug : undefined}
            onNavigate={close}
          />
        ))}
      </nav>
    </ScrollArea>
  );
}

interface ChapterGroupProps {
  chapterIndex: number;
  chapterTitle: string;
  chapterSlug: string;
  lessons: { lessonIndex: number; title: string; slug: string }[];
  isActiveChapter: boolean;
  activeLessonSlug?: string;
  onNavigate: () => void;
}

function ChapterGroup({
  chapterIndex,
  chapterTitle,
  chapterSlug,
  lessons,
  isActiveChapter,
  activeLessonSlug,
  onNavigate,
}: ChapterGroupProps) {
  const [expanded, setExpanded] = useState(isActiveChapter);

  return (
    <div className="mb-1">
      <button
        onClick={() => setExpanded((p) => !p)}
        className={cn(
          "flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm font-medium transition-colors hover:bg-accent",
          isActiveChapter && "text-primary"
        )}
      >
        <ChevronRight
          className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-90")}
        />
        <span className="mr-1 shrink-0 text-xs text-muted-foreground">{chapterIndex}.</span>
        <span className="truncate">{chapterTitle}</span>
      </button>

      {expanded && (
        <ul className="ml-3 border-l border-border pl-2 pt-0.5">
          {lessons.map((lesson) => {
            const isActive = activeLessonSlug === lesson.slug;
            return (
              <li key={lesson.lessonIndex}>
                <Link
                  to={`/${chapterSlug}/${lesson.slug}`}
                  onClick={onNavigate}
                  className={cn(
                    "block rounded-md px-2 py-1 text-[13px] leading-snug transition-colors hover:bg-accent",
                    isActive
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {lesson.title}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
