import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Settings, CreditCard, FileText, Loader2, Save, Plus, Pencil,
  Users, Package, HardDrive, DollarSign, Check, X,
} from "lucide-react";
import { toast } from "sonner";

interface Plano {
  id: string;
  nome: string;
  nome_exibicao: string;
  preco_mensal: number;
  preco_anual: number | null;
  limite_usuarios: number;
  limite_pecas_mes: number | null;
  limite_storage_mb: number;
  limite_clientes: number | null;
  funcionalidades: Record<string, boolean | string> | null;
  ativo: boolean;
  ordem: number | null;
}

interface SistemaConfig {
  nome_sistema: string;
  email_suporte: string;
  termos_uso_padrao: string;
  politica_privacidade_padrao: string;
}

const defaultConfig: SistemaConfig = {
  nome_sistema: "TexTrace",
  email_suporte: "",
  termos_uso_padrao: "",
  politica_privacidade_padrao: "",
};

const funcionalidadeLabels: Record<string, string> = {
  basico: "Funcionalidades básicas",
  relatorios: "Relatórios avançados",
  whatsapp_auto: "WhatsApp automático",
  api: "Acesso à API",
  white_label: "White Label",
};

export default function AdminConfig() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<SistemaConfig>(defaultConfig);
  const [savingConfig, setSavingConfig] = useState(false);

  // Plano modal
  const [modalOpen, setModalOpen] = useState(false);
  const [savingPlano, setSavingPlano] = useState(false);
  const [editPlano, setEditPlano] = useState<Plano | null>(null);
  const [planoForm, setPlanoForm] = useState({
    nome: "", nome_exibicao: "", preco_mensal: "", preco_anual: "",
    limite_usuarios: "1", limite_pecas_mes: "", limite_storage_mb: "100",
    limite_clientes: "", ordem: "0",
    f_basico: true, f_relatorios: false, f_whatsapp_auto: false, f_api: false, f_white_label: false,
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: planosData } = await supabase
      .from("planos").select("*").order("ordem", { ascending: true });
    setPlanos((planosData as Plano[]) || []);

    // Load system config from localStorage (could be a settings table later)
    const saved = localStorage.getItem("textrace_system_config");
    if (saved) setConfig(JSON.parse(saved));

    setLoading(false);
  };

  // ─── Config ───────────────────────────────────────
  const saveConfig = () => {
    setSavingConfig(true);
    localStorage.setItem("textrace_system_config", JSON.stringify(config));
    setTimeout(() => {
      setSavingConfig(false);
      toast.success("Configurações salvas!");
    }, 300);
  };

  // ─── Planos ───────────────────────────────────────
  const openAddPlano = () => {
    setEditPlano(null);
    setPlanoForm({
      nome: "", nome_exibicao: "", preco_mensal: "", preco_anual: "",
      limite_usuarios: "1", limite_pecas_mes: "", limite_storage_mb: "100",
      limite_clientes: "", ordem: "0",
      f_basico: true, f_relatorios: false, f_whatsapp_auto: false, f_api: false, f_white_label: false,
    });
    setModalOpen(true);
  };

  const openEditPlano = (p: Plano) => {
    setEditPlano(p);
    const funcs = (p.funcionalidades || {}) as Record<string, boolean>;
    setPlanoForm({
      nome: p.nome,
      nome_exibicao: p.nome_exibicao,
      preco_mensal: String(p.preco_mensal),
      preco_anual: p.preco_anual != null ? String(p.preco_anual) : "",
      limite_usuarios: String(p.limite_usuarios),
      limite_pecas_mes: p.limite_pecas_mes != null ? String(p.limite_pecas_mes) : "",
      limite_storage_mb: String(p.limite_storage_mb),
      limite_clientes: p.limite_clientes != null ? String(p.limite_clientes) : "",
      ordem: String(p.ordem ?? 0),
      f_basico: funcs.basico ?? true,
      f_relatorios: funcs.relatorios ?? false,
      f_whatsapp_auto: funcs.whatsapp_auto ?? false,
      f_api: funcs.api ?? false,
      f_white_label: funcs.white_label ?? false,
    });
    setModalOpen(true);
  };

  const savePlano = async () => {
    if (!planoForm.nome || !planoForm.nome_exibicao || !planoForm.preco_mensal) return;
    setSavingPlano(true);

    const payload = {
      nome: planoForm.nome,
      nome_exibicao: planoForm.nome_exibicao,
      preco_mensal: Number(planoForm.preco_mensal),
      preco_anual: planoForm.preco_anual ? Number(planoForm.preco_anual) : null,
      limite_usuarios: Number(planoForm.limite_usuarios),
      limite_pecas_mes: planoForm.limite_pecas_mes ? Number(planoForm.limite_pecas_mes) : null,
      limite_storage_mb: Number(planoForm.limite_storage_mb),
      limite_clientes: planoForm.limite_clientes ? Number(planoForm.limite_clientes) : null,
      ordem: Number(planoForm.ordem),
      funcionalidades: {
        basico: planoForm.f_basico,
        relatorios: planoForm.f_relatorios,
        whatsapp_auto: planoForm.f_whatsapp_auto,
        api: planoForm.f_api,
        white_label: planoForm.f_white_label,
      },
    };

    const { error } = editPlano
      ? await supabase.from("planos").update(payload).eq("id", editPlano.id)
      : await supabase.from("planos").insert(payload);

    setSavingPlano(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    setModalOpen(false);
    toast.success(editPlano ? "Plano atualizado!" : "Plano criado!");
    loadData();
  };

  const togglePlanoAtivo = async (p: Plano) => {
    const { error } = await supabase.from("planos").update({ ativo: !p.ativo }).eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    setPlanos(prev => prev.map(x => x.id === p.id ? { ...x, ativo: !x.ativo } : x));
    toast.success(p.ativo ? "Plano desativado" : "Plano ativado");
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Configurações" subtitle="Configurações globais do sistema" />

      <div className="px-4 pb-6">
        <Tabs defaultValue="planos" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="planos" className="gap-1.5">
              <CreditCard className="h-4 w-4" /> Planos
            </TabsTrigger>
            <TabsTrigger value="geral" className="gap-1.5">
              <Settings className="h-4 w-4" /> Geral
            </TabsTrigger>
            <TabsTrigger value="termos" className="gap-1.5">
              <FileText className="h-4 w-4" /> Termos
            </TabsTrigger>
          </TabsList>

          {/* ─── TAB: Planos ─── */}
          <TabsContent value="planos" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{planos.length} planos cadastrados</p>
              <Button size="sm" onClick={openAddPlano}>
                <Plus className="h-4 w-4 mr-1" /> Novo Plano
              </Button>
            </div>

            <div className="grid gap-3">
              {planos.map((p) => (
                <Card key={p.id} className={!p.ativo ? "opacity-60" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{p.nome_exibicao}</h3>
                          <Badge variant={p.ativo ? "default" : "secondary"} className="text-xs">
                            {p.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">({p.nome})</span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5" />
                            R$ {Number(p.preco_mensal).toFixed(0)}/mês
                            {p.preco_anual != null && (
                              <span className="text-xs">
                                (R$ {Number(p.preco_anual).toFixed(0)}/ano)
                              </span>
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {p.limite_usuarios} usuários
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="h-3.5 w-3.5" />
                            {p.limite_pecas_mes ?? "∞"} peças/mês
                          </span>
                          <span className="flex items-center gap-1">
                            <HardDrive className="h-3.5 w-3.5" />
                            {p.limite_storage_mb >= 1000
                              ? `${(p.limite_storage_mb / 1000).toFixed(0)}GB`
                              : `${p.limite_storage_mb}MB`}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {Object.entries(p.funcionalidades || {}).map(([key, val]) => (
                            val ? (
                              <Badge key={key} variant="outline" className="text-xs font-normal gap-1">
                                <Check className="h-3 w-3 text-primary" />
                                {funcionalidadeLabels[key] || key}
                              </Badge>
                            ) : null
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="sm" variant="ghost" onClick={() => openEditPlano(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => togglePlanoAtivo(p)}
                          className={p.ativo ? "text-destructive" : "text-primary"}
                        >
                          {p.ativo ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ─── TAB: Geral ─── */}
          <TabsContent value="geral" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dados do Sistema</CardTitle>
                <CardDescription>Informações gerais exibidas para todos os usuários</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome do Sistema</Label>
                  <Input
                    value={config.nome_sistema}
                    onChange={(e) => setConfig({ ...config, nome_sistema: e.target.value })}
                    placeholder="TexTrace"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email de Suporte</Label>
                  <Input
                    type="email"
                    value={config.email_suporte}
                    onChange={(e) => setConfig({ ...config, email_suporte: e.target.value })}
                    placeholder="suporte@textrace.com.br"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Integrações</CardTitle>
                <CardDescription>Serviços externos conectados ao sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Stripe</p>
                    <p className="text-xs text-muted-foreground">Pagamentos e assinaturas</p>
                  </div>
                  <Badge variant="secondary">Em breve</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">WhatsApp API</p>
                    <p className="text-xs text-muted-foreground">Envio automático de mensagens</p>
                  </div>
                  <Badge variant="secondary">Em breve</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Email (SMTP)</p>
                    <p className="text-xs text-muted-foreground">Envio de emails transacionais</p>
                  </div>
                  <Badge variant="secondary">Em breve</Badge>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={saveConfig} disabled={savingConfig}>
                {savingConfig ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Salvar Configurações
              </Button>
            </div>
          </TabsContent>

          {/* ─── TAB: Termos ─── */}
          <TabsContent value="termos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Termos de Uso Padrão</CardTitle>
                <CardDescription>
                  Texto padrão usado como base para novos tenants. Cada empresa pode personalizar depois.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={config.termos_uso_padrao}
                  onChange={(e) => setConfig({ ...config, termos_uso_padrao: e.target.value })}
                  placeholder="Insira os termos de uso padrão do sistema..."
                  rows={10}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Política de Privacidade Padrão</CardTitle>
                <CardDescription>
                  Texto exibido nos links de aprovação do cliente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={config.politica_privacidade_padrao}
                  onChange={(e) => setConfig({ ...config, politica_privacidade_padrao: e.target.value })}
                  placeholder="Insira a política de privacidade padrão..."
                  rows={10}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={saveConfig} disabled={savingConfig}>
                {savingConfig ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Salvar Termos
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ─── Modal de Plano ─── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editPlano ? "Editar Plano" : "Novo Plano"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Identificador (slug)</Label>
                <Input
                  value={planoForm.nome}
                  onChange={(e) => setPlanoForm({ ...planoForm, nome: e.target.value })}
                  placeholder="pro"
                  disabled={!!editPlano}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nome de Exibição</Label>
                <Input
                  value={planoForm.nome_exibicao}
                  onChange={(e) => setPlanoForm({ ...planoForm, nome_exibicao: e.target.value })}
                  placeholder="Profissional"
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Preço Mensal (R$)</Label>
                <Input
                  type="number"
                  value={planoForm.preco_mensal}
                  onChange={(e) => setPlanoForm({ ...planoForm, preco_mensal: e.target.value })}
                  placeholder="197"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Preço Anual (R$)</Label>
                <Input
                  type="number"
                  value={planoForm.preco_anual}
                  onChange={(e) => setPlanoForm({ ...planoForm, preco_anual: e.target.value })}
                  placeholder="1970"
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Limite Usuários</Label>
                <Input
                  type="number"
                  value={planoForm.limite_usuarios}
                  onChange={(e) => setPlanoForm({ ...planoForm, limite_usuarios: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Peças/mês (vazio = ∞)</Label>
                <Input
                  type="number"
                  value={planoForm.limite_pecas_mes}
                  onChange={(e) => setPlanoForm({ ...planoForm, limite_pecas_mes: e.target.value })}
                  placeholder="Ilimitado"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Storage (MB)</Label>
                <Input
                  type="number"
                  value={planoForm.limite_storage_mb}
                  onChange={(e) => setPlanoForm({ ...planoForm, limite_storage_mb: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Clientes (vazio = ∞)</Label>
                <Input
                  type="number"
                  value={planoForm.limite_clientes}
                  onChange={(e) => setPlanoForm({ ...planoForm, limite_clientes: e.target.value })}
                  placeholder="Ilimitado"
                />
              </div>
            </div>

            <Separator />
            <p className="text-xs font-medium text-muted-foreground">Funcionalidades</p>

            <div className="space-y-3">
              {[
                { key: "f_basico", label: "Funcionalidades básicas" },
                { key: "f_relatorios", label: "Relatórios avançados" },
                { key: "f_whatsapp_auto", label: "WhatsApp automático" },
                { key: "f_api", label: "Acesso à API" },
                { key: "f_white_label", label: "White Label" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="text-sm">{label}</Label>
                  <Switch
                    checked={(planoForm as any)[key]}
                    onCheckedChange={(v) => setPlanoForm({ ...planoForm, [key]: v })}
                  />
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-1.5">
              <Label className="text-xs">Ordem de exibição</Label>
              <Input
                type="number"
                value={planoForm.ordem}
                onChange={(e) => setPlanoForm({ ...planoForm, ordem: e.target.value })}
              />
            </div>

            <Button
              onClick={savePlano}
              className="w-full"
              disabled={!planoForm.nome || !planoForm.nome_exibicao || !planoForm.preco_mensal || savingPlano}
            >
              {savingPlano ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Plano"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
