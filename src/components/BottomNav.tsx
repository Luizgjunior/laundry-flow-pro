import { memo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getMenuItemsForRole } from "@/lib/menuItems";
import { cn } from "@/lib/utils";
import { MoreHorizontal, LogOut } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export const BottomNav = memo(function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const allItems = getMenuItemsForRole(user?.role);
  const [moreOpen, setMoreOpen] = useState(false);

  // Show first 4 items + "More" if more than 5
  const hasMore = allItems.length > 5;
  const visibleItems = hasMore ? allItems.slice(0, 4) : allItems.slice(0, 5);
  const extraItems = hasMore ? allItems.slice(4) : [];

  const handleNavigate = (href: string) => {
    navigate(href);
    setMoreOpen(false);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="flex items-center justify-around px-1 py-1">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== "/" && item.href !== "/admin" && location.pathname.startsWith(item.href + "/"));
            const Icon = item.icon;

            if (item.isAction) {
              return (
                <button key={item.href} onClick={() => handleNavigate(item.href)}
                  className="flex -mt-4 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg active:scale-95 transition-transform"
                >
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </button>
              );
            }

            return (
              <button key={item.href} onClick={() => handleNavigate(item.href)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-2 transition-colors min-w-0",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              </button>
            );
          })}

          {hasMore && (
            <button
              onClick={() => setMoreOpen(true)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-2 transition-colors",
                moreOpen ? "text-primary" : "text-muted-foreground"
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[10px] font-medium">Mais</span>
            </button>
          )}
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-3 py-4">
            {extraItems.map((item) => {
              const isActive = location.pathname === item.href ||
                (item.href !== "/" && location.pathname.startsWith(item.href + "/"));
              const Icon = item.icon;

              return (
                <button
                  key={item.href}
                  onClick={() => handleNavigate(item.href)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl p-4 transition-colors active:scale-95",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-card text-foreground border border-border"
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}

            {/* Logout in mobile more menu */}
            <button
              onClick={() => { setMoreOpen(false); signOut(); }}
              className="flex flex-col items-center gap-2 rounded-xl p-4 transition-colors active:scale-95 bg-card text-destructive border border-border"
            >
              <LogOut className="h-6 w-6" />
              <span className="text-xs font-medium">Sair</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
});
