import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Building2, Clock, Users, Package, Wrench, Crown, ChevronRight, Loader2, Save,
} from "lucide-react";

interface TenantData {
  id: string;
  nome_fantasia: string;
  cnpj: string;
  telefone: string | null;
  email: string | null;
  plano: string;
  limite_usuarios: number;
  limite_storage_mb: number;
  endereco: Record<string, string> | null;
  horario_funcionamento: Record<string, { aberto: boolean; inicio: string; fim: string }> | null;
  termos_customizados: string | null;
  logo_url: string | null;
}

const DIAS_SEMANA = [
  { key: "seg", label: "Segunda" },
  { key: "ter", label: "Terça" },
  { key: "qua", label: "Quarta" },
  { key: "qui", label: "Quinta" },
  { key: "sex", label: "Sexta" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
];

const DEFAULT_HORARIO = { aberto: true, inicio: "08:00", fim: "18:00" };

export default function ConfigTenant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [rua, setRua] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [cep, setCep] = useState("");
  const [horarios, setHorarios] = useState<Record<string, { aberto: boolean; inicio: string; fim: string }>>({});
  const [termos, setTermos] = useState("");

  // Stats
  const [userCount, setUserCount] = useState(0);
  const [pecaCount, setPecaCount] = useState(0);
  const [clienteCount, setClienteCount] = useState(0);

  useEffect(() => {
    if (!user?.tenant_id) return;
    fetchTenant();
    fetchStats();
  }, [user?.tenant_id]);

  const fetchTenant = async () => {
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", user!.tenant_id!)
      .single();
    if (error || !data) {
      setLoading(false);
      return;
    }
    const t = data as unknown as TenantData;
    setTenant(t);
    setNomeFantasia(t.nome_fantasia);
    setCnpj(t.cnpj);
    setTelefone(t.telefone || "");
    setEmail(t.email || "");
    const end = t.endereco || {};
    setRua(end.rua || "");
    setCidade(end.cidade || "");
    setEstado(end.estado || "");
    setCep(end.cep || "");
    setTermos(t.termos_customizados || "");

    // Horários
    const h: Record<string, { aberto: boolean; inicio: string; fim: string }> = {};
    DIAS_SEMANA.forEach(({ key }) => {
      h[key] = t.horario_funcionamento?.[key] || { ...DEFAULT_HORARIO, aberto: key !== "dom" };
    });
    setHorarios(h);
    setLoading(false);
  };

  const fetchStats = async () => {
    const tid = user!.tenant_id!;
    const [u, p, c] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }).eq("tenant_id", tid).eq("ativo", true),
      supabase.from("pecas").select("id", { count: "exact", head: true }).eq("tenant_id", tid),
      supabase.from("clientes").select("id", { count: "exact", head: true }).eq("tenant_id", tid),
    ]);
    setUserCount(u.count || 0);
    setPecaCount(p.count || 0);
    setClienteCount(c.count || 0);
  };

  const handleSaveEmpresa = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("tenants")
      .update({
        nome_fantasia: nomeFantasia,
        cnpj,
        telefone: telefone || null,
        email: email || null,
        endereco: { rua, cidade, estado, cep },
      })
      .eq("id", tenant!.id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar dados da empresa");
    } else {
      toast.success("Dados da empresa atualizados!");
    }
  };

  const handleSaveHorarios = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("tenants")
      .update({ horario_funcionamento: horarios })
      .eq("id", tenant!.id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar horários");
    } else {
      toast.success("Horários atualizados!");
    }
  };

  const handleSaveTermos = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("tenants")
      .update({ termos_customizados: termos || null })
      .eq("id", tenant!.id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar termos");
    } else {
      toast.success("Termos atualizados!");
    }
  };

  const updateHorario = (dia: string, field: string, value: string | boolean) => {
    setHorarios((prev) => ({
      ...prev,
      [dia]: { ...prev[dia], [field]: value },
    }));
  };

  const planoLabel: Record<string, string> = {
    free: "Gratuito",
    starter: "Starter",
    pro: "Profissional",
    enterprise: "Enterprise",
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Empresa não encontrada.
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <PageHeader title="Configurações" subtitle={tenant.nome_fantasia} />

      {/* Quick Links */}
      <div className="px-4 grid grid-cols-2 gap-3">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate("/config/equipe")}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Equipe</p>
              <p className="text-xs text-muted-foreground">{userCount} membros</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate("/config/maquinas")}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wrench className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Máquinas</p>
              <p className="text-xs text-muted-foreground">Gerenciar</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate("/config/produtos")}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Produtos</p>
              <p className="text-xs text-muted-foreground">Químicos</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate("/upgrade")}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Plano</p>
              <Badge variant="outline" className="text-[10px]">{planoLabel[tenant.plano] || tenant.plano}</Badge>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <Tabs defaultValue="empresa">
          <TabsList className="w-full">
            <TabsTrigger value="empresa" className="flex-1">Empresa</TabsTrigger>
            <TabsTrigger value="horarios" className="flex-1">Horários</TabsTrigger>
            <TabsTrigger value="termos" className="flex-1">Termos</TabsTrigger>
          </TabsList>

          {/* Empresa Tab */}
          <TabsContent value="empresa">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Dados da Empresa
                </CardTitle>
                <CardDescription>Informações cadastrais da sua lavanderia</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome Fantasia</Label>
                    <Input value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} />
                  </div>
                  <div>
                    <Label>CNPJ</Label>
                    <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-9999" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>

                <Separator />
                <p className="text-sm font-medium text-muted-foreground">Endereço</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label>Rua / Logradouro</Label>
                    <Input value={rua} onChange={(e) => setRua(e.target.value)} />
                  </div>
                  <div>
                    <Label>Cidade</Label>
                    <Input value={cidade} onChange={(e) => setCidade(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Estado</Label>
                      <Input value={estado} onChange={(e) => setEstado(e.target.value)} maxLength={2} placeholder="SP" />
                    </div>
                    <div>
                      <Label>CEP</Label>
                      <Input value={cep} onChange={(e) => setCep(e.target.value)} placeholder="00000-000" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleSaveEmpresa} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Usage Summary */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Uso do Plano</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{userCount}</p>
                    <p className="text-xs text-muted-foreground">de {tenant.limite_usuarios} usuários</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{pecaCount}</p>
                    <p className="text-xs text-muted-foreground">peças totais</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{clienteCount}</p>
                    <p className="text-xs text-muted-foreground">clientes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Horários Tab */}
          <TabsContent value="horarios">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Horário de Funcionamento
                </CardTitle>
                <CardDescription>Defina os dias e horários de atendimento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {DIAS_SEMANA.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <div className="w-24">
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    <Switch
                      checked={horarios[key]?.aberto ?? true}
                      onCheckedChange={(v) => updateHorario(key, "aberto", v)}
                    />
                    {horarios[key]?.aberto ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={horarios[key]?.inicio || "08:00"}
                          onChange={(e) => updateHorario(key, "inicio", e.target.value)}
                          className="w-28 h-8 text-sm"
                        />
                        <span className="text-muted-foreground text-sm">às</span>
                        <Input
                          type="time"
                          value={horarios[key]?.fim || "18:00"}
                          onChange={(e) => updateHorario(key, "fim", e.target.value)}
                          className="w-28 h-8 text-sm"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Fechado</span>
                    )}
                  </div>
                ))}
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSaveHorarios} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar Horários
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Termos Tab */}
          <TabsContent value="termos">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Termos e Condições</CardTitle>
                <CardDescription>Termos que aparecem para o cliente ao aprovar serviços</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={termos}
                  onChange={(e) => setTermos(e.target.value)}
                  placeholder="Insira aqui os termos e condições da sua lavanderia..."
                  className="min-h-[200px]"
                />
                <div className="flex justify-end">
                  <Button onClick={handleSaveTermos} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar Termos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
