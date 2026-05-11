import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "@/components/layout/RootLayout";
import { HomePage } from "@/features/content/components/HomePage";
import { LessonView } from "@/features/content/components/LessonView";

export const router = createBrowserRouter(
  [
    {
      element: <RootLayout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: ":chapterSlug/:lessonSlug", element: <LessonView /> },
        {
          path: "*",
          element: (
            <div className="flex min-h-[60vh] items-center justify-center">
              <p className="text-lg text-muted-foreground">Page not found</p>
            </div>
          ),
        },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL }
);
