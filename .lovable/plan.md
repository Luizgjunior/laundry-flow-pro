

## Situação Atual

O botão "Imprimir Etiqueta" existe, mas usa apenas `window.print()` sem nenhum estilo de impressão (`@media print`). Isso significa que ao clicar, o navegador tenta imprimir a **página inteira** — menus, botões, tudo — em vez de apenas a etiqueta com QR Code.

## Plano de Implementação

### 1. Criar estilos de impressão (`@media print`) no `index.css`
- Esconder tudo da página exceto a área da etiqueta
- Formatar a etiqueta para caber em papel de etiqueta (ex: 50x30mm ou similar)

### 2. Criar componente `EtiquetaPrint` dedicado
- Exibe: QR Code + código da peça + nome do cliente + tipo da peça
- Layout otimizado para impressão em etiquetadora ou A4
- Visível apenas no `@media print`, escondido na tela

### 3. Atualizar `NovaPeca.tsx` (tela de confirmação)
- Renderizar o `EtiquetaPrint` com os dados da peça criada
- Manter o botão "Imprimir Etiqueta" com `window.print()`

### 4. Alternativa: Download como imagem
- Adicionar botão "Baixar Etiqueta" que converte o QR Code para PNG usando canvas
- Útil para quem não tem impressora conectada e quer enviar por WhatsApp ou salvar

### Resultado
- Botão "Imprimir Etiqueta" → abre diálogo de impressão mostrando **apenas** a etiqueta formatada
- Botão "Baixar Etiqueta" → salva PNG no celular

