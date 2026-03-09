import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import type { Cliente } from "@/types/database";

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

interface InlineClienteFormProps {
  onCreated: (cliente: Cliente) => void;
  onCancel: () => void;
  initialQuery?: string;
}

export function InlineClienteForm({ onCreated, onCancel, initialQuery = "" }: InlineClienteFormProps) {
  const { user } = useAuth();
  const [nome, setNome] = useState(initialQuery);
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const cpfDigits = cpf.replace(/\D/g, "");
    const telDigits = telefone.replace(/\D/g, "");

    if (!nome || cpfDigits.length < 11 || telDigits.length < 10) {
      toast.error("Preencha nome, CPF (11 dígitos) e telefone.");
      return;
    }

    setSaving(true);
    const { data, error } = await supabase.from("clientes").insert({
      tenant_id: user?.tenant_id,
      nome,
      cpf: cpfDigits,
      telefone: telDigits,
      email: email || null,
      endereco: endereco || null,
    }).select().single();

    if (error) {
      toast.error(error.code === "23505" ? "CPF já cadastrado." : "Erro ao cadastrar cliente.");
      setSaving(false);
      return;
    }

    toast.success("Cliente cadastrado!");
    onCreated(data as Cliente);
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onCancel} className="p-1.5 text-muted-foreground active:scale-95 transition-transform">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h3 className="text-base font-semibold text-foreground">Cadastrar novo cliente</h3>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Nome *</label>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" autoFocus />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">CPF *</label>
          <Input
            value={cpf}
            onChange={(e) => setCpf(maskCPF(e.target.value))}
            placeholder="000.000.000-00"
            inputMode="numeric"
            maxLength={14}
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
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">E-mail</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" inputMode="email" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Endereço</label>
          <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Endereço completo" />
        </div>
      </div>

      <Button onClick={handleSave} className="w-full h-12 text-base font-semibold" disabled={saving}>
        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Cadastrar e Continuar"}
      </Button>
    </div>
  );
}
