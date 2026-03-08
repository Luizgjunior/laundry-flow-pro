import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { peca_id } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: peca, error: pecaError } = await supabaseClient
      .from("pecas")
      .select("*, clientes(*), diagnosticos(*, tipos_manchas:tipo_mancha_id(*)), planos_tecnicos(*)")
      .eq("id", peca_id)
      .single();

    if (pecaError || !peca) {
      throw new Error("Peça não encontrada");
    }

    const { data: tenant } = await supabaseClient
      .from("tenants")
      .select("*")
      .eq("id", peca.tenant_id)
      .single();

    const html = gerarHTMLTermo(peca, peca.clientes, tenant, peca.diagnosticos || [], peca.planos_tecnicos || []);

    const htmlBase64 = btoa(unescape(encodeURIComponent(html)));

    return new Response(
      JSON.stringify({
        success: true,
        type: "html",
        data: htmlBase64,
        filename: `termo_${peca.codigo_interno}.html`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function gerarHTMLTermo(peca: any, cliente: any, tenant: any, diagnosticos: any[], planos: any[]): string {
  const diagRows = diagnosticos.map(d => `
    <tr>
      <td style="border:1px solid #ddd;padding:8px">${d.tipos_manchas?.nome || 'Mancha'}</td>
      <td style="border:1px solid #ddd;padding:8px">${d.localizacao || '-'}</td>
      <td style="border:1px solid #ddd;padding:8px">${d.observacao || '-'}</td>
    </tr>
  `).join('');

  const planoRows = planos.map((p: any, i: number) => `
    <tr>
      <td style="border:1px solid #ddd;padding:8px">${i + 1}</td>
      <td style="border:1px solid #ddd;padding:8px">${(p.tipo || '').replace('_', ' ').toUpperCase()}</td>
      <td style="border:1px solid #ddd;padding:8px">${p.observacoes || '-'}</td>
    </tr>
  `).join('');

  const riscoLabel = peca.risco_calculado === 'alto' ? 'ALTO ⚠️' :
    peca.risco_calculado === 'medio' ? 'MÉDIO' : 'BAIXO ✓';

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #333; font-size: 14px; line-height: 1.6; }
  h1 { text-align: center; color: #1a1a1a; border-bottom: 2px solid #333; padding-bottom: 10px; }
  h2 { color: #444; margin-top: 24px; font-size: 16px; }
  .header-info { text-align: center; color: #666; margin-bottom: 30px; }
  .section { margin-bottom: 20px; padding: 12px; background: #f9f9f9; border-radius: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  th { background: #f0f0f0; border: 1px solid #ddd; padding: 8px; text-align: left; }
  .terms { background: #fff8e1; padding: 16px; border-radius: 4px; border-left: 4px solid #ff9800; margin-top: 20px; }
  .signature-area { margin-top: 40px; text-align: center; }
  .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
</style></head><body>
  <h1>TERMO DE APROVAÇÃO DE TRATAMENTO TÊXTIL</h1>
  <div class="header-info">
    <p><strong>${tenant?.nome_fantasia || 'TexTrace'}</strong></p>
    <p>Protocolo: ${peca.codigo_interno} | Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
  </div>

  <h2>1. DADOS DO CLIENTE</h2>
  <div class="section">
    <p><strong>Nome:</strong> ${cliente.nome}</p>
    <p><strong>CPF:</strong> ${cliente.cpf}</p>
    <p><strong>Telefone:</strong> ${cliente.telefone}</p>
    ${cliente.email ? `<p><strong>Email:</strong> ${cliente.email}</p>` : ''}
  </div>

  <h2>2. DADOS DA PEÇA</h2>
  <div class="section">
    <p><strong>Tipo:</strong> ${peca.tipo} | <strong>Cor:</strong> ${peca.cor}${peca.marca ? ` | <strong>Marca:</strong> ${peca.marca}` : ''}</p>
    <p><strong>Classificação de Risco:</strong> ${riscoLabel}</p>
  </div>

  <h2>3. DIAGNÓSTICO TÉCNICO</h2>
  ${diagnosticos.length > 0 ? `
  <table><thead><tr><th>Tipo</th><th>Localização</th><th>Observação</th></tr></thead>
  <tbody>${diagRows}</tbody></table>
  ` : '<p>Nenhum diagnóstico registrado.</p>'}

  <h2>4. PLANO DE TRATAMENTO</h2>
  ${planos.length > 0 ? `
  <table><thead><tr><th>#</th><th>Procedimento</th><th>Detalhes</th></tr></thead>
  <tbody>${planoRows}</tbody></table>
  ` : '<p>Plano técnico a ser definido.</p>'}

  <h2>5. VALORES</h2>
  <div class="section">
    <p><strong>Valor do Serviço:</strong> R$ ${(peca.valor_servico || 0).toFixed(2).replace('.', ',')}</p>
    <p><strong>Previsão de Entrega:</strong> ${peca.previsao_entrega ? new Date(peca.previsao_entrega).toLocaleDateString('pt-BR') : 'A confirmar'}</p>
  </div>

  <div class="terms">
    <h2>6. TERMOS E CONDIÇÕES</h2>
    <p><strong>6.1.</strong> O tratamento de tecidos envolve processos químicos e mecânicos que podem causar alterações na cor, textura ou integridade da peça.</p>
    <p><strong>6.2.</strong> Para peças de risco MÉDIO ou ALTO, o estabelecimento não se responsabiliza por eventuais danos decorrentes do processo.</p>
    <p><strong>6.3.</strong> Para peças de risco BAIXO, em caso de danos comprovados, o cliente será indenizado conforme política vigente.</p>
    <p><strong>6.4.</strong> A peça deve ser retirada em até 30 dias após conclusão. Após, cobram-se taxas de armazenamento.</p>
    <p><strong>6.5.</strong> Ao assinar, o CLIENTE autoriza expressamente a realização do tratamento descrito.</p>
  </div>

  <div class="signature-area">
    <br><br>
    <p>_________________________________________</p>
    <p><strong>${cliente.nome}</strong></p>
    <p>CPF: ${cliente.cpf}</p>
  </div>

  <div class="footer">
    <p>Documento gerado pelo sistema TexTrace em ${new Date().toISOString()}</p>
    <p>Validade jurídica quando assinado digitalmente conforme MP 2.200-2/2001</p>
  </div>
</body></html>`;
}
