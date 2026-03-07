import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Package, DollarSign, Users, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { format, subDays } from "date-fns";

const COLORS = ["hsl(221, 83%, 53%)", "hsl(160, 84%, 39%)", "hsl(43, 96%, 56%)", "hsl(0, 84%, 60%)", "hsl(263, 70%, 50%)", "hsl(330, 81%, 60%)"];

const statusLabels: Record<string, string> = {
  entrada: "Entrada", diagnostico: "Diagnóstico", aguardando_aprovacao: "Aguardando",
  aprovado: "Aprovado", em_processo: "Em Processo", inspecao: "Inspeção",
  pronto: "Pronto", entregue: "Entregue", recusado: "Recusado", incidente: "Incidente",
};

export default function Relatorios() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState("30");
  const [stats, setStats] = useState({ totalPecas: 0, pecasEntregues: 0, receitaTotal: 0, ticketMedio: 0, taxaAprovacao: 0, tempoMedioProcesso: 0 });
  const [pecasPorDia, setPecasPorDia] = useState<{ date: string; count: number }[]>([]);
  const [pecasPorStatus, setPecasPorStatus] = useState<{ name: string; value: number }[]>([]);
  const [pecasPorTipo, setPecasPorTipo] = useState<{ name: string; value: number }[]>([]);
  const [receitaPorDia, setReceitaPorDia] = useState<{ date: string; valor: number }[]>([]);

  useEffect(() => { loadRelatorios(); }, [periodo]);

  const loadRelatorios = async () => {
    setLoading(true);
    const dataInicio = subDays(new Date(), parseInt(periodo)).toISOString();

    const [pecasRes, totalAprovRes, aprovRes] = await Promise.all([
      supabase.from("pecas").select("*").gte("created_at", dataInicio).order("created_at", { ascending: true }),
      supabase.from("aprovacoes").select("*", { count: "exact", head: true }).gte("created_at", dataInicio),
      supabase.from("aprovacoes").select("*", { count: "exact", head: true }).eq("status", "aprovado").gte("created_at", dataInicio),
    ]);

    const pecas = pecasRes.data || [];
    const entregues = pecas.filter((p) => p.status === "entregue");
    const receitaTotal = entregues.reduce((s, p) => s + (p.valor_servico || 0), 0);

    const pecasComTempo = entregues.filter((p) => p.data_entrega && p.created_at);
    const tempoTotal = pecasComTempo.reduce((s, p) => {
      return s + (new Date(p.data_entrega!).getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24);
    }, 0);

    setStats({
      totalPecas: pecas.length,
      pecasEntregues: entregues.length,
      receitaTotal,
      ticketMedio: entregues.length ? receitaTotal / entregues.length : 0,
      taxaAprovacao: totalAprovRes.count ? ((aprovRes.count || 0) / totalAprovRes.count) * 100 : 0,
      tempoMedioProcesso: pecasComTempo.length ? tempoTotal / pecasComTempo.length : 0,
    });

    // Por dia
    const porDia: Record<string, number> = {};
    pecas.forEach((p) => { const d = format(new Date(p.created_at), "dd/MM"); porDia[d] = (porDia[d] || 0) + 1; });
    setPecasPorDia(Object.entries(porDia).map(([date, count]) => ({ date, count })));

    // Por status
    const porStatus: Record<string, number> = {};
    pecas.forEach((p) => { porStatus[p.status] = (porStatus[p.status] || 0) + 1; });
    setPecasPorStatus(Object.entries(porStatus).map(([name, value]) => ({ name: statusLabels[name] || name, value })));

    // Por tipo
    const porTipo: Record<string, number> = {};
    pecas.forEach((p) => { porTipo[p.tipo] = (porTipo[p.tipo] || 0) + 1; });
    setPecasPorTipo(Object.entries(porTipo).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value })));

    // Receita por dia
    const recDia: Record<string, number> = {};
    entregues.forEach((p) => {
      if (p.data_entrega) { const d = format(new Date(p.data_entrega), "dd/MM"); recDia[d] = (recDia[d] || 0) + (p.valor_servico || 0); }
    });
    setReceitaPorDia(Object.entries(recDia).map(([date, valor]) => ({ date, valor })));

    setLoading(false);
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const statCards = [
    { label: "Total de Peças", value: String(stats.totalPecas), sub: `${stats.pecasEntregues} entregues`, icon: Package, color: "bg-blue-50 text-blue-600" },
    { label: "Receita", value: `R$ ${stats.receitaTotal.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`, sub: `Ticket médio: R$ ${stats.ticketMedio.toFixed(0)}`, icon: DollarSign, color: "bg-green-50 text-green-600" },
    { label: "Taxa de Aprovação", value: `${stats.taxaAprovacao.toFixed(0)}%`, sub: "dos orçamentos", icon: Users, color: "bg-purple-50 text-purple-600" },
    { label: "Tempo Médio", value: `${stats.tempoMedioProcesso.toFixed(1)} dias`, sub: "do início à entrega", icon: Clock, color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="space-y-4 pb-8">
      <PageHeader
        title="Relatórios"
        actions={
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="60">Últimos 60 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="grid grid-cols-2 gap-3 px-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-3.5">
              <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="producao" className="px-4">
        <TabsList className="w-full">
          <TabsTrigger value="producao" className="flex-1">Produção</TabsTrigger>
          <TabsTrigger value="financeiro" className="flex-1">Financeiro</TabsTrigger>
          <TabsTrigger value="mix" className="flex-1">Mix</TabsTrigger>
        </TabsList>

        <TabsContent value="producao" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Peças por Dia</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pecasPorDia}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Distribuição por Status</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pecasPorStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                      {pecasPorStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financeiro" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Receita por Dia</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={receitaPorDia}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `R$${v}`} />
                    <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                    <Line type="monotone" dataKey="valor" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mix" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Tipos de Peça Mais Frequentes</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pecasPorTipo} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
