import { Outlet } from "react-router-dom";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export function RootLayout() {
  const { isOpen, close } = useSidebar();

  return (
    <div className="flex h-screen flex-col">
      <TopNav />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden w-72 shrink-0 border-r border-border bg-sidebar lg:block">
          <Sidebar />
        </aside>

        {/* Mobile sidebar */}
        <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
          <SheetContent side="left" className="w-72 p-0">
            <div className="h-full overflow-hidden pt-12">
              <Sidebar />
            </div>
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
