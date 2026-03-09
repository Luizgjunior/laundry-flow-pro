import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const { tenant_id, peca, diagnosticos, maquinas, produtos, etiqueta_texto } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Buscar histórico similar para aprendizado
    const { data: historicoSimilar } = await supabaseClient
      .from("ia_historico")
      .select("*")
      .eq("tenant_id", tenant_id)
      .eq("tipo_peca", peca.tipo)
      .eq("aceito", true)
      .order("created_at", { ascending: false })
      .limit(10);

    const prompt = `Você é um especialista em lavanderia têxtil profissional. Analise a peça e sugira o melhor processo de tratamento.

PEÇA:
- Tipo: ${peca.tipo}
- Cor: ${peca.cor}
- Marca: ${peca.marca || "Não informada"}
- Composição: ${JSON.stringify(peca.composicao) || "Não informada"}
${etiqueta_texto ? `- Instruções da Etiqueta: ${etiqueta_texto}` : ""}

DIAGNÓSTICO (manchas/avarias encontradas):
${diagnosticos.map((d: any) => `- ${d.tipo}: ${d.localizacao || "localização não especificada"} - ${d.observacao || ""}`).join("\n")}

MÁQUINAS DISPONÍVEIS:
${maquinas.map((m: any) => `- ${m.nome} (${m.tipo}): capacidade ${m.capacidade_kg}kg`).join("\n")}

PRODUTOS DISPONÍVEIS:
${produtos.map((p: any) => `- ${p.nome} (${p.fabricante}): ${p.tipo} - indicado para: ${p.indicacoes?.join(", ") || "uso geral"}`).join("\n")}

${historicoSimilar && historicoSimilar.length > 0 ? `
HISTÓRICO DE TRATAMENTOS SIMILARES BEM-SUCEDIDOS:
${historicoSimilar.map((h: any) => `- ${JSON.stringify(h.sugestao_aceita)}`).join("\n")}
` : ""}

Com base nessas informações, sugira um plano de tratamento detalhado no formato JSON:
{
  "risco": "baixo|medio|alto",
  "justificativa_risco": "explicação do nível de risco",
  "etapas": [
    {
      "ordem": 1,
      "tipo": "pre_tratamento|lavadoria|enxague|secagem|controle_qualidade",
      "descricao": "descrição da etapa",
      "maquina_sugerida": "nome da máquina",
      "produtos": [
        { "nome": "nome do produto", "quantidade": "quantidade sugerida", "modo_uso": "como usar" }
      ],
      "temperatura": 30,
      "rotacao": 800,
      "velocidade": "normal|lenta|rapida",
      "duracao_minutos": 30,
      "observacoes": "cuidados especiais"
    }
  ],
  "cuidados_especiais": ["lista de cuidados"],
  "tempo_total_estimado": 120,
  "valor_sugerido": 150.00
}

Responda APENAS com o JSON, sem explicações adicionais.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
      }),
    });

    const aiResponse = await response.json();
    const sugestaoTexto = aiResponse.choices?.[0]?.message?.content || "{}";

    let sugestao;
    try {
      const jsonMatch = sugestaoTexto.match(/\{[\s\S]*\}/);
      sugestao = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      sugestao = { erro: "Não foi possível processar sugestão", texto: sugestaoTexto };
    }

    // Salvar no histórico
    await supabaseClient.from("ia_historico").insert({
      tenant_id,
      tipo_peca: peca.tipo,
      composicao: peca.composicao,
      manchas: diagnosticos,
      sugestao_ia: sugestao,
    });

    return new Response(
      JSON.stringify({ success: true, sugestao }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro IA:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
