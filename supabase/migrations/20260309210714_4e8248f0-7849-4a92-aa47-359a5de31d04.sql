
-- Políticas PERMISSIVE para acesso anônimo na página de aprovação pública

-- pecas: anon pode ler (necessário para página de aprovação)
CREATE POLICY anon_read_pecas ON pecas
  FOR SELECT TO anon USING (true);

-- tenants: anon pode ler (mostrar nome da empresa na aprovação)
CREATE POLICY anon_read_tenants ON tenants
  FOR SELECT TO anon USING (true);

-- fotos: anon pode ler (mostrar fotos na aprovação)
CREATE POLICY anon_read_fotos ON fotos
  FOR SELECT TO anon USING (true);

-- diagnosticos: anon pode ler (mostrar diagnóstico na aprovação)
CREATE POLICY anon_read_diagnosticos ON diagnosticos
  FOR SELECT TO anon USING (true);

-- planos_tecnicos: anon pode ler (mostrar plano na aprovação)
CREATE POLICY anon_read_planos_tecnicos ON planos_tecnicos
  FOR SELECT TO anon USING (true);

-- clientes: anon pode ler (mostrar nome do cliente na aprovação)
CREATE POLICY anon_read_clientes ON clientes
  FOR SELECT TO anon USING (true);
