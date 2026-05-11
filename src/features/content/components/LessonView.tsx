import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useLesson } from "../hooks/useLesson";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LessonView() {
  const { chapter, lesson, html, loading, error, prev, next } = useLesson();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [lesson?.slug]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !chapter || !lesson) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">{error ?? "Lesson not found"}</p>
        <Link to="/" className={cn(buttonVariants({ variant: "outline" }))}>
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 lg:px-8">
      <div className="mb-6">
        <span className="text-sm font-medium text-muted-foreground">
          Chapter {chapter.chapterIndex} &middot; {chapter.chapterTitle}
        </span>
      </div>

      <article className="lesson-content" dangerouslySetInnerHTML={{ __html: html }} />

      <nav className="mt-12 flex items-center justify-between gap-4 border-t border-border pt-6">
        {prev ? (
          <Link to={`/${prev.chapterSlug}/${prev.lessonSlug}`} className={cn(buttonVariants({ variant: "ghost" }), "gap-1.5")}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{prev.title}</span>
            <span className="sm:hidden">Previous</span>
          </Link>
        ) : (
          <div />
        )}

        {next ? (
          <Link to={`/${next.chapterSlug}/${next.lessonSlug}`} className={cn(buttonVariants({ variant: "ghost" }), "gap-1.5")}>
            <span className="hidden sm:inline">{next.title}</span>
            <span className="sm:hidden">Next</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </div>
  );
}
