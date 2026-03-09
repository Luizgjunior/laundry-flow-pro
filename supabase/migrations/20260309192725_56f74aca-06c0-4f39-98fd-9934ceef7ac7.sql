-- Restringir UPDATE apenas para aprovações pendentes
DROP POLICY IF EXISTS aprovacoes_public_update ON aprovacoes;
CREATE POLICY aprovacoes_public_update ON aprovacoes
  FOR UPDATE TO anon, authenticated
  USING (status = 'pendente')
  WITH CHECK (status IN ('aprovado', 'recusado'));