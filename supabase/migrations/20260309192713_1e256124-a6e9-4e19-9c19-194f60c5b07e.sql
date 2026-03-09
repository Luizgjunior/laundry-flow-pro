-- Recriar policies como PERMISSIVE para acesso público
DROP POLICY IF EXISTS aprovacoes_public_read_by_token ON aprovacoes;
CREATE POLICY aprovacoes_public_read_by_token ON aprovacoes
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS aprovacoes_public_update ON aprovacoes;
CREATE POLICY aprovacoes_public_update ON aprovacoes
  FOR UPDATE TO anon, authenticated
  USING (true);