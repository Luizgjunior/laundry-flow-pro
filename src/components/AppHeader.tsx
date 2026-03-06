import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";

export function AppHeader() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">T</span>
          </div>
          <span className="font-bold text-foreground">TexTrace</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-medium text-foreground">{user?.nome}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{user?.role?.replace("_", " ")}</p>
          </div>
          <button onClick={signOut} className="rounded-lg p-2 text-muted-foreground hover:bg-card active:scale-95">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
