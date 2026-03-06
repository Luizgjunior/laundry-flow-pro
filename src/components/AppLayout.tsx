import { Outlet } from "react-router-dom";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { BottomNav } from "./BottomNav";

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col lg:ml-64">
        <AppHeader />
        <main className="flex-1 pb-20 lg:pb-0 overflow-y-auto">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
