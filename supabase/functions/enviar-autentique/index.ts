import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const AUTENTIQUE_URL = "https://api.autentique.com.br/v2/graphql";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AUTENTIQUE_TOKEN = Deno.env.get("AUTENTIQUE_TOKEN");
    if (!AUTENTIQUE_TOKEN) {
      throw new Error("Token da Autentique não configurado");
    }

    const { peca_id, aprovacao_id, pdf_base64, cliente_email, cliente_nome, cliente_telefone, usar_whatsapp } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: peca } = await supabaseClient
      .from("pecas")
      .select("codigo_interno")
      .eq("id", peca_id)
      .single();

    // Decode base64 to bytes
    const pdfBytes = Uint8Array.from(atob(pdf_base64), c => c.charCodeAt(0));
    const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });

    const formData = new FormData();

    const operations = JSON.stringify({
      query: `
        mutation CreateDocumentMutation(
          $document: DocumentInput!,
          $signers: [SignerInput!]!,
          $file: Upload!
        ) {
          createDocument(
            sandbox: false,
            document: $document,
            signers: $signers,
            file: $file
          ) {
            id
            name
            created_at
            signatures {
              public_id
              name
              email
              action { name }
              link { short_link }
            }
          }
        }
      `,
      variables: {
        document: {
          name: `Termo de Aprovação - ${peca?.codigo_interno || peca_id}`,
        },
        signers: [
          {
            email: cliente_email,
            name: cliente_nome,
            action: "SIGN",
            delivery_method: usar_whatsapp ? "DELIVERY_METHOD_WHATSAPP" : "DELIVERY_METHOD_EMAIL",
            ...(usar_whatsapp && cliente_telefone ? { phone: cliente_telefone.replace(/\D/g, '') } : {}),
          },
        ],
        file: null,
      },
    });

    formData.append("operations", operations);
    formData.append("map", JSON.stringify({ file: ["variables.file"] }));
    formData.append("file", pdfBlob, `termo_${peca?.codigo_interno || peca_id}.pdf`);

    const response = await fetch(AUTENTIQUE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${AUTENTIQUE_TOKEN}` },
      body: formData,
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0]?.message || "Erro na API Autentique");
    }

    const documento = result.data.createDocument;
    const assinatura = documento.signatures[0];

    const { data: docSalvo, error: saveError } = await supabaseClient
      .from("documentos_assinatura")
      .insert({
        peca_id,
        aprovacao_id: aprovacao_id || null,
        autentique_id: documento.id,
        nome_documento: documento.name,
        status: "pending",
        link_assinatura: assinatura?.link?.short_link,
        signatarios: documento.signatures,
        metadata: {
          created_at: documento.created_at,
          delivery_method: usar_whatsapp ? "whatsapp" : "email",
        },
      })
      .select()
      .single();

    if (saveError) {
      console.error("Erro ao salvar documento:", saveError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        autentique_id: documento.id,
        link_assinatura: assinatura?.link?.short_link,
        documento_id: docSalvo?.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
