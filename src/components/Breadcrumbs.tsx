import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const routeLabels: Record<string, string> = {
  dashboard: "Início",
  pecas: "Peças",
  nova: "Nova Peça",
  editar: "Editar",
  triagem: "Avaliação",
  plano: "Plano Técnico",
  producao: "Produção",
  inspecao: "Inspeção",
  entrega: "Entrega",
  documentos: "Documentos",
  clientes: "Clientes",
  novo: "Novo",
  scanner: "QR Code",
  config: "Configurações",
  maquinas: "Máquinas",
  produtos: "Produtos",
  equipe: "Equipe",
  relatorios: "Relatórios",
  upgrade: "Upgrade",
  admin: "Admin",
  tenants: "Empresas",
  financeiro: "Financeiro",
};

// UUID regex
const isUUID = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export function Breadcrumbs() {
  const location = useLocation();
  const [pecaCodigo, setPecaCodigo] = useState<Record<string, string>>({});

  const segments = location.pathname.split("/").filter(Boolean);

  // Fetch peça code for UUID segments
  useEffect(() => {
    segments.forEach((seg) => {
      if (isUUID(seg) && !pecaCodigo[seg]) {
        supabase.from("pecas").select("codigo_interno").eq("id", seg).single()
          .then(({ data }) => {
            if (data?.codigo_interno) {
              setPecaCodigo((prev) => ({ ...prev, [seg]: data.codigo_interno }));
            }
          });
      }
    });
  }, [location.pathname]);

  if (segments.length <= 1) return null; // Don't show for root-level pages

  const crumbs = segments.map((seg, i) => {
    const path = "/" + segments.slice(0, i + 1).join("/");
    const label = isUUID(seg) ? (pecaCodigo[seg] || "...") : (routeLabels[seg] || seg);
    const isLast = i === segments.length - 1;
    return { path, label, isLast };
  });

  return (
    <nav className="flex items-center gap-1 px-4 lg:px-6 py-2 text-xs text-muted-foreground overflow-x-auto">
      <Link to="/dashboard" className="hover:text-foreground transition-colors flex-shrink-0">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.path} className="flex items-center gap-1 flex-shrink-0">
          <ChevronRight className="h-3 w-3" />
          {crumb.isLast ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
