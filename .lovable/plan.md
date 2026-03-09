

## Problema Identificado

O erro "Link inválido" ocorre porque as **políticas RLS da tabela `aprovacoes` estão todas configuradas como RESTRICTIVE** (restritivas). No PostgreSQL, quando não existe nenhuma política PERMISSIVE, o acesso é **sempre negado por padrão**, mesmo que uma policy restritiva tenha `using: true`.

As policies `aprovacoes_public_read_by_token` (SELECT) e `aprovacoes_public_update` (UPDATE) precisam ser **PERMISSIVE** para que o acesso anônimo funcione na página pública `/aprovar/:token`.

## Sobre o fluxo Autentique

O fluxo atual é: WhatsApp envia link → cliente aprova na página pública → opcionalmente formaliza com assinatura digital Autentique. O link `/aprovar/TOKEN` é a página de aprovação simples (que está correta), não a do Autentique. O problema é apenas o RLS bloqueando a leitura.

## Plano

### 1. Migração SQL - Corrigir RLS policies

Recriar as duas policies como PERMISSIVE:

```sql
-- Drop e recriar como PERMISSIVE
DROP POLICY IF EXISTS aprovacoes_public_read_by_token ON aprovacoes;
CREATE POLICY aprovacoes_public_read_by_token ON aprovacoes
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS aprovacoes_public_update ON aprovacoes;
CREATE POLICY aprovacoes_public_update ON aprovacoes
  FOR UPDATE TO anon, authenticated
  USING (true);
```

### Resultado
Com as policies corrigidas, a página `/aprovar/:token` conseguirá ler e atualizar a aprovação, eliminando o erro "Link inválido".

