import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const body = await req.json();
    console.log("Webhook Autentique recebido:", JSON.stringify(body));

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { document, event } = body;

    if (!document?.id) {
      return new Response(JSON.stringify({ error: "Document ID não encontrado" }), { status: 400 });
    }

    const { data: docLocal, error: findError } = await supabaseClient
      .from("documentos_assinatura")
      .select("*")
      .eq("autentique_id", document.id)
      .single();

    if (findError || !docLocal) {
      console.error("Documento não encontrado:", document.id);
      return new Response(JSON.stringify({ error: "Documento não encontrado" }), { status: 404 });
    }

    // Get peca info for tenant_id
    const { data: pecaData } = await supabaseClient
      .from("pecas")
      .select("id, tenant_id")
      .eq("id", docLocal.peca_id)
      .single();

    let novoStatus = docLocal.status;
    let linkAssinado = docLocal.link_documento_assinado;

    if (event === "document.finished") {
      novoStatus = "signed";

      // Fetch signed document link from Autentique
      const AUTENTIQUE_TOKEN = Deno.env.get("AUTENTIQUE_TOKEN");
      if (AUTENTIQUE_TOKEN) {
        try {
          const autentiqueResponse = await fetch("https://api.autentique.com.br/v2/graphql", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${AUTENTIQUE_TOKEN}`,
            },
            body: JSON.stringify({
              query: `query($id: UUID!) { document(id: $id) { files { signed } } }`,
              variables: { id: document.id },
            }),
          });
          const autentiqueData = await autentiqueResponse.json();
          linkAssinado = autentiqueData?.data?.document?.files?.signed || null;
        } catch (e) {
          console.error("Erro ao buscar doc assinado:", e);
        }
      }
    } else {
      // Ignorar outros eventos (created, updated, deleted)
      console.log("Evento ignorado:", event);
      return new Response(JSON.stringify({ success: true, ignored: true }), { status: 200 });
    }

    await supabaseClient
      .from("documentos_assinatura")
      .update({
        status: novoStatus,
        link_documento_assinado: linkAssinado,
        assinado_em: novoStatus === "signed" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", docLocal.id);

    if (novoStatus === "signed" && pecaData) {
      await supabaseClient
        .from("pecas")
        .update({ status: "em_processo", etapa_atual: 7 })
        .eq("id", pecaData.id);

      await supabaseClient.from("notificacoes").insert({
        tenant_id: pecaData.tenant_id,
        tipo: "assinatura",
        titulo: "Documento assinado digitalmente",
        mensagem: `O cliente assinou o termo da peça ${document.name || docLocal.nome_documento}`,
        peca_id: pecaData.id,
        link: `/pecas/${pecaData.id}`,
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Erro no webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
