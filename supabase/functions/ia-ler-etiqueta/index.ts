import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const { imagem_base64 } = await req.json();

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imagem_base64}`,
              },
            },
            {
              type: "text",
              text: `Analise esta imagem de etiqueta de roupa e extraia as informações no formato JSON:
{
  "composicao": "composição do tecido",
  "instrucoes_lavagem": {
    "temperatura_maxima": 30,
    "pode_alvejar": false,
    "pode_secar_maquina": true,
    "pode_passar": true,
    "temperatura_ferro": "baixa|media|alta",
    "lavagem_especial": "seco|mao|maquina"
  },
  "simbolos_identificados": ["lista de símbolos identificados"],
  "marca": "marca se visível",
  "pais_origem": "país se visível",
  "observacoes": "outras informações relevantes"
}

Responda APENAS com o JSON.`,
            },
          ],
        }],
        max_tokens: 1000,
      }),
    });

    const aiResponse = await response.json();
    const texto = aiResponse.choices?.[0]?.message?.content || "{}";

    let resultado;
    try {
      const jsonMatch = texto.match(/\{[\s\S]*\}/);
      resultado = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      resultado = { erro: "Não foi possível ler a etiqueta", texto };
    }

    return new Response(
      JSON.stringify({ success: true, etiqueta: resultado }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
