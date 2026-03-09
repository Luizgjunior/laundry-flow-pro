

## Problema

Na tela de detalhe da peça (`PecaDetail.tsx`), quando o status é `aguardando_aprovacao`, não aparece nenhum botão de ação — nem nos atalhos rápidos nem na barra inferior. O botão "Enviar para Aprovação" só existe na tela do Plano Técnico (`/pecas/:id/plano`), que é difícil de encontrar.

## Plano

### Arquivo: `src/pages/PecaDetail.tsx`

1. **Adicionar botão de ação rápida** no grid de quick actions (linha ~128) para o status `aguardando_aprovacao`:
   - Botão "Ver Plano" → navega para `/pecas/:id/plano`
   - Botão "Reenviar WhatsApp" → busca o token da aprovação pendente e abre WhatsApp com a mensagem formatada

2. **Adicionar botão inferior** (barra fixa no rodapé) para `aguardando_aprovacao`:
   - "Reenviar Aprovação via WhatsApp" com ícone Send
   - Busca o token existente na tabela `aprovacoes` (status pendente) e monta o link `wa.me`

3. **Lógica de reenvio**: Função `reenviarWhatsApp` que:
   - Consulta `aprovacoes` filtrando por `peca_id` e `status = pendente`
   - Monta a URL de aprovação e mensagem WhatsApp (mesma lógica do PlanoTecnico)
   - Abre em nova aba

### Resultado
- Ao abrir uma peça com status "aguardando_aprovacao", o usuário verá os botões de ação para reenviar o link de aprovação via WhatsApp diretamente da tela de detalhe.

