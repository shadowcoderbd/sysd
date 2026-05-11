import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useLesson } from "../hooks/useLesson";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function initSlideGroups(container: HTMLElement) {
  const groups = container.querySelectorAll<HTMLElement>(".slide-group");
  groups.forEach((group) => {
    const slides = group.querySelectorAll<HTMLElement>("figure.slide");
    if (slides.length === 0) return;

    slides[0]?.classList.add("active");

    const nav = document.createElement("div");
    nav.className = "slide-nav";

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "‹";
    prevBtn.ariaLabel = "Previous slide";

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "›";
    nextBtn.ariaLabel = "Next slide";

    const label = document.createElement("span");
    label.textContent = `1 / ${slides.length}`;

    let current = 0;

    function update() {
      slides.forEach((s, i) => s.classList.toggle("active", i === current));
      label.textContent = `${current + 1} / ${slides.length}`;
      prevBtn.disabled = current === 0;
      nextBtn.disabled = current === slides.length - 1;
    }

    prevBtn.addEventListener("click", () => { if (current > 0) { current--; update(); } });
    nextBtn.addEventListener("click", () => { if (current < slides.length - 1) { current++; update(); } });

    nav.append(prevBtn, label, nextBtn);
    group.appendChild(nav);
    update();
  });
}

export function LessonView() {
  const { chapter, lesson, html, loading, error, prev, next } = useLesson();
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [lesson?.slug]);

  useEffect(() => {
    if (articleRef.current && html) {
      initSlideGroups(articleRef.current);
    }
  }, [html]);

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

      <article ref={articleRef} className="lesson-content" dangerouslySetInnerHTML={{ __html: html }} />

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
