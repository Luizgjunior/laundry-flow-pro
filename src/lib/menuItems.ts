import {
  LayoutDashboard, Package, PlusCircle, Users, Settings,
  Building2, QrCode, UserCog, DollarSign, BarChart3, type LucideIcon
} from "lucide-react";

export interface MenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  isAction?: boolean;
  isBottom?: boolean;
}

export function getMenuItemsForRole(role: string | undefined): MenuItem[] {
  if (role === "admin_global") {
    return [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/tenants", label: "Empresas", icon: Building2 },
      { href: "/admin/financeiro", label: "Financeiro", icon: DollarSign },
      { href: "/admin/config", label: "Configurações", icon: Settings, isBottom: true },
    ];
  }

  if (role === "admin_empresa") {
    return [
      { href: "/dashboard", label: "Início", icon: LayoutDashboard },
      { href: "/pecas", label: "Peças", icon: Package },
      { href: "/pecas/nova", label: "Nova Peça", icon: PlusCircle, isAction: true },
      { href: "/clientes", label: "Clientes", icon: Users },
      { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
      { href: "/scanner", label: "QR Code", icon: QrCode },
      { href: "/config", label: "Config", icon: Settings },
      { href: "/config/equipe", label: "Equipe", icon: UserCog },
    ];
  }

  // usuario
  return [
    { href: "/dashboard", label: "Início", icon: LayoutDashboard },
    { href: "/pecas", label: "Peças", icon: Package },
    { href: "/pecas/nova", label: "Nova Peça", icon: PlusCircle, isAction: true },
    { href: "/clientes", label: "Clientes", icon: Users },
    { href: "/scanner", label: "QR Code", icon: QrCode },
  ];
}
