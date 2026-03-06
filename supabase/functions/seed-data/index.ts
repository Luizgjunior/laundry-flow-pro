import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // 1. Create admin_global
    const { data: adminAuth, error: adminErr } = await supabase.auth.admin.createUser({
      email: "alpha2022gt@gmail.com",
      password: "88499351Ju#",
      email_confirm: true,
      user_metadata: { nome: "Admin Global", role: "admin_global" },
    });
    if (adminErr && !adminErr.message.includes("already")) throw adminErr;

    const adminId = adminAuth?.user?.id;
    if (adminId) {
      await supabase.from("users").upsert({
        id: adminId,
        email: "alpha2022gt@gmail.com",
        nome: "Admin Global",
        role: "admin_global",
        tenant_id: null,
        ativo: true,
      });
    }

    // 2. Create tenant
    const { data: tenant } = await supabase.from("tenants").upsert(
      { nome_fantasia: "Lavanderia Modelo", cnpj: "12345678000199", plano: "pro", ativo: true },
      { onConflict: "cnpj" }
    ).select().single();
    const tenantId = tenant?.id;

    // 3. Create admin_empresa
    const { data: gerenteAuth } = await supabase.auth.admin.createUser({
      email: "gerente@lavanderiamodelo.com",
      password: "Gerente123#",
      email_confirm: true,
      user_metadata: { nome: "João Gerente", role: "admin_empresa" },
    });
    if (gerenteAuth?.user?.id) {
      await supabase.from("users").upsert({
        id: gerenteAuth.user.id,
        email: "gerente@lavanderiamodelo.com",
        nome: "João Gerente",
        role: "admin_empresa",
        funcao: "gerente",
        tenant_id: tenantId,
        ativo: true,
      });
    }

    // 4. Create 2 operational users
    const ops = [
      { email: "maria@lavanderiamodelo.com", nome: "Maria Silva", funcao: "atendente" },
      { email: "carlos@lavanderiamodelo.com", nome: "Carlos Santos", funcao: "tecnico" },
    ];
    for (const op of ops) {
      const { data: opAuth } = await supabase.auth.admin.createUser({
        email: op.email,
        password: "Usuario123#",
        email_confirm: true,
        user_metadata: { nome: op.nome, role: "usuario" },
      });
      if (opAuth?.user?.id) {
        await supabase.from("users").upsert({
          id: opAuth.user.id,
          email: op.email,
          nome: op.nome,
          role: "usuario",
          funcao: op.funcao,
          tenant_id: tenantId,
          ativo: true,
        });
      }
    }

    // 5. Create 5 clients
    const clientes = [
      { nome: "Ana Paula Ribeiro", cpf: "12345678901", telefone: "11987654321", email: "ana.ribeiro@email.com" },
      { nome: "Roberto Carlos Mendes", cpf: "23456789012", telefone: "11976543210", email: "roberto.mendes@email.com" },
      { nome: "Fernanda Costa Lima", cpf: "34567890123", telefone: "11965432109", email: null },
      { nome: "Marcos Antônio Pereira", cpf: "45678901234", telefone: "11954321098", email: "marcos.pereira@email.com" },
      { nome: "Juliana Souza Santos", cpf: "56789012345", telefone: "11943210987", email: null },
    ];
    const { data: clientesData } = await supabase.from("clientes").upsert(
      clientes.map((c) => ({ ...c, tenant_id: tenantId })),
      { onConflict: "cpf" }
    ).select();

    // 6. Create 10 pieces
    const statuses = ["entrada", "diagnostico", "aguardando_aprovacao", "aprovado", "em_processo", "inspecao", "pronto", "entregue", "recusado", "incidente"] as const;
    const tipos = ["camisa", "calca", "vestido", "terno", "jaqueta", "blazer", "saia", "casaco", "edredom", "cortina"];
    const cores = ["branco", "preto", "azul", "vermelho", "verde", "rosa", "cinza", "bege", "marrom", "roxo"];

    if (clientesData && clientesData.length > 0) {
      const pecas = statuses.map((status, i) => ({
        tenant_id: tenantId,
        cliente_id: clientesData[i % clientesData.length].id,
        codigo_interno: `TT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(i + 1).padStart(4, "0")}`,
        tipo: tipos[i],
        cor: cores[i],
        marca: ["Zara", "Hugo Boss", "Dudalina", null, "Farm", "Animale", null, "Tommy", "Lacoste", "Renner"][i],
        composicao: i % 2 === 0 ? { algodao: 60, poliester: 40 } : { seda: 100 },
        status,
        etapa_atual: Math.min(i + 1, 9),
        observacoes: i === 9 ? "Mancha não identificada" : null,
      }));
      await supabase.from("pecas").insert(pecas);
    }

    return new Response(JSON.stringify({ success: true, tenantId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
