import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

// Mask helpers
function maskCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export default function NovoCliente() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plano } = useSubscription();
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [saving, setSaving] = useState(false);
  const [clientesCount, setClientesCount] = useState(0);

  useEffect(() => {
    supabase.from("clientes").select("*", { count: "exact", head: true }).then(({ count }) => {
      setClientesCount(count || 0);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cpfDigits = cpf.replace(/\D/g, "");
    const telDigits = telefone.replace(/\D/g, "");

    if (!nome || cpfDigits.length < 11 || telDigits.length < 10) {
      toast.error("Preencha nome, CPF (11 dígitos) e telefone corretamente.");
      return;
    }
    if (plano?.limite_clientes && clientesCount >= plano.limite_clientes) {
      toast.error(`Limite de ${plano.limite_clientes} clientes atingido. Faça upgrade.`, {
        action: { label: "Upgrade", onClick: () => navigate("/upgrade") },
      });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("clientes").insert({
      tenant_id: user?.tenant_id,
      nome,
      cpf: cpfDigits,
      telefone: telDigits,
      email: email || null,
      endereco: endereco || null,
    });
    if (error) {
      toast.error(error.code === "23505" ? "CPF já cadastrado." : "Erro ao cadastrar cliente.");
    } else {
      toast.success("Cliente cadastrado!");
      navigate(-1);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Novo Cliente"
        actions={
          <button onClick={() => navigate(-1)} className="p-2 text-muted-foreground active:scale-95 transition-transform">
            <ArrowLeft className="h-5 w-5" />
          </button>
        }
      />
      <form onSubmit={handleSave} className="px-4 space-y-4 pb-28">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Nome *</label>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" required autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">CPF *</label>
          <Input
            value={cpf}
            onChange={(e) => setCpf(maskCPF(e.target.value))}
            placeholder="000.000.000-00"
            inputMode="numeric"
            maxLength={14}
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Telefone *</label>
          <Input
            value={telefone}
            onChange={(e) => setTelefone(maskPhone(e.target.value))}
            placeholder="(00) 00000-0000"
            inputMode="tel"
            maxLength={15}
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">E-mail</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" inputMode="email" autoComplete="email" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Endereço</label>
          <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Endereço completo" />
        </div>

        <div className="fixed bottom-20 left-0 right-0 px-4 pb-2 bg-background/95 backdrop-blur">
          <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={saving}>
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Cadastrar Cliente"}
          </Button>
        </div>
      </form>
    </div>
  );
}
