import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin_empresa or admin_global
    const { data: callerData } = await adminClient
      .from("users")
      .select("role, tenant_id")
      .eq("id", caller.id)
      .single();

    if (!callerData || !["admin_global", "admin_empresa"].includes(callerData.role)) {
      return new Response(JSON.stringify({ error: "Sem permissão" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { tenant_id, nome, email, senha, funcao, role } = body;

    // Validate tenant_id matches caller's tenant (unless admin_global)
    const effectiveTenantId = callerData.role === "admin_global" ? tenant_id : callerData.tenant_id;

    if (!effectiveTenantId || !nome || !email || !senha) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios: nome, email, senha" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (senha.length < 6) {
      return new Response(JSON.stringify({ error: "Senha deve ter no mínimo 6 caracteres" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check user limit
    const { data: tenant } = await adminClient
      .from("tenants")
      .select("limite_usuarios")
      .eq("id", effectiveTenantId)
      .single();

    const { count } = await adminClient
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", effectiveTenantId)
      .eq("ativo", true);

    if (tenant && count !== null && count >= tenant.limite_usuarios) {
      return new Response(JSON.stringify({ error: `Limite de ${tenant.limite_usuarios} usuários atingido. Faça upgrade do plano.` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate role
    const validRole = role === "admin_empresa" ? "admin_empresa" : "usuario";

    // Create auth user
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome, role: validRole },
    });

    if (authError) {
      return new Response(JSON.stringify({ error: "Erro ao criar usuário: " + authError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update user record with tenant and funcao
    await adminClient
      .from("users")
      .update({ tenant_id: effectiveTenantId, role: validRole, funcao: funcao || null })
      .eq("id", authUser.user.id);

    return new Response(JSON.stringify({ user_id: authUser.user.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
