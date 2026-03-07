import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is admin_global
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

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

    // Check admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: callerData } = await adminClient
      .from("users")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (!callerData || callerData.role !== "admin_global") {
      return new Response(JSON.stringify({ error: "Apenas admin global pode criar empresas" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      nome_fantasia, cnpj, plano, limite_usuarios, limite_storage_mb,
      telefone, email, senha, nome_responsavel,
    } = body;

    if (!nome_fantasia || !cnpj || !email || !senha) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios: nome_fantasia, cnpj, email, senha" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Create tenant
    const { data: tenant, error: tenantError } = await adminClient
      .from("tenants")
      .insert({
        nome_fantasia,
        cnpj,
        plano: plano || "free",
        limite_usuarios: limite_usuarios || 3,
        limite_storage_mb: limite_storage_mb || 500,
        telefone: telefone || null,
        email: email || null,
      })
      .select()
      .single();

    if (tenantError) {
      return new Response(JSON.stringify({ error: "Erro ao criar empresa: " + tenantError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Create auth user with admin_empresa role
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: {
        nome: nome_responsavel || nome_fantasia,
        role: "admin_empresa",
      },
    });

    if (authError) {
      // Rollback tenant
      await adminClient.from("tenants").delete().eq("id", tenant.id);
      return new Response(JSON.stringify({ error: "Erro ao criar usuário: " + authError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Update user record with tenant_id (created by trigger)
    await adminClient
      .from("users")
      .update({ tenant_id: tenant.id, role: "admin_empresa" })
      .eq("id", authUser.user.id);

    return new Response(JSON.stringify({ tenant, user_id: authUser.user.id }), {
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
