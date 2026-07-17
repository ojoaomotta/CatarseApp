-- Tabela de Equipamentos
CREATE TABLE IF NOT EXISTS equipment (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL, -- 'Câmera', 'Lente', 'Áudio', 'Iluminação', 'Outros'
  serial_number text,
  status text NOT NULL DEFAULT 'Disponível', -- 'Disponível', 'Em Uso', 'Manutenção'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Logs de Movimentação
CREATE TABLE IF NOT EXISTS equipment_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id uuid REFERENCES equipment(id) ON DELETE CASCADE,
  equipment_name text NOT NULL,
  action text NOT NULL, -- 'Saída', 'Entrada'
  user_name text NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_logs ENABLE ROW LEVEL SECURITY;

-- Criar Políticas para Acesso Livre no App Desktop
DROP POLICY IF EXISTS "Allow all for equipment" ON equipment;
CREATE POLICY "Allow all for equipment" ON equipment FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for equipment_logs" ON equipment_logs;
CREATE POLICY "Allow all for equipment_logs" ON equipment_logs FOR ALL USING (true) WITH CHECK (true);

-- Inserir alguns equipamentos iniciais de exemplo
INSERT INTO equipment (name, category, serial_number, status) VALUES
  ('Sony FX3', 'Câmera', 'S/N: 2983719', 'Disponível'),
  ('Sony a7IV', 'Câmera', 'S/N: 1849102', 'Disponível'),
  ('Lente 24-70mm f/2.8 GM II', 'Lente', 'S/N: L839102', 'Disponível'),
  ('Lente 50mm f/1.2 GM', 'Lente', 'S/N: L102943', 'Disponível'),
  ('Microfone Rode Wireless PRO', 'Áudio', 'S/N: A203948', 'Disponível'),
  ('Bastão de Led Nanlite Pavotube', 'Iluminação', 'S/N: I948102', 'Disponível')
ON CONFLICT DO NOTHING;
