import { Menu, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { SearchDialog } from "@/features/search/components/SearchDialog";
import { Button } from "@/components/ui/button";

export function TopNav() {
  const { theme, toggleTheme } = useTheme();
  const { toggle } = useSidebar();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggle}>
        <Menu className="h-5 w-5" />
      </Button>

      <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
        <span className="text-lg">System Design</span>
      </Link>

      <div className="flex-1" />

      <SearchDialog />

      <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </header>
  );
}
