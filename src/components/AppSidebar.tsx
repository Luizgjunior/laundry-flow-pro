import { memo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getMenuItemsForRole } from "@/lib/menuItems";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

export const AppSidebar = memo(function AppSidebar({ collapsed, onToggle }: Props) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const items = getMenuItemsForRole(user?.role);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen border-r border-border bg-background flex flex-col z-40 hidden lg:flex transition-all duration-300",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* Header */}
      <div className={cn("h-16 flex items-center border-b border-border", collapsed ? "justify-center px-2" : "px-6")}>
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-primary-foreground">T</span>
        </div>
        {!collapsed && (
          <div className="ml-3 min-w-0">
            <p className="font-semibold text-foreground text-sm">TexTrace</p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.role === "admin_global" ? "Admin Global" : "Lavanderia"}
            </p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {items.filter(i => !i.isBottom).map((item) => {
          return renderItem(item);
        })}
      </nav>

      {/* Bottom nav items (Config etc.) */}
      {items.filter(i => i.isBottom).length > 0 && (
        <div className="px-2 py-2 border-t border-border space-y-1">
          {items.filter(i => i.isBottom).map((item) => {
            return renderItem(item);
          })}
        </div>
      )}

      {/* Footer */}
      <div className={cn("border-t border-border", collapsed ? "p-2" : "p-4")}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">
                    {user?.nome?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">{user?.nome}</TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button onClick={signOut} className="p-2 text-muted-foreground hover:text-foreground">
                  <LogOut className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sair</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-semibold">
                {user?.nome?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.nome}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.funcao || user?.role?.replace("_", " ")}</p>
            </div>
            <button onClick={signOut} className="p-2 text-muted-foreground hover:text-foreground">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
});
